"""Creator onboarding and adaptive assessment domain service."""

from typing import Optional, Dict, Any, List
from uuid import UUID, uuid4
from datetime import datetime, timezone

from app.services.base import BaseService
from app.core.errors import NotFoundException, ValidationException, ForbiddenException
from app.schemas.assessment import (
    AssessmentStatus,
    StartAssessmentRequest,
    SaveResponseRequest,
    BatchResponsesRequest,
    AssessmentProgressResponse,
    AssessmentResultResponse,
    SurveyConfigResponse,
    SurveyQuestion,
)
from app.services.question_bank import question_bank
from app.services.assessment_engine import assessment_engine
from app.repositories import creator_repository
from app.schemas.creator import CreatorLevel


class OnboardingService(BaseService):
    """
    Manages creator onboarding sessions, adaptive surveys, auto-saving,
    resume support, and authoritative capability assessment execution.
    """

    def __init__(self):
        super().__init__("onboarding")
        # In-memory session and response stores for fast access & dev mode persistence
        self._assessments_store: Dict[str, Dict[str, Any]] = {}
        self._responses_store: Dict[str, Dict[str, Any]] = {}  # assessment_id -> { question_id: value }
        self._results_store: Dict[str, AssessmentResultResponse] = {}  # assessment_id -> AssessmentResultResponse

    def get_survey_config(self) -> SurveyConfigResponse:
        """Returns metadata configuration including specializations, tools, and experience options."""
        return SurveyConfigResponse(
            specializations=question_bank.get_specializations(),
            tool_catalog=question_bank.get_tool_catalog(),
            experience_options=question_bank.get_experience_options(),
        )

    def get_questions_for_specialization(self, specialization: Optional[str] = None) -> List[SurveyQuestion]:
        """Returns adaptive questions tailored to creator's specialization."""
        return question_bank.get_adaptive_questions(primary_specialization=specialization)

    async def start_or_resume_assessment(
        self,
        user_id: str,
        request: Optional[StartAssessmentRequest] = None,
    ) -> AssessmentProgressResponse:
        """
        Retrieves active in-progress assessment or creates a new onboarding session.
        Enables seamless resume if creator accidentally refreshed or navigated away.
        """
        # Check for existing in-progress session
        for sess in self._assessments_store.values():
            if sess["user_id"] == user_id and sess["status"] == AssessmentStatus.IN_PROGRESS:
                a_id = sess["id"]
                resp_map = self._responses_store.get(str(a_id), {})
                return AssessmentProgressResponse(
                    assessment_id=a_id,
                    status=sess["status"],
                    current_step_index=sess["current_step_index"],
                    total_steps=sess["total_steps"],
                    primary_specialization=sess["primary_specialization"],
                    secondary_specializations=sess["secondary_specializations"],
                    responses=resp_map,
                    integrity_signals=sess["integrity_signals"],
                )

        # Create new assessment session
        new_id = uuid4()
        primary_spec = request.primary_specialization if request else "ai_filmmaking"
        sec_specs = request.secondary_specializations if request else []

        # Count total adaptive questions
        questions = question_bank.get_adaptive_questions(primary_specialization=primary_spec)
        total_steps = len(questions)

        session_record = {
            "id": new_id,
            "user_id": user_id,
            "status": AssessmentStatus.IN_PROGRESS,
            "primary_specialization": primary_spec,
            "secondary_specializations": sec_specs,
            "current_step_index": 0,
            "total_steps": max(12, total_steps),
            "integrity_signals": {"tab_switches": 0, "copy_attempts": 0},
            "started_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        self._assessments_store[str(new_id)] = session_record
        self._responses_store[str(new_id)] = {}

        self.logger.info(f"Started new assessment session {new_id} for user {user_id}")

        return AssessmentProgressResponse(
            assessment_id=new_id,
            status=AssessmentStatus.IN_PROGRESS,
            current_step_index=0,
            total_steps=session_record["total_steps"],
            primary_specialization=primary_spec,
            secondary_specializations=sec_specs,
            responses={},
            integrity_signals=session_record["integrity_signals"],
        )

    async def save_response(
        self,
        user_id: str,
        request: SaveResponseRequest,
    ) -> AssessmentProgressResponse:
        """
        Saves a single question response with auto-save & progress tracking.
        Enforces ownership validation to prevent tampering.
        """
        assessment_id_str = str(request.assessment_id) if request.assessment_id else None

        # Resolve session
        session = None
        if assessment_id_str and assessment_id_str in self._assessments_store:
            session = self._assessments_store[assessment_id_str]
        else:
            # Find active session by user_id
            for sess in self._assessments_store.values():
                if sess["user_id"] == user_id and sess["status"] == AssessmentStatus.IN_PROGRESS:
                    session = sess
                    assessment_id_str = str(sess["id"])
                    break

        if not session:
            # Auto-create if not found
            resumed = await self.start_or_resume_assessment(user_id)
            assessment_id_str = str(resumed.assessment_id)
            session = self._assessments_store[assessment_id_str]

        # Ownership verification
        if session["user_id"] != user_id:
            raise ForbiddenException("Unauthorized: Cannot modify another creator's assessment session.")

        if session["status"] == AssessmentStatus.COMPLETED:
            raise ValidationException("This assessment has already been finalized and cannot be modified.")

        # Update responses store
        if assessment_id_str not in self._responses_store:
            self._responses_store[assessment_id_str] = {}

        self._responses_store[assessment_id_str][request.question_id] = request.response_value

        # Update primary specialization if this question set it
        if request.question_id == "primary_specialization" and isinstance(request.response_value, str):
            session["primary_specialization"] = request.response_value

        # Update step index and integrity signals if provided
        if request.current_step_index is not None:
            session["current_step_index"] = max(session["current_step_index"], request.current_step_index)

        if request.integrity_signals:
            for k, v in request.integrity_signals.items():
                session["integrity_signals"][k] = session["integrity_signals"].get(k, 0) + v

        session["updated_at"] = datetime.now(timezone.utc)

        return AssessmentProgressResponse(
            assessment_id=session["id"],
            status=session["status"],
            current_step_index=session["current_step_index"],
            total_steps=session["total_steps"],
            primary_specialization=session.get("primary_specialization"),
            secondary_specializations=session.get("secondary_specializations", []),
            responses=self._responses_store[assessment_id_str],
            integrity_signals=session["integrity_signals"],
        )

    async def save_batch_responses(
        self,
        user_id: str,
        request: BatchResponsesRequest,
    ) -> AssessmentProgressResponse:
        """Batch saves multiple responses and updates current survey position."""
        resumed = await self.start_or_resume_assessment(user_id)
        a_id_str = str(resumed.assessment_id)
        session = self._assessments_store[a_id_str]

        for item in request.responses:
            self._responses_store[a_id_str][item.question_id] = item.response_value
            if item.question_id == "primary_specialization" and isinstance(item.response_value, str):
                session["primary_specialization"] = item.response_value

        session["current_step_index"] = request.current_step_index
        if request.integrity_signals:
            for k, v in request.integrity_signals.items():
                session["integrity_signals"][k] = session["integrity_signals"].get(k, 0) + v

        return AssessmentProgressResponse(
            assessment_id=session["id"],
            status=session["status"],
            current_step_index=session["current_step_index"],
            total_steps=session["total_steps"],
            primary_specialization=session.get("primary_specialization"),
            secondary_specializations=session.get("secondary_specializations", []),
            responses=self._responses_store[a_id_str],
            integrity_signals=session["integrity_signals"],
        )

    async def get_progress(self, user_id: str) -> AssessmentProgressResponse:
        """Returns the current user's assessment progress."""
        for sess in self._assessments_store.values():
            if sess["user_id"] == user_id:
                a_id = sess["id"]
                resp_map = self._responses_store.get(str(a_id), {})
                return AssessmentProgressResponse(
                    assessment_id=a_id,
                    status=sess["status"],
                    current_step_index=sess["current_step_index"],
                    total_steps=sess["total_steps"],
                    primary_specialization=sess.get("primary_specialization"),
                    secondary_specializations=sess.get("secondary_specializations", []),
                    responses=resp_map,
                    integrity_signals=sess.get("integrity_signals", {}),
                )

        # Default: not started yet, auto-provision
        return await self.start_or_resume_assessment(user_id)

    async def submit_assessment(
        self,
        user_id: str,
        assessment_id: Optional[UUID] = None,
    ) -> AssessmentResultResponse:
        """
        Finalizes assessment, executes server-side capability scoring,
        assigns evidence-based Creator Level, and updates creator profile.
        """
        # Locate session
        session = None
        a_id_str = str(assessment_id) if assessment_id else None

        if a_id_str and a_id_str in self._assessments_store:
            session = self._assessments_store[a_id_str]
        else:
            for sess in self._assessments_store.values():
                if sess["user_id"] == user_id:
                    session = sess
                    a_id_str = str(sess["id"])
                    break

        if not session:
            raise NotFoundException("Assessment Session", str(user_id))

        if session["user_id"] != user_id:
            raise ForbiddenException("Unauthorized: Cannot submit an assessment owned by another creator.")

        responses = self._responses_store.get(a_id_str, {})
        spec = session.get("primary_specialization", "ai_filmmaking")

        # Execute authoritative calculation
        result = assessment_engine.calculate_results(
            assessment_id=session["id"],
            user_id=user_id,
            responses=responses,
            specialization=spec,
        )

        # Update session status
        session["status"] = AssessmentStatus.COMPLETED
        session["completed_at"] = datetime.now(timezone.utc)
        self._results_store[a_id_str] = result

        # Map calculated level to CreatorProfile
        level_map = {
            "LEVEL_1_EXPLORER": CreatorLevel.EXPLORER,
            "LEVEL_2_PRACTITIONER": CreatorLevel.EXPLORER,
            "LEVEL_3_SKILLED": CreatorLevel.PRO_CREATOR,
            "LEVEL_4_ADVANCED": CreatorLevel.PRO_CREATOR,
            "LEVEL_5_PROFESSIONAL": CreatorLevel.AI_MASTER,
        }
        mapped_level = level_map.get(result.calculated_level, CreatorLevel.EXPLORER)

        # Extract tools and skills from responses
        tools_list = responses.get("tools_selected", [])
        if not isinstance(tools_list, list):
            tools_list = []

        display_name = responses.get("creator_display_name", "AI Creator")

        # Update or create creator profile
        try:
            creator_profile = await creator_repository.get_by_user_id(user_id)
            if creator_profile:
                update_data = {
                    "level": mapped_level,
                    "primary_specialization": spec,
                    "ai_tools": tools_list,
                    "skills": result.strengths,
                    "reputation_score": round(result.overall_score / 20.0, 2),  # 0.0 - 5.0 scale
                    "assessment_completed": True,
                    "metadata": {
                        "assessment_id": str(session["id"]),
                        "calculated_level": result.calculated_level,
                        "level_name": result.level_name,
                        "overall_score": result.overall_score,
                    },
                }
                await creator_repository.update(creator_profile.id, update_data)
        except Exception as e:
            self.logger.warning(f"Could not persist profile updates to repository: {e}")

        self.logger.info(
            f"Assessment {session['id']} completed for user {user_id}: "
            f"Score={result.overall_score}, Level={result.level_name}"
        )

        return result

    async def get_assessment_result(
        self,
        user_id: str,
        assessment_id: Optional[UUID] = None,
    ) -> AssessmentResultResponse:
        """Returns the calculated result for the user's assessment."""
        a_id_str = str(assessment_id) if assessment_id else None

        if a_id_str and a_id_str in self._results_store:
            res = self._results_store[a_id_str]
            if res.user_id != user_id:
                raise ForbiddenException("Unauthorized: Cannot view another creator's assessment result.")
            return res

        for res in self._results_store.values():
            if res.user_id == user_id:
                return res

        # If not evaluated yet, run evaluation on current progress
        return await self.submit_assessment(user_id, assessment_id)


onboarding_service = OnboardingService()
