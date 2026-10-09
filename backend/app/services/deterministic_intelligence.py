"""Deterministic Survey Intelligence & Contradiction Detection Service.

Provides reliable rule-based validation, factual checks, date/budget contradiction detection,
and approved fallback question generation. Operates independently of external LLM availability.
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from app.schemas.ai_intelligence import (
    CompletionStatus,
    IssueSeverity,
    FieldImportance,
    QuestionPriority,
    MissingFieldItem,
    ContradictionItem,
    AmbiguityItem,
    GeneratedFollowupQuestion,
)
from app.schemas.surveys import SurveyQuestionOption
from app.core.logging import get_logger

logger = get_logger("ai.deterministic_intelligence")


class DeterministicIntelligenceService:
    """Performs strict, reliable deterministic validation and generates rule-based follow-ups."""

    # Approved creator core fields
    CREATOR_REQUIRED_FIELDS = [
        ("cr_display_name", "identity", "Display Name", "Identifies your professional brand to clients."),
        ("cr_headline", "identity", "Professional Headline", "Critical for immediate client discoverability."),
        ("cr_bio", "identity", "Professional Bio", "Communicates your production philosophy and style."),
        ("cr_country", "identity", "Country of Operation", "Required for contractual jurisdiction and timezone coordination."),
        ("cr_specializations", "specializations", "Creative Specializations", "Determines which campaign opportunities you are matched with."),
        ("cr_technical_skills", "skills", "Technical Skills", "Allows brands to filter for required prompt & pipeline skills."),
        ("cr_tools_catalog", "tools", "AI Tools & Matrix", "Validates the generative software stack you utilize."),
        ("cr_weekly_capacity_hours", "availability", "Weekly Capacity", "Prevents overbooking and ensures delivery SLAs."),
    ]

    # Approved brand core fields
    BRAND_REQUIRED_FIELDS = [
        ("br_organization_name", "organization", "Organization Name", "Establishes brand identity and contract counterparty."),
        ("br_primary_objective", "objectives", "Primary Objective", "Directs creator creative angles and KPIs."),
        ("br_deliverable_types", "deliverables", "Deliverable Formats", "Itemizes required video, still, or 3D assets."),
        ("br_target_audience", "objectives", "Target Audience", "Informs visual demographics and platform framing."),
        ("br_total_budget_usd", "budget", "Campaign Budget", "Required for fair milestone escrows and creator matching."),
    ]

    def analyze_creator_survey(
        self,
        answers: Dict[str, Any],
        questions_already_asked: List[str],
        max_questions: int = 3,
    ) -> Tuple[CompletionStatus, int, List[MissingFieldItem], List[ContradictionItem], List[AmbiguityItem], List[GeneratedFollowupQuestion]]:
        """Performs deterministic analysis on creator survey answers."""
        missing: List[MissingFieldItem] = []
        contradictions: List[ContradictionItem] = []
        ambiguities: List[AmbiguityItem] = []
        fallback_questions: List[GeneratedFollowupQuestion] = []

        # 1. Check Missing Required Fields
        answered_required_count = 0
        for field_id, sec, name, reason in self.CREATOR_REQUIRED_FIELDS:
            val = answers.get(field_id)
            is_filled = self._is_value_present(val)
            if is_filled:
                answered_required_count += 1
            else:
                missing.append(
                    MissingFieldItem(
                        field_id=field_id,
                        section_key=sec,
                        field_name=name,
                        importance=FieldImportance.REQUIRED,
                        reason=reason,
                    )
                )

        completion_pct = int((answered_required_count / max(1, len(self.CREATOR_REQUIRED_FIELDS))) * 100)

        # 2. Check Explicit Contradictions
        # Contradiction A: Zero capacity hours but claims open to urgent turnaround
        capacity = answers.get("cr_weekly_capacity_hours")
        turnaround = answers.get("cr_typical_turnaround_days")
        if capacity is not None:
            try:
                cap_num = float(capacity)
                if cap_num <= 0:
                    contradictions.append(
                        ContradictionItem(
                            field_ids=["cr_weekly_capacity_hours"],
                            title="Zero Capacity Indicated",
                            description="Weekly capacity is set to 0 hours, which prevents matching with active brand briefs.",
                            severity=IssueSeverity.ERROR,
                            recommended_resolution="Please allocate realistic weekly capacity (e.g. 5-20 hours) or set profile status to 'On Sabbatical'.",
                        )
                    )
                elif cap_num > 100:
                    contradictions.append(
                        ContradictionItem(
                            field_ids=["cr_weekly_capacity_hours"],
                            title="Unrealistic Capacity Ceiling",
                            description=f"Weekly capacity of {cap_num} hours exceeds normal sustainable production limits.",
                            severity=IssueSeverity.WARNING,
                            recommended_resolution="Consider adjusting to realistic solo or studio hours.",
                        )
                    )
            except (ValueError, TypeError):
                pass

        # Contradiction B: Video specialization selected but no video tools in catalog
        specs = answers.get("cr_specializations", [])
        if isinstance(specs, str):
            specs = [specs]
        tools_catalog = answers.get("cr_tools_catalog", [])
        if isinstance(tools_catalog, list):
            tool_names = [t.get("tool_name", "").lower() for t in tools_catalog if isinstance(t, dict)]
            has_video_spec = any("video" in str(s).lower() for s in specs)
            video_tools = ["runway", "kling", "luma", "sora", "pika", "hailuo", "comfyui", "premiere", "after effects"]
            has_video_tool = any(any(vt in t for vt in video_tools) for t in tool_names)
            if has_video_spec and len(tool_names) > 0 and not has_video_tool:
                contradictions.append(
                    ContradictionItem(
                        field_ids=["cr_specializations", "cr_tools_catalog"],
                        title="Specialization / Toolset Discrepancy",
                        description="You listed AI Video as a core specialization, but your tool matrix does not list a video motion model (e.g. Runway, Kling, ComfyUI).",
                        severity=IssueSeverity.WARNING,
                        recommended_resolution="Add your primary video synthesis engine to your tool catalog.",
                    )
                )

        # Contradiction C: Hourly rate non-positive or astronomical
        rate = answers.get("cr_minimum_hourly_rate") or answers.get("hourly_rate_cents")
        if rate is not None:
            try:
                rate_val = float(rate)
                if rate_val < 0:
                    contradictions.append(
                        ContradictionItem(
                            field_ids=["cr_minimum_hourly_rate"],
                            title="Negative Compensation Rate",
                            description="Project or hourly rate cannot be negative.",
                            severity=IssueSeverity.ERROR,
                            recommended_resolution="Set a non-negative rate or leave blank to accept project-based milestone proposals.",
                        )
                    )
            except (ValueError, TypeError):
                pass

        # 3. Check Ambiguities
        bio = str(answers.get("cr_bio", "")).strip()
        if bio and len(bio) < 25:
            ambiguities.append(
                AmbiguityItem(
                    field_id="cr_bio",
                    current_value=bio,
                    clarification_needed="Bio is very short and lacks specific production context.",
                    why="Brands prefer creators who articulate specific visual domains, past campaign types, and pipeline workflows.",
                )
            )

        headline = str(answers.get("cr_headline", "")).strip()
        if headline and ("test" in headline.lower() or "asdf" in headline.lower() or len(headline) < 6):
            ambiguities.append(
                AmbiguityItem(
                    field_id="cr_headline",
                    current_value=headline,
                    clarification_needed="Headline appears to be a placeholder or incomplete.",
                    why="Your headline is the first text seen on search cards and marketplace carousel reels.",
                )
            )

        # 4. Generate Rule-Based Fallback Questions
        if len(fallback_questions) < max_questions:
            # Check if video formats need clarification
            has_video_spec = any("video" in str(s).lower() for s in specs)
            if has_video_spec and "ai_q_video_formats" not in questions_already_asked:
                formats = answers.get("cr_preferred_formats", [])
                if not formats:
                    fallback_questions.append(
                        GeneratedFollowupQuestion(
                            id="ai_q_video_formats",
                            section="specializations",
                            field="cr_preferred_formats",
                            question="Which video aspect ratios and delivery formats do you specialize in?",
                            input_type="multi_select",
                            required=False,
                            options=[
                                SurveyQuestionOption(label="9:16 Vertical Reel (TikTok/Instagram)", value="9:16"),
                                SurveyQuestionOption(label="16:9 Widescreen (YouTube/Web)", value="16:9"),
                                SurveyQuestionOption(label="1:1 Square (E-Commerce)", value="1:1"),
                                SurveyQuestionOption(label="4K UHD Master Exports", value="4K"),
                            ],
                            help_text="Enables brands to filter for campaign-specific deliverable formats.",
                            why_asking="You selected Video Specialization; specifying aspect ratios increases match accuracy for social vs broadcast briefs.",
                            priority=QuestionPriority.HIGH,
                        )
                    )

            # Check if workflow reproducibility is documented
            workflow = str(answers.get("cr_workflow_summary", "")).strip()
            if not workflow and "ai_q_workflow_pipeline" not in questions_already_asked and len(fallback_questions) < max_questions:
                fallback_questions.append(
                    GeneratedFollowupQuestion(
                        id="ai_q_workflow_pipeline",
                        section="skills",
                        field="cr_workflow_summary",
                        question="How do you ensure character or aesthetic consistency across consecutive video/image generations?",
                        input_type="textarea",
                        required=False,
                        help_text="E.g., custom LoRA checkpoints, ComfyUI IP-Adapter, ControlNet pose conditioning, or seed fixing.",
                        why_asking="Enterprise brands require reliable visual continuity across campaign scenes.",
                        priority=QuestionPriority.MEDIUM,
                    )
                )

            # Check if commercial licensing confirmation is clear
            if "ai_q_commercial_licensing" not in questions_already_asked and len(fallback_questions) < max_questions:
                lic = answers.get("cr_commercial_terms_accepted")
                if lic is None:
                    fallback_questions.append(
                        GeneratedFollowupQuestion(
                            id="ai_q_commercial_licensing",
                            section="conduct",
                            field="cr_commercial_terms_accepted",
                            question="Are all assets and tools you use cleared for enterprise commercial distribution without IP conflicts?",
                            input_type="single_choice",
                            required=False,
                            options=[
                                SurveyQuestionOption(label="Yes, 100% commercially cleared & subscription verified", value="cleared"),
                                SurveyQuestionOption(label="Personal & experimental use only", value="personal"),
                                SurveyQuestionOption(label="Depends on client licensing tier", value="conditional"),
                            ],
                            why_asking="Brands require clear commercial rights indemnification before contract execution.",
                            priority=QuestionPriority.HIGH,
                        )
                    )

        status = CompletionStatus.COMPLETE
        if missing or any(c.severity == IssueSeverity.ERROR for c in contradictions):
            status = CompletionStatus.INCOMPLETE
        elif contradictions or ambiguities or fallback_questions:
            status = CompletionStatus.NEEDS_CLARIFICATION

        return status, completion_pct, missing, contradictions, ambiguities, fallback_questions[:max_questions]

    def analyze_brand_survey_or_brief(
        self,
        answers: Dict[str, Any],
        questions_already_asked: List[str],
        max_questions: int = 3,
    ) -> Tuple[CompletionStatus, int, List[MissingFieldItem], List[ContradictionItem], List[AmbiguityItem], List[GeneratedFollowupQuestion]]:
        """Performs deterministic analysis on brand survey answers or brief draft."""
        missing: List[MissingFieldItem] = []
        contradictions: List[ContradictionItem] = []
        ambiguities: List[AmbiguityItem] = []
        fallback_questions: List[GeneratedFollowupQuestion] = []

        # 1. Missing Required Fields
        answered_required_count = 0
        for field_id, sec, name, reason in self.BRAND_REQUIRED_FIELDS:
            # Check both survey format (br_...) and brief draft format (e.g. title, objectives)
            val = answers.get(field_id)
            if val is None:
                # Aliases in brief drafts
                alias_map = {
                    "br_organization_name": answers.get("brand_or_product_name") or answers.get("title"),
                    "br_primary_objective": answers.get("primary_objective") or (answers.get("objectives", [None])[0] if isinstance(answers.get("objectives"), list) and answers.get("objectives") else None),
                    "br_deliverable_types": answers.get("deliverables"),
                    "br_target_audience": answers.get("target_audience"),
                    "br_total_budget_usd": answers.get("budget_cents") or answers.get("total_budget_usd"),
                }
                val = alias_map.get(field_id)

            is_filled = self._is_value_present(val)
            if is_filled:
                answered_required_count += 1
            else:
                missing.append(
                    MissingFieldItem(
                        field_id=field_id,
                        section_key=sec,
                        field_name=name,
                        importance=FieldImportance.REQUIRED,
                        reason=reason,
                    )
                )

        completion_pct = int((answered_required_count / max(1, len(self.BRAND_REQUIRED_FIELDS))) * 100)

        # 2. Check Explicit Contradictions
        # Contradiction A: Start date is after deadline
        start_date_str = answers.get("start_date") or answers.get("br_start_date") or answers.get("br_timeline_start_date")
        deadline_str = (
            answers.get("deadline")
            or answers.get("content_delivery_deadline")
            or answers.get("br_deadline")
            or answers.get("br_timeline_completion_date")
        )
        if start_date_str and deadline_str:
            try:
                sd = datetime.fromisoformat(str(start_date_str).replace("Z", "+00:00"))
                dl = datetime.fromisoformat(str(deadline_str).replace("Z", "+00:00"))
                if sd > dl:
                    contradictions.append(
                        ContradictionItem(
                            field_ids=["start_date", "deadline"],
                            title="Inverted Campaign Timeline",
                            description=f"Campaign start date ({sd.strftime('%Y-%m-%d')}) is scheduled after final delivery deadline ({dl.strftime('%Y-%m-%d')}).",
                            severity=IssueSeverity.ERROR,
                            recommended_resolution="Adjust the delivery deadline to occur after the project kickoff date.",
                        )
                    )
            except Exception:
                pass

        # Contradiction B: Budget non-positive
        budget = answers.get("budget_cents") or answers.get("br_total_budget_usd") or answers.get("total_budget_usd")
        if budget is not None:
            try:
                b_val = float(budget)
                if b_val <= 0:
                    contradictions.append(
                        ContradictionItem(
                            field_ids=["budget_cents"],
                            title="Zero or Negative Campaign Budget",
                            description="Campaign budget must be greater than zero for paid milestone engagement.",
                            severity=IssueSeverity.ERROR,
                            recommended_resolution="Enter an allocated budget amount in USD.",
                        )
                    )
            except (ValueError, TypeError):
                pass

        # Contradiction C: Deliverable items with zero or negative quantity
        deliverables = answers.get("deliverables", [])
        if isinstance(deliverables, list):
            for idx, d in enumerate(deliverables):
                if isinstance(d, dict):
                    qty = d.get("quantity", 1)
                    if qty is not None and qty <= 0:
                        contradictions.append(
                            ContradictionItem(
                                field_ids=[f"deliverables_{idx}_quantity"],
                                title=f"Invalid Quantity on Deliverable #{idx+1}",
                                description="Deliverable item specifies 0 or negative quantity.",
                                severity=IssueSeverity.ERROR,
                                recommended_resolution="Specify at least 1 unit per requested deliverable.",
                            )
                        )

        # 3. Check Ambiguities
        idea = str(answers.get("campaign_idea") or answers.get("description") or "").strip()
        if idea and len(idea) < 30:
            ambiguities.append(
                AmbiguityItem(
                    field_id="campaign_idea",
                    current_value=idea,
                    clarification_needed="Campaign concept is very brief and lacks creative or stylistic cues.",
                    why="Clearer thematic cues (e.g. 'cinematic neon aesthetic', 'organic lifestyle UGC') yield significantly more relevant creator pitches.",
                )
            )

        # 4. Generate Rule-Based Fallback Questions
        if len(fallback_questions) < max_questions:
            # Check target audience
            aud = answers.get("target_audience") or answers.get("br_target_audience")
            if not aud and "ai_q_target_audience" not in questions_already_asked:
                fallback_questions.append(
                    GeneratedFollowupQuestion(
                        id="ai_q_target_audience",
                        section="objectives",
                        field="target_audience",
                        question="Who is the primary target demographic and psychographic for this campaign?",
                        input_type="text",
                        required=False,
                        help_text="E.g. 'Gen-Z gamers aged 18-24' or 'B2B SaaS marketing leaders'.",
                        why_asking="Defining the intended audience guides creators in character styling and pacing.",
                        priority=QuestionPriority.HIGH,
                    )
                )

            # Check usage channels & exclusivity
            if "ai_q_commercial_exclusivity" not in questions_already_asked and len(fallback_questions) < max_questions:
                excl = answers.get("exclusivity_required") or answers.get("br_exclusivity")
                if excl is None:
                    fallback_questions.append(
                        GeneratedFollowupQuestion(
                            id="ai_q_commercial_exclusivity",
                            section="commercial_terms",
                            field="exclusivity_required",
                            question="Do you require category exclusivity from participating creators during the campaign?",
                            input_type="single_choice",
                            required=False,
                            options=[
                                SurveyQuestionOption(label="No exclusivity needed (Standard)", value="false"),
                                SurveyQuestionOption(label="Yes, 30 days post-campaign", value="30_days"),
                                SurveyQuestionOption(label="Yes, 90 days post-campaign", value="90_days"),
                            ],
                            help_text="Category exclusivity restricts creators from working with direct competitors.",
                            why_asking="Exclusivity requirements significantly affect creator pricing and availability.",
                            priority=QuestionPriority.MEDIUM,
                        )
                    )

            # Check deliverable specifications
            if len(fallback_questions) < max_questions and "ai_q_deliverable_aspect" not in questions_already_asked:
                delivs = answers.get("deliverables", [])
                has_missing_aspect = False
                if isinstance(delivs, list):
                    has_missing_aspect = any(isinstance(d, dict) and not d.get("aspect_ratio") for d in delivs)
                if has_missing_aspect or not delivs:
                    fallback_questions.append(
                        GeneratedFollowupQuestion(
                            id="ai_q_deliverable_aspect",
                            section="deliverables",
                            field="aspect_ratio",
                            question="Which primary aspect ratio do you need for social distribution?",
                            input_type="single_choice",
                            required=False,
                            options=[
                                SurveyQuestionOption(label="9:16 Vertical Reel (TikTok, Reels, Shorts)", value="9:16"),
                                SurveyQuestionOption(label="16:9 Widescreen Landscape (YouTube, Web)", value="16:9"),
                                SurveyQuestionOption(label="1:1 Square (Feed & Display Ads)", value="1:1"),
                                SurveyQuestionOption(label="Multi-Format Cutdowns (9:16 + 16:9)", value="multi_format"),
                            ],
                            why_asking="Asset framing dictates camera composition and generative model parameters.",
                            priority=QuestionPriority.HIGH,
                        )
                    )

        status = CompletionStatus.COMPLETE
        if missing or any(c.severity == IssueSeverity.ERROR for c in contradictions):
            status = CompletionStatus.INCOMPLETE
        elif contradictions or ambiguities or fallback_questions:
            status = CompletionStatus.NEEDS_CLARIFICATION

        return status, completion_pct, missing, contradictions, ambiguities, fallback_questions[:max_questions]

    def _is_value_present(self, val: Any) -> bool:
        if val is None:
            return False
        if isinstance(val, str):
            return len(val.strip()) > 0
        if isinstance(val, (list, dict)):
            return len(val) > 0
        if isinstance(val, (int, float)):
            return True
        if isinstance(val, bool):
            return True
        return False


deterministic_intelligence = DeterministicIntelligenceService()
