"""Survey repository managing survey drafts, submitted responses, and profiles."""

from typing import Dict, Any, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.schemas.surveys import SurveyResponseRecord
from app.core.logging import get_logger

logger = get_logger("survey_repository")


class SurveyRepository:
    def __init__(self):
        # Key: (user_id_str, survey_type) -> SurveyResponseRecord
        self._responses: Dict[str, SurveyResponseRecord] = {}
        # Key: user_id_str -> Dict[str, Any]
        self._creator_profiles: Dict[str, Dict[str, Any]] = {}
        self._brand_profiles: Dict[str, Dict[str, Any]] = {}

    def _get_key(self, user_id: str, survey_type: str) -> str:
        return f"{user_id}:{survey_type.upper()}"

    async def get_response(self, user_id: str, survey_type: str) -> Optional[SurveyResponseRecord]:
        key = self._get_key(user_id, survey_type)
        return self._responses.get(key)

    async def save_draft(
        self,
        user_id: str,
        survey_type: str,
        current_section_index: int,
        answers: Dict[str, Any],
    ) -> SurveyResponseRecord:
        key = self._get_key(user_id, survey_type)
        now = datetime.now(timezone.utc).isoformat()

        existing = self._responses.get(key)
        merged_answers = existing.answers.copy() if existing else {}
        merged_answers.update(answers)

        record = SurveyResponseRecord(
            id=existing.id if existing else str(uuid4()),
            user_id=user_id,
            survey_type=survey_type.upper(),
            survey_version="1.0.0",
            current_section_index=current_section_index,
            is_completed=False,
            answers=merged_answers,
            updated_at=now,
        )
        self._responses[key] = record
        logger.info(f"Saved survey draft for user {user_id} ({survey_type}) at section {current_section_index}")
        return record

    async def submit_survey(
        self,
        user_id: str,
        survey_type: str,
        answers: Dict[str, Any],
    ) -> SurveyResponseRecord:
        key = self._get_key(user_id, survey_type)
        now = datetime.now(timezone.utc).isoformat()

        existing = self._responses.get(key)
        merged_answers = existing.answers.copy() if existing else {}
        merged_answers.update(answers)

        record = SurveyResponseRecord(
            id=existing.id if existing else str(uuid4()),
            user_id=user_id,
            survey_type=survey_type.upper(),
            survey_version="1.0.0",
            current_section_index=999,  # Completed
            is_completed=True,
            answers=merged_answers,
            completed_at=now,
            updated_at=now,
        )
        self._responses[key] = record

        # Extract structured profile
        st = survey_type.upper()
        if st == "CREATOR":
            self._creator_profiles[user_id] = {
                "user_id": user_id,
                "display_name": merged_answers.get("cr_display_name", "Creator"),
                "headline": merged_answers.get("cr_headline", ""),
                "bio": merged_answers.get("cr_bio", ""),
                "country": merged_answers.get("cr_country", ""),
                "languages": merged_answers.get("cr_languages", []),
                "years_experience": merged_answers.get("cr_experience_years", 1),
                "creator_type": merged_answers.get("cr_creator_type", "INDIVIDUAL"),
                "website_url": merged_answers.get("cr_website", ""),
                "specializations": merged_answers.get("cr_specializations", []),
                "technical_skills": merged_answers.get("cr_skills", []),
                "tools_experience": merged_answers.get("cr_tools_catalog", []),
                "pricing_model": merged_answers.get("cr_pricing_model", "fixed_milestone"),
                "starting_price": merged_answers.get("cr_starting_price", 250),
                "availability": merged_answers.get("cr_current_availability", "immediate"),
                "updated_at": now,
            }
            try:
                from app.services import creator_service
                from app.repositories import creator_repository
                existing_creator = await creator_repository.get_by_user_id(user_id)
                if not existing_creator:
                    existing_creator = await creator_service.get_profile_by_user_id(user_id)
                if existing_creator:
                    update_fields = {}
                    if merged_answers.get("cr_display_name"):
                        update_fields["full_name"] = merged_answers["cr_display_name"]
                    if merged_answers.get("cr_headline"):
                        update_fields["headline"] = merged_answers["cr_headline"]
                    if merged_answers.get("cr_bio"):
                        update_fields["bio"] = merged_answers["cr_bio"]
                    if merged_answers.get("cr_country"):
                        update_fields["location"] = merged_answers["cr_country"]
                    if merged_answers.get("cr_starting_price"):
                        update_fields["hourly_rate_cents"] = int(float(merged_answers["cr_starting_price"])) * 100
                    specs = merged_answers.get("cr_specializations", [])
                    if specs and isinstance(specs, list):
                        update_fields["primary_specialization"] = specs[0]
                        if len(specs) > 1:
                            update_fields["secondary_specializations"] = specs[1:]
                    skills = merged_answers.get("cr_skills", [])
                    if skills and isinstance(skills, list):
                        update_fields["skills"] = skills
                    tools_catalog = merged_answers.get("cr_tools_catalog", [])
                    if tools_catalog and isinstance(tools_catalog, list):
                        tool_names = [t.get("tool_name") if isinstance(t, dict) else str(t) for t in tools_catalog]
                        update_fields["ai_tools"] = tool_names
                    if update_fields:
                        await creator_repository.update(existing_creator.id, update_fields)
            except Exception as e:
                logger.warning(f"Failed to sync survey to creator profile: {e}")

        elif st in ["BRAND", "AGENCY"]:
            self._brand_profiles[user_id] = {
                "user_id": user_id,
                "organization_name": merged_answers.get("br_organization_name", "Brand Org"),
                "organization_type": merged_answers.get("br_organization_type", "direct_brand"),
                "industry": merged_answers.get("br_industry", "ecommerce"),
                "website_url": merged_answers.get("br_website", ""),
                "contact_role": merged_answers.get("br_contact_role", ""),
                "primary_objective": merged_answers.get("br_primary_objective", "brand_awareness"),
                "required_specializations": merged_answers.get("br_required_specializations", []),
                "aspect_ratios": merged_answers.get("br_aspect_ratios", []),
                "campaign_budget": merged_answers.get("br_campaign_budget", "3k_10k"),
                "usage_channels": merged_answers.get("br_usage_channels", []),
                "updated_at": now,
            }
            try:
                from app.repositories import brand_repository
                existing_brand = await brand_repository.get_by_user_id(user_id)
                if existing_brand:
                    b_updates = {}
                    if merged_answers.get("br_organization_name"):
                        b_updates["company_name"] = merged_answers["br_organization_name"]
                    if merged_answers.get("br_industry"):
                        b_updates["primary_industry"] = merged_answers["br_industry"]
                    if merged_answers.get("br_website"):
                        b_updates["website"] = merged_answers["br_website"]
                    if b_updates:
                        await brand_repository.update(existing_brand.id, b_updates)
            except Exception as e:
                logger.warning(f"Failed to sync survey to brand profile: {e}")

        logger.info(f"Survey successfully submitted for user {user_id} ({survey_type})")
        return record

    async def get_creator_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        return self._creator_profiles.get(user_id)

    async def get_brand_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        return self._brand_profiles.get(user_id)


survey_repository = SurveyRepository()
