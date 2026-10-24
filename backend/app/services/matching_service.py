"""Central Deterministic, Explainable Creator Matching Engine.

Implements Round 2 Feature 3.1: Real, Explainable Creator Matching with 6 weighted dimensions:
  1. Content Fit: 25% (0.25)
  2. Skills and AI Tools/Models: 20% (0.20)
  3. Portfolio Evidence: 20% (0.20)
  4. Commercial-Use Fit & Licensing: 20% (0.20)
  5. Trust and Verification: 10% (0.10)
  6. Practical Feasibility: 5% (0.05)
"""

from typing import List, Optional, Dict, Any, Set, Tuple
from uuid import UUID
import re
from app.services.base import BaseService
from app.core.logging import get_logger
from app.repositories import (
    creator_repository,
    CreatorRepository,
    brief_repository,
    BriefRepository,
    portfolio_repository,
    PortfolioRepository,
    verification_repository,
    VerificationRepository,
)
from app.repositories.trust_repository import trust_repository, TrustRepository
from app.services.achievement_service import achievement_service
from app.schemas.creator import CreatorProfileResponse, VerificationType, VerificationStatus
from app.schemas.portfolio import PortfolioProjectResponse, CommercialUseStatus
from app.schemas.match import (
    MatchCriteria,
    CreatorMatchResult,
    BriefMatchResult,
    MatchScoreFactor,
    MatchEngineWeights,
    EligibilityStatus,
    RequirementState,
    RequirementCheck,
    PortfolioEvidenceReference,
)

logger = get_logger("ai.matching")

# Canonical tool clusters for deterministic normalization
CANONICAL_TOOL_CLUSTERS: Dict[str, Set[str]] = {
    "runway": {"runway", "runway gen-3", "runway gen-2", "runwayml", "gen-3", "gen-2", "runway gen 3 alpha"},
    "midjourney": {"midjourney", "midjourney v6", "midjourney v5", "midjourney v6.1", "mj v6", "mj"},
    "stablediffusion": {"stable diffusion", "sdxl", "sd 1.5", "comfyui", "automatic1111", "stability ai"},
    "kling": {"kling", "kling ai", "kling 1.5"},
    "luma": {"luma", "dream machine", "luma dream machine"},
    "elevenlabs": {"elevenlabs", "eleven labs", "11labs"},
    "pika": {"pika", "pika labs", "pika 1.0", "pika 2.0"},
    "flux": {"flux", "flux.1", "flux-pro", "flux-schnell", "flux.1-dev"},
    "sora": {"sora", "openai sora"},
    "topaz": {"topaz", "topaz video ai", "topaz gigapixel"},
}

CANONICAL_PLATFORM_MAP: Dict[str, Set[str]] = {
    "tiktok": {"tiktok", "9 16", "short form video", "short form", "vertical"},
    "instagram reels": {"instagram reels", "reels", "instagram", "9 16", "short form video", "short form", "vertical"},
    "instagram": {"instagram", "instagram reels", "reels", "9 16", "1 1", "4 5", "carousel", "story"},
    "youtube shorts": {"youtube shorts", "shorts", "youtube", "9 16", "short form video", "vertical"},
    "youtube": {"youtube", "16 9", "cinematic", "horizontal", "long form video"},
}


def _clean_text(val: Optional[str]) -> str:
    """Normalizes string for comparison by lowercasing and stripping punctuation."""
    if not val:
        return ""
    return re.sub(r"[^a-z0-9\s]", " ", val.lower()).strip()


def _is_tool_match(tool_req: str, tool_cand: str) -> bool:
    """Deterministic canonical alias matching for AI tools."""
    c_req = _clean_text(tool_req)
    c_cand = _clean_text(tool_cand)
    if not c_req or not c_cand:
        return False
    if c_req == c_cand or c_req in c_cand or c_cand in c_req:
        return True

    # Check canonical alias clusters
    for cluster in CANONICAL_TOOL_CLUSTERS.values():
        req_in_cluster = any(alias in c_req or c_req in alias for alias in cluster)
        cand_in_cluster = any(alias in c_cand or c_cand in alias for alias in cluster)
        if req_in_cluster and cand_in_cluster:
            return True
    return False


def _is_skill_match(skill_req: str, skill_cand: str) -> bool:
    """Deterministic token/substring matching for skills."""
    c_req = _clean_text(skill_req)
    c_cand = _clean_text(skill_cand)
    if not c_req or not c_cand:
        return False
    if c_req == c_cand or c_req in c_cand or c_cand in c_req:
        return True
    req_tokens = set(c_req.split())
    cand_tokens = set(c_cand.split())
    return len(req_tokens.intersection(cand_tokens)) > 0


class MatchingService(BaseService):
    """
    Central Deterministic, Explainable Creator Matching Engine.
    Evaluates creators against campaign briefs across 6 weighted dimensions.
    """

    def __init__(
        self,
        creator_repo: Optional[CreatorRepository] = None,
        brief_repo: Optional[BriefRepository] = None,
        portfolio_repo: Optional[PortfolioRepository] = None,
        verification_repo: Optional[VerificationRepository] = None,
        trust_repo: Optional[TrustRepository] = None,
    ):
        super().__init__("matching")
        self.creator_repo = creator_repo or creator_repository
        self.brief_repo = brief_repo or brief_repository
        self.portfolio_repo = portfolio_repo or portfolio_repository
        self.verification_repo = verification_repo or verification_repository
        self.trust_repo = trust_repo or trust_repository
        self.weights = MatchEngineWeights()

    async def compute_matches_for_brief(self, criteria: MatchCriteria) -> List[CreatorMatchResult]:
        """
        Calculates ranked creators for a campaign brief with 6-dimension explainable breakdown.
        Adheres to exact weighting specifications, tri-state requirements, and authentic evidence provenance.
        """
        self.logger.info(f"Computing 6-factor deterministic matches for brief ID: {criteria.brief_id}")

        # 1. Attempt to load full campaign brief if available
        brief = None
        if criteria.brief_id and criteria.brief_id != "general":
            try:
                brief = await self.brief_repo.get_by_id(UUID(criteria.brief_id))
            except Exception:
                pass

        # Collect requirements from brief and criteria
        req_mandatory_skills = list(criteria.required_skills)
        req_preferred_skills = []
        req_mandatory_tools = list(criteria.required_tools)
        req_preferred_tools = []
        target_niches = set(criteria.target_niches)
        target_platforms = set(criteria.target_platforms)
        deliverable_formats: Set[str] = set()
        deliverable_types: Set[str] = set()
        commercial_rights_required = criteria.require_commercial_rights
        brief_currency = "INR"
        brief_budget_cents = criteria.max_budget_cents
        brief_deadline = None

        if brief:
            req_mandatory_tools.extend(brief.required_tools or [])
            req_preferred_tools.extend(brief.creator_capabilities.preferred_tools or [])
            req_mandatory_skills.extend(brief.creator_capabilities.required_capabilities or [])
            req_preferred_skills.extend(brief.creator_capabilities.preferred_capabilities or [])
            target_niches.update(brief.creator_capabilities.preferred_niches or [])
            if brief.campaign_category:
                target_niches.add(brief.campaign_category)
            target_platforms.update(brief.platforms or [])
            target_platforms.update(brief.creator_capabilities.preferred_platforms or [])

            for d in brief.deliverables or []:
                if d.aspect_ratio:
                    deliverable_formats.add(d.aspect_ratio.strip())
                if d.content_type:
                    deliverable_types.add(d.content_type.strip())
                if d.placement_or_platform:
                    target_platforms.add(d.placement_or_platform.strip())

            commercial_rights_required = brief.commercial_terms.commercial_rights_required
            brief_currency = brief.commercial_terms.currency or "INR"
            if brief.budget_cents:
                brief_budget_cents = brief.budget_cents
            brief_deadline = brief.deadline or brief.commercial_terms.content_delivery_deadline

        # Deduplicate tool/skill requirement lists while preserving order
        mandatory_tools = list(dict.fromkeys(req_mandatory_tools))
        preferred_tools = [t for t in dict.fromkeys(req_preferred_tools) if t not in mandatory_tools]
        mandatory_skills = list(dict.fromkeys(req_mandatory_skills))
        preferred_skills = [s for s in dict.fromkeys(req_preferred_skills) if s not in mandatory_skills]

        # 2. Query real creator profiles from database
        creators = await self.creator_repo.list_all(limit=100)
        if not creators:
            self.logger.info("No creators found in database; returning empty match result")
            return []

        scored_candidates: List[CreatorMatchResult] = []

        for creator in creators:
            # Respect creator visibility
            if getattr(creator, "visibility", "PUBLIC") == "PRIVATE":
                continue

            requirement_checks: List[RequirementCheck] = []
            unmet_requirements: List[str] = []
            unknown_info: List[str] = []
            top_strengths: List[str] = []
            potential_gaps: List[str] = []
            is_eligible = True

            c_tools = creator.ai_tools or []
            c_skills = creator.skills or []
            c_niches = set(creator.target_niches or [])
            if creator.primary_specialization:
                c_niches.add(creator.primary_specialization)
            for s in creator.secondary_specializations or []:
                c_niches.add(s)

            c_formats = set(creator.preferred_formats or [])
            c_types = set(creator.content_types or [])

            # -------------------------------------------------------------
            # FACTOR 1: Content Fit (25%)
            # -------------------------------------------------------------
            # A. Specialization & Niche Match
            niche_overlap = [n for n in target_niches if any(_clean_text(n) in _clean_text(cn) or _clean_text(cn) in _clean_text(n) for cn in c_niches)]
            if target_niches:
                spec_score = min(100.0, (len(niche_overlap) / len(target_niches)) * 100.0)
                if spec_score >= 70:
                    top_strengths.append(f"Strong content alignment in {', '.join(niche_overlap[:2])}")
                elif spec_score < 40:
                    potential_gaps.append(f"Limited specialization in requested campaign vertical ({', '.join(list(target_niches)[:2])})")
            else:
                spec_score = 75.0  # Neutral baseline when brief specifies no niche

            # B. Format & Deliverables Match
            matched_formats = [f for f in deliverable_formats if any(_clean_text(f) in _clean_text(cf) for cf in c_formats)]
            matched_types = [t for t in deliverable_types if any(_clean_text(t) in _clean_text(ct) for ct in c_types)]
            total_req_deliverables = len(deliverable_formats) + len(deliverable_types)
            if total_req_deliverables > 0:
                format_score = min(100.0, ((len(matched_formats) + len(matched_types)) / total_req_deliverables) * 100.0)
            else:
                format_score = 75.0

            # C. Platform Alignment
            creator_platform_evidence = set(_clean_text(cf) for cf in c_formats.union(c_types))
            for k in (creator.social_links or {}).keys():
                creator_platform_evidence.add(_clean_text(k))

            matched_platforms = []
            for p in target_platforms:
                p_clean = _clean_text(p)
                aliases = CANONICAL_PLATFORM_MAP.get(p_clean, {p_clean})
                if any(alias in creator_platform_evidence or any(alias in ce or ce in alias for ce in creator_platform_evidence) for alias in aliases):
                    matched_platforms.append(p)

            if target_platforms:
                platform_score = min(100.0, (len(matched_platforms) / len(target_platforms)) * 100.0)
            else:
                platform_score = 75.0

            f1_score = round(0.40 * spec_score + 0.35 * format_score + 0.25 * platform_score, 1)
            f1_evidence = []
            if niche_overlap:
                f1_evidence.append(f"Matched verticals: {', '.join(niche_overlap[:3])}")
            if matched_formats or matched_types:
                f1_evidence.append(f"Supported formats: {', '.join(matched_formats + matched_types)}")
            if matched_platforms:
                f1_evidence.append(f"Target platforms: {', '.join(matched_platforms[:3])}")
            f1_exp = (
                f"Content alignment score of {f1_score}% across vertical niches, deliverable formats, and distribution platforms."
                if f1_evidence
                else "Baseline content compatibility with standard digital creative formats."
            )

            # -------------------------------------------------------------
            # FACTOR 2: Skills and AI Tools/Models (20%)
            # -------------------------------------------------------------
            # Check mandatory tools
            matched_mandatory_tools = []
            unmet_mandatory_tools = []
            for req_tool in mandatory_tools:
                if any(_is_tool_match(req_tool, ct) for ct in c_tools):
                    matched_mandatory_tools.append(req_tool)
                    requirement_checks.append(
                        RequirementCheck(
                            requirement_name=req_tool,
                            requirement_type="TOOL",
                            is_mandatory=True,
                            state=RequirementState.SATISFIED,
                            details=f"Creator profile confirms verified capability in {req_tool}",
                        )
                    )
                else:
                    unmet_mandatory_tools.append(req_tool)
                    is_eligible = False
                    unmet_requirements.append(f"Missing mandatory tool: {req_tool}")
                    requirement_checks.append(
                        RequirementCheck(
                            requirement_name=req_tool,
                            requirement_type="TOOL",
                            is_mandatory=True,
                            state=RequirementState.UNMET,
                            details=f"Creator profile lacks mandatory tool {req_tool}",
                        )
                    )

            # Check preferred tools
            matched_preferred_tools = [t for t in preferred_tools if any(_is_tool_match(t, ct) for ct in c_tools)]

            # Check mandatory skills
            matched_mandatory_skills = []
            unmet_mandatory_skills = []
            for req_skill in mandatory_skills:
                if any(_is_skill_match(req_skill, cs) for cs in c_skills):
                    matched_mandatory_skills.append(req_skill)
                    requirement_checks.append(
                        RequirementCheck(
                            requirement_name=req_skill,
                            requirement_type="SKILL",
                            is_mandatory=True,
                            state=RequirementState.SATISFIED,
                            details=f"Creator demonstrates required skill: {req_skill}",
                        )
                    )
                else:
                    unmet_mandatory_skills.append(req_skill)
                    is_eligible = False
                    unmet_requirements.append(f"Missing mandatory skill: {req_skill}")
                    requirement_checks.append(
                        RequirementCheck(
                            requirement_name=req_skill,
                            requirement_type="SKILL",
                            is_mandatory=True,
                            state=RequirementState.UNMET,
                            details=f"Creator profile lacks mandatory skill {req_skill}",
                        )
                    )

            # Check preferred skills
            matched_preferred_skills = [s for s in preferred_skills if any(_is_skill_match(s, cs) for cs in c_skills)]

            # Calculate Skills & Tools score
            total_mand_tools = len(mandatory_tools)
            total_pref_tools = len(preferred_tools)
            total_mand_skills = len(mandatory_skills)
            total_pref_skills = len(preferred_skills)

            if total_mand_tools + total_pref_tools > 0:
                mand_tool_ratio = (len(matched_mandatory_tools) / total_mand_tools) if total_mand_tools else 1.0
                pref_tool_ratio = (len(matched_preferred_tools) / total_pref_tools) if total_pref_tools else 1.0
                tool_score = (mand_tool_ratio * 0.7 + pref_tool_ratio * 0.3) * 100.0
            else:
                tool_score = 75.0

            if total_mand_skills + total_pref_skills > 0:
                mand_skill_ratio = (len(matched_mandatory_skills) / total_mand_skills) if total_mand_skills else 1.0
                pref_skill_ratio = (len(matched_preferred_skills) / total_pref_skills) if total_pref_skills else 1.0
                skill_score = (mand_skill_ratio * 0.7 + pref_skill_ratio * 0.3) * 100.0
            else:
                skill_score = 75.0

            # If mandatory tools/skills are unmet, cap score severely
            if unmet_mandatory_tools or unmet_mandatory_skills:
                f2_score = round(min(30.0, 0.55 * tool_score + 0.45 * skill_score), 1)
                f2_exp = f"Unmet mandatory requirements: missing {', '.join(unmet_mandatory_tools + unmet_mandatory_skills)}."
            else:
                f2_score = round(min(100.0, 0.55 * tool_score + 0.45 * skill_score), 1)
                all_matched_tools = matched_mandatory_tools + matched_preferred_tools
                f2_exp = (
                    f"Satisfies {len(all_matched_tools)} tools ({', '.join(all_matched_tools[:3])}) and competencies."
                    if all_matched_tools
                    else "General proficiency across generative workflows."
                )
                if f2_score >= 80:
                    top_strengths.append(f"AI tools mastery: {', '.join((c_tools)[:2]) or 'Generative AI'}")

            # -------------------------------------------------------------
            # FACTOR 3: Portfolio Evidence (20%)
            # -------------------------------------------------------------
            # Fetch creator verification records from repository
            verifications = await self.verification_repo.list_by_creator(creator.id)
            verified_types = [v.verification_type for v in verifications if v.status == VerificationStatus.VERIFIED]
            verified_portfolio_ids = {
                str(v.target_id)
                for v in verifications
                if v.verification_type == VerificationType.PORTFOLIO_VERIFIED and v.status == VerificationStatus.VERIFIED and v.target_id
            }

            portfolio_items = await self.portfolio_repo.list_public_by_creator(creator.id)
            portfolio_references: List[PortfolioEvidenceReference] = []

            if not portfolio_items:
                f3_score = 0.0
                f3_exp = "No public portfolio projects uploaded by creator to verify deliverable quality."
                unknown_info.append("Portfolio evidence missing: Creator has not published public portfolio projects.")
                potential_gaps.append("Missing public portfolio track record.")
            else:
                for proj in portfolio_items:
                    # Tool overlap in project
                    proj_tools = proj.tools + proj.models
                    all_brief_tools = mandatory_tools + preferred_tools
                    proj_tool_matches = [t for t in all_brief_tools if any(_is_tool_match(t, pt) for pt in proj_tools)]
                    tool_relevance = (len(proj_tool_matches) / max(1, len(all_brief_tools))) if all_brief_tools else 0.8

                    # Deliverable format/aspect ratio match
                    format_relevance = 0.8
                    if deliverable_formats and proj.aspect_ratio:
                        format_relevance = 1.0 if proj.aspect_ratio in deliverable_formats else 0.4
                    if deliverable_types and proj.content_type:
                        format_relevance = (format_relevance + (1.0 if proj.content_type in deliverable_types else 0.5)) / 2.0

                    is_proj_verified = (
                        getattr(proj, "verification_status", "UNVERIFIED") == "VERIFIED"
                        or str(proj.id) in verified_portfolio_ids
                    )
                    verification_bonus = 20.0 if is_proj_verified else 0.0

                    proj_score = round(min(100.0, (tool_relevance * 45.0 + format_relevance * 35.0 + verification_bonus)), 1)
                    portfolio_references.append(
                        PortfolioEvidenceReference(
                            project_id=str(proj.id),
                            title=proj.title,
                            media_type=proj.media_type.value if hasattr(proj.media_type, "value") else str(proj.media_type),
                            media_url=proj.media_url,
                            thumbnail_url=proj.thumbnail_url,
                            aspect_ratio=proj.aspect_ratio,
                            content_type=proj.content_type,
                            tools_used=proj_tools,
                            relevance_score=proj_score,
                            commercial_use_status=proj.commercial_use_status.value if hasattr(proj.commercial_use_status, "value") else str(proj.commercial_use_status),
                            is_verified=is_proj_verified,
                        )
                    )

                # Sort references by relevance score descending
                portfolio_references.sort(key=lambda r: r.relevance_score, reverse=True)
                top_3_refs = portfolio_references[:3]
                f3_score = round(sum(r.relevance_score for r in top_3_refs) / len(top_3_refs), 1)
                f3_exp = f"Verified across {len(portfolio_references)} portfolio assets; top work: '{top_3_refs[0].title}' ({top_3_refs[0].relevance_score}% relevance)."
                if f3_score >= 75:
                    top_strengths.append(f"Substantiated portfolio track record ({len(portfolio_references)} public projects)")

            # -------------------------------------------------------------
            # FACTOR 4: Commercial-Use Fit & Licensing (20%)
            # -------------------------------------------------------------
            # Authoritative evidence requires an authentic, verified portfolio project
            # with COMMERCIAL_READY or COMMERCIAL_USE_WITH_PERMISSION status.
            # creator.is_verified alone NEVER clears IP commercial licensing.
            verified_commercial_refs = [
                r for r in portfolio_references
                if r.is_verified and r.commercial_use_status in ["COMMERCIAL_READY", "COMMERCIAL_USE_WITH_PERMISSION"]
            ]

            if verified_commercial_refs:
                commercial_rights_cleared = True
                commercial_status = "COMMERCIAL_READY"
                comm_state = RequirementState.SATISFIED
                f4_score = 95.0
                f4_exp = f"Authoritative commercial licensing cleared across {len(verified_commercial_refs)} verified portfolio assets (e.g., '{verified_commercial_refs[0].title}')."
                requirement_checks.append(
                    RequirementCheck(
                        requirement_name="Commercial Licensing",
                        requirement_type="LICENSING",
                        is_mandatory=commercial_rights_required,
                        state=RequirementState.SATISFIED,
                        details=f"Commercial rights verified on authentic assets: {verified_commercial_refs[0].title}.",
                    )
                )
            elif any(r.commercial_use_status == "PERSONAL_PROJECT" for r in portfolio_references):
                commercial_rights_cleared = False
                commercial_status = "PERSONAL_PROJECT"
                comm_state = RequirementState.UNMET
                f4_score = 15.0
                f4_exp = "Creator assets are designated for personal/non-commercial use only. Commercial advertising rights are unmet."
                if commercial_rights_required:
                    is_eligible = False
                    unmet_requirements.append("Mandatory commercial advertising rights unmet (assets marked personal use only)")
                requirement_checks.append(
                    RequirementCheck(
                        requirement_name="Commercial Licensing",
                        requirement_type="LICENSING",
                        is_mandatory=commercial_rights_required,
                        state=RequirementState.UNMET,
                        details="Assets are restricted to personal/non-commercial licensing.",
                    )
                )
            else:
                commercial_rights_cleared = False
                commercial_status = "UNKNOWN"
                comm_state = RequirementState.UNKNOWN
                f4_score = 35.0  # Do not assume compatibility; award no unearned points

                unverified_claims = [
                    r for r in portfolio_references
                    if r.commercial_use_status in ["COMMERCIAL_READY", "COMMERCIAL_USE_WITH_PERMISSION"] and not r.is_verified
                ]

                if unverified_claims:
                    f4_exp = "Commercial licensing status unverified: Self-reported commercial readiness lacks independent asset verification."
                    licensing_detail = "Self-reported commercial readiness is unverified; requires independent asset licensing audit."
                    unknown_info.append("Commercial licensing unverified: Self-reported commercial readiness lacks independent asset verification.")
                else:
                    f4_exp = "Commercial licensing status unverified: Creator has not registered authoritative verified commercial licenses."
                    licensing_detail = "Commercial rights status is unverified or missing on creator profile."
                    unknown_info.append("Commercial licensing unverified: Rights have not been explicitly confirmed for commercial use.")

                requirement_checks.append(
                    RequirementCheck(
                        requirement_name="Commercial Licensing",
                        requirement_type="LICENSING",
                        is_mandatory=commercial_rights_required,
                        state=RequirementState.UNKNOWN,
                        details=licensing_detail,
                    )
                )

            # -------------------------------------------------------------
            # FACTOR 5: Trust and Verification (10%)
            # -------------------------------------------------------------
            trust_points = 0.0
            # Identity / Email
            if VerificationType.EMAIL_VERIFIED in verified_types or VerificationType.IDENTITY_VERIFIED in verified_types:
                trust_points += 25.0
            else:
                unknown_info.append("Identity/Email verification not completed.")

            # Tool Verification
            if VerificationType.TOOL_VERIFIED in verified_types:
                trust_points += 30.0
            else:
                unknown_info.append("Tool mastery audit not verified by platform.")

            # Portfolio / Workflow Verification
            if VerificationType.PORTFOLIO_VERIFIED in verified_types or VerificationType.WORKFLOW_VERIFIED in verified_types:
                trust_points += 25.0
            else:
                unknown_info.append("Workflow pipeline not verified by platform.")

            # Assessment & Platform Reputation
            if creator.assessment_completed:
                trust_points += 10.0
            rep = creator.reputation_score or 4.0
            trust_points += min(10.0, (rep / 5.0) * 10.0)

            # Apply incident demerits if any
            try:
                t_score = await self.trust_repo.get_or_create_score(str(creator.id))
                if t_score and t_score.total_active_demerits:
                    trust_points = max(0.0, trust_points - t_score.total_active_demerits)
            except Exception:
                pass

            f5_score = round(min(100.0, max(0.0, trust_points)), 1)
            f5_exp = (
                f"Trust score {f5_score}% with verified signals: {', '.join([vt.value for vt in verified_types]) or 'Standard account verification'}."
            )
            if f5_score >= 80:
                top_strengths.append(f"High platform trust score ({f5_score}%) with active verifications")

            # -------------------------------------------------------------
            # FACTOR 6: Practical Feasibility (5%)
            # -------------------------------------------------------------
            # A. Budget Compatibility
            c_rate = creator.hourly_rate_cents
            if brief_budget_cents and c_rate:
                # 15 hours estimated deliverable effort
                est_cost = c_rate * 15
                if est_cost <= brief_budget_cents:
                    budget_score = 95.0
                    b_state = RequirementState.SATISFIED
                    b_detail = f"Creator rate ({c_rate/100:.0f} {brief_currency}/hr) fits comfortably within campaign budget."
                elif est_cost <= brief_budget_cents * 1.25:
                    budget_score = 65.0
                    b_state = RequirementState.SATISFIED
                    b_detail = f"Creator rate ({c_rate/100:.0f} {brief_currency}/hr) is near the upper budget threshold."
                else:
                    budget_score = 25.0
                    b_state = RequirementState.UNMET
                    b_detail = f"Creator rate ({c_rate/100:.0f} {brief_currency}/hr) substantially exceeds campaign budget."
                    potential_gaps.append(f"Rate exceeds target budget ceiling ({brief_budget_cents/100:.0f} {brief_currency})")
            else:
                budget_score = 50.0  # Unknown baseline
                b_state = RequirementState.UNKNOWN
                b_detail = "Budget compatibility unknown: creator hourly rate or brief budget not published."
                unknown_info.append("Budget compatibility unverified: Missing rate or budget data.")

            requirement_checks.append(
                RequirementCheck(
                    requirement_name="Budget Compatibility",
                    requirement_type="BUDGET",
                    is_mandatory=False,
                    state=b_state,
                    details=b_detail,
                )
            )

            # B. Timeline & Availability
            avail_status = creator.metadata.get("availability", "AVAILABLE").upper()
            if avail_status in ["IMMEDIATE", "AVAILABLE"]:
                avail_score = 95.0
                a_state = RequirementState.SATISFIED
                a_detail = "Creator actively available for campaign delivery."
            elif avail_status == "LIMITED":
                avail_score = 65.0
                a_state = RequirementState.SATISFIED
                a_detail = "Creator has limited production bandwidth this cycle."
            elif avail_status == "UNAVAILABLE":
                avail_score = 10.0
                a_state = RequirementState.UNMET
                a_detail = "Creator is currently unavailable for new campaign commissions."
                if brief_deadline:
                    is_eligible = False
                    unmet_requirements.append("Creator is currently unavailable for delivery before campaign deadline")
            else:
                avail_score = 50.0
                a_state = RequirementState.UNKNOWN
                a_detail = "Creator availability calendar not published."
                unknown_info.append("Availability timeline unknown.")

            requirement_checks.append(
                RequirementCheck(
                    requirement_name="Availability & Timeline",
                    requirement_type="AVAILABILITY",
                    is_mandatory=bool(brief_deadline),
                    state=a_state,
                    details=a_detail,
                )
            )

            f6_score = round(0.50 * budget_score + 0.50 * avail_score, 1)
            f6_exp = f"Feasibility score {f6_score}%: {b_detail} {a_detail}"

            # -------------------------------------------------------------
            # Assemble 6 Factors & Overall Score
            # -------------------------------------------------------------
            factors = [
                MatchScoreFactor(
                    factor_name="Content Fit",
                    weight=self.weights.content_fit,
                    score=f1_score,
                    explanation=f1_exp,
                    confidence=0.92,
                    evidence=f1_evidence,
                ),
                MatchScoreFactor(
                    factor_name="Skills and AI Tools/Models",
                    weight=self.weights.skills_and_tools,
                    score=f2_score,
                    explanation=f2_exp,
                    confidence=0.95,
                    evidence=matched_mandatory_tools + matched_preferred_tools + matched_mandatory_skills,
                ),
                MatchScoreFactor(
                    factor_name="Portfolio Evidence",
                    weight=self.weights.portfolio_evidence,
                    score=f3_score,
                    explanation=f3_exp,
                    confidence=0.90 if portfolio_items else 0.50,
                    evidence=[r.title for r in portfolio_references[:3]],
                ),
                MatchScoreFactor(
                    factor_name="Commercial-Use Fit & Licensing",
                    weight=self.weights.commercial_fit,
                    score=f4_score,
                    explanation=f4_exp,
                    confidence=0.95 if commercial_rights_cleared else 0.50,
                    evidence=[f"Status: {commercial_status}"],
                ),
                MatchScoreFactor(
                    factor_name="Trust and Verification",
                    weight=self.weights.trust_and_verification,
                    score=f5_score,
                    explanation=f5_exp,
                    confidence=0.90,
                    evidence=[vt.value for vt in verified_types],
                ),
                MatchScoreFactor(
                    factor_name="Practical Feasibility",
                    weight=self.weights.practical_feasibility,
                    score=f6_score,
                    explanation=f6_exp,
                    confidence=0.85 if (brief_budget_cents and c_rate) else 0.60,
                    evidence=[b_detail, a_detail],
                ),
            ]

            overall_score = round(
                sum(f.weight * f.score for f in factors),
                1
            )

            # Determine Eligibility Tier
            if not is_eligible or unmet_requirements:
                eligibility_status = EligibilityStatus.NOT_ELIGIBLE
            elif (commercial_rights_required and commercial_status == "UNKNOWN") or (unknown_info and not portfolio_items):
                eligibility_status = EligibilityStatus.POTENTIAL_MATCH_INFO_MISSING
            else:
                eligibility_status = EligibilityStatus.ELIGIBLE_MATCH

            status_label = (
                "Eligible match"
                if eligibility_status == EligibilityStatus.ELIGIBLE_MATCH
                else ("Potential match (information missing)" if eligibility_status == EligibilityStatus.POTENTIAL_MATCH_INFO_MISSING else "Ineligible candidate")
            )
            summary_exp = (
                f"{status_label} ({overall_score}% match score) "
                f"with {creator.primary_specialization or 'AI visual production'} specialization. "
                f"{f2_exp} {f3_exp}"
            )

            # Achievement priority bonus integration
            achievement = achievement_service.ranking_bonus(str(creator.id), criteria.brief_id)
            # Trust is fetched from the dedicated trust engine, never derived from points or match fit.
            trust_profile = await trust_repository.get_public_profile(str(creator.user_id))
            priority_score = round(
                min(100.0, overall_score + achievement["long_term_reputation_bonus"] + achievement["temporary_priority_bonus"]),
                1
            )

            avatar = getattr(creator, "avatar_url", None)
            if not avatar and isinstance(getattr(creator, "metadata", None), dict):
                avatar = creator.metadata.get("avatar_url")

            scored_candidates.append(
                CreatorMatchResult(
                    creator_id=str(creator.id),
                    creator_handle=creator.handle,
                    creator_name=creator.full_name,
                    creator_level=creator.level.value if hasattr(creator.level, "value") else str(creator.level),
                    creator_avatar_url=avatar,
                    reputation_score=creator.reputation_score or 0.0,
                    trust_score=trust_profile.score if trust_profile else None,
                    trust_status=trust_profile.status_label if trust_profile else "New — insufficient verified history",
                    priority_placement=achievement["active_boost"],
                    overall_match_score=overall_score,
                    score_meaning="Calculated match score based on available evidence, not a probability of success or delivery guarantee.",
                    eligibility_status=eligibility_status,
                    is_eligible=is_eligible,
                    achievement_points=achievement["lifetime_points"],
                    achievement_reputation_bonus=achievement["long_term_reputation_bonus"],
                    temporary_priority_bonus=achievement["temporary_priority_bonus"],
                    priority_score=priority_score,
                    factors=factors,
                    summary_explanation=summary_exp,
                    top_strengths=top_strengths,
                    potential_gaps=potential_gaps,
                    unmet_requirements=unmet_requirements,
                    unknown_information=unknown_info,
                    requirement_checks=requirement_checks,
                    portfolio_evidence=portfolio_references[:5],
                    commercial_status=commercial_status,
                    commercial_rights_cleared=commercial_rights_cleared,
                    hourly_rate_cents=creator.hourly_rate_cents,
                    ai_tools=creator.ai_tools or [],
                    skills=creator.skills or [],
                )
            )

        # 3. Sort candidates:
        # Group 1: ELIGIBLE_MATCH (tier 2)
        # Group 2: POTENTIAL_MATCH_INFO_MISSING (tier 1)
        # Group 3: NOT_ELIGIBLE (tier 0)
        # Within each tier:
        # - Active paid-with-points placement is explicit
        # - Trust is the primary organic ranking signal, then priority_score and match fit
        # - Trust is never modified by points or boost spend.
        def _sort_key(c: CreatorMatchResult) -> Tuple[int, bool, float, float, float]:
            if c.eligibility_status == EligibilityStatus.ELIGIBLE_MATCH:
                tier = 2
            elif c.eligibility_status == EligibilityStatus.POTENTIAL_MATCH_INFO_MISSING:
                tier = 1
            else:
                tier = 0
            return (
                tier,
                bool(c.priority_placement),
                float(c.trust_score if c.trust_score is not None else 0.0),
                c.priority_score,
                c.overall_match_score,
            )

        scored_candidates.sort(key=_sort_key, reverse=True)

        # 4. Compute relative rank explanation for every candidate
        total_ranked = len(scored_candidates)
        for idx, cand in enumerate(scored_candidates):
            rank = idx + 1
            if rank == 1 and total_ranked > 1:
                next_cand = scored_candidates[1]
                cand.relative_rank_explanation = (
                    f"Ranked #1 of {total_ranked} candidates due to highest Content Fit ({cand.factors[0].score}%) "
                    f"and Portfolio Evidence ({cand.factors[2].score}%), outperforming @{next_cand.creator_handle} "
                    f"({next_cand.overall_match_score}%) by {round(cand.overall_match_score - next_cand.overall_match_score, 1)} points."
                )
            elif rank > 1:
                prev_cand = scored_candidates[idx - 1]
                score_diff = round(prev_cand.overall_match_score - cand.overall_match_score, 1)
                reason_behind = (
                    f"Ranked #{rank} behind @{prev_cand.creator_handle} ({prev_cand.overall_match_score}%) "
                    f"due to lower factor performance (-{score_diff} pts)."
                )
                if cand.eligibility_status == EligibilityStatus.NOT_ELIGIBLE:
                    reason_behind = f"Ranked #{rank} (Ineligible) due to unmet mandatory requirements: {', '.join(cand.unmet_requirements)}."
                elif idx + 1 < total_ranked:
                    next_cand = scored_candidates[idx + 1]
                    reason_behind += f" Placed ahead of @{next_cand.creator_handle} ({next_cand.overall_match_score}%)."
                cand.relative_rank_explanation = reason_behind
            else:
                cand.relative_rank_explanation = f"Evaluated as the sole eligible candidate with {cand.overall_match_score}% calculated evidence score."

        return scored_candidates[: criteria.limit]

    async def get_matches_for_brief_id(self, brief_id: str) -> List[CreatorMatchResult]:
        """Convenience method to compute matches directly from a saved brief ID."""
        criteria = MatchCriteria(brief_id=brief_id)
        return await self.compute_matches_for_brief(criteria)

    async def get_recommended_briefs_for_creator(self, user_id: str) -> List[BriefMatchResult]:
        """
        Recommends high-affinity campaign briefs to an authenticated creator
        based on the creator's verified tools, skills, and past performance.
        Returns empty list if no suitable briefs exist (no fake fallback data).
        """
        creator = await self.creator_repo.get_by_user_id(user_id)
        if not creator:
            try:
                creator = await self.creator_repo.get_by_id(UUID(user_id))
            except Exception:
                pass
        if not creator:
            return []

        briefs = await self.brief_repo.list_all(limit=20)
        if not briefs:
            return []

        recommendations: List[BriefMatchResult] = []
        c_tools = set(creator.ai_tools or [])
        c_skills = set(creator.skills or [])

        for b in briefs:
            b_tools = set(b.required_tools or [])
            b_skills = set(b.creator_capabilities.required_capabilities or [])
            tool_ov = len([t for t in b_tools if any(_is_tool_match(t, ct) for ct in c_tools)])
            skill_ov = len([s for s in b_skills if any(_is_skill_match(s, cs) for cs in c_skills)])

            tool_score = (tool_ov / max(1, len(b_tools))) * 100.0 if b_tools else 75.0
            skill_score = (skill_ov / max(1, len(b_skills))) * 100.0 if b_skills else 75.0
            overall = round(tool_score * 0.55 + skill_score * 0.45, 1)

            factors = [
                MatchScoreFactor(
                    factor_name="Skills and AI Tools/Models",
                    weight=0.55,
                    score=tool_score,
                    explanation=f"Overlaps with your verified toolset ({', '.join(list(c_tools)[:2]) or 'AI Suite'})",
                ),
                MatchScoreFactor(
                    factor_name="Content Fit",
                    weight=0.45,
                    score=skill_score,
                    explanation="Matches your production deliverables and stylistic competencies",
                ),
            ]

            recommendations.append(
                BriefMatchResult(
                    brief_id=str(b.id),
                    brief_title=b.title,
                    brand_name=b.brand_or_product_name or "Verified Brand",
                    overall_match_score=overall,
                    factors=factors,
                    summary_explanation=f"Affinity project ({overall}% match score) matching your verified skills.",
                    budget_cents=b.budget_cents or 250000,
                    deadline=b.deadline,
                    category=b.campaign_category or "Commercial Creative",
                    platforms=b.platforms or ["TikTok", "Instagram Reels"],
                    required_tools=b.required_tools or [],
                )
            )

        recommendations.sort(key=lambda r: r.overall_match_score, reverse=True)
        return recommendations[:10]
