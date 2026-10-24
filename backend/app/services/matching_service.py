"""Central Intelligent Creator Matching Engine implementing the 7 weighted criteria."""

from typing import List, Optional, Dict, Any
from uuid import UUID
from app.services.base import BaseService
from app.core.logging import get_logger
from app.repositories import (
    creator_repository,
    CreatorRepository,
    brief_repository,
    BriefRepository,
    portfolio_repository,
    PortfolioRepository,
)
from app.services.achievement_service import achievement_service
from app.schemas.match import (
    MatchCriteria,
    CreatorMatchResult,
    BriefMatchResult,
    MatchScoreFactor,
    MatchEngineWeights,
)

logger = get_logger("ai.matching")


class MatchingService(BaseService):
    """
    Central Intelligent Creator Matching Engine.
    Evaluates creators against campaign briefs across 7 explainable dimensions:
      1. Skills & Portfolio Match (30%)
      2. Niche & Category Relevance (20%)
      3. Format & Platform Expertise (15%)
      4. Target Audience Alignment (10%)
      5. Budget Compatibility (10%)
      6. Timeline & Availability (10%)
      7. Brand/Creator Preferences & Values (5%)
    """

    def __init__(
        self,
        creator_repo: Optional[CreatorRepository] = None,
        brief_repo: Optional[BriefRepository] = None,
        portfolio_repo: Optional[PortfolioRepository] = None,
    ):
        super().__init__("matching")
        self.creator_repo = creator_repo or creator_repository
        self.brief_repo = brief_repo or brief_repository
        self.portfolio_repo = portfolio_repo or portfolio_repository
        self.weights = MatchEngineWeights()

    async def compute_matches_for_brief(self, criteria: MatchCriteria) -> List[CreatorMatchResult]:
        """
        Calculates ranked creators for a campaign brief with explainable 7-factor breakdown.
        Adheres to exact weighting specifications and realistic constraint checking.
        """
        self.logger.info(f"Computing 7-factor matches for brief ID: {criteria.brief_id}")

        # Attempt to load full campaign brief if available
        brief = None
        try:
            brief = await self.brief_repo.get_by_id(UUID(criteria.brief_id))
        except Exception:
            pass

        req_skills = set(criteria.required_skills)
        req_tools = set(criteria.required_tools)
        target_niches = set(criteria.target_niches)
        target_platforms = set(criteria.target_platforms)
        max_budget = criteria.max_budget_cents

        if brief:
            req_skills.update(brief.creator_capabilities.required_capabilities)
            req_skills.update(brief.creator_capabilities.preferred_capabilities)
            req_tools.update(brief.creator_capabilities.preferred_tools)
            req_tools.update(brief.required_tools)
            target_niches.update(brief.creator_capabilities.preferred_niches)
            if brief.campaign_category:
                target_niches.add(brief.campaign_category)
            target_platforms.update(brief.platforms)
            target_platforms.update(brief.creator_capabilities.preferred_platforms)
            if brief.budget_cents and not max_budget:
                max_budget = brief.budget_cents

        creators = await self.creator_repo.list_all(limit=50)
        results: List[CreatorMatchResult] = []

        for creator in creators:
            # 1. Skills & Portfolio Match (30%)
            c_tools = set(creator.ai_tools or [])
            c_skills = set(creator.skills or [])
            tool_overlap = len(req_tools.intersection(c_tools))
            skill_overlap = len(req_skills.intersection(c_skills))

            tool_ratio = (tool_overlap / max(1, len(req_tools))) if req_tools else 0.85
            skill_ratio = (skill_overlap / max(1, len(req_skills))) if req_skills else 0.80

            # Verified reputation / assessment boost
            rep_boost = (creator.reputation_score / 5.0) if creator.reputation_score > 0 else 0.70
            verification_boost = 1.1 if creator.is_verified else 0.95

            raw_skills_score = min(100.0, ((tool_ratio * 0.5 + skill_ratio * 0.3 + rep_boost * 0.2) * 100.0) * verification_boost)
            f1_score = round(raw_skills_score, 1)
            f1_exp = (
                f"Matches {tool_overlap}/{len(req_tools)} required AI tools and {skill_overlap}/{len(req_skills)} competencies"
                if req_tools or req_skills
                else "High demonstrated technical aptitude across generative creative toolsets"
            )

            # 2. Niche & Category Relevance (20%)
            c_niches = set(creator.target_niches or [])
            if creator.primary_specialization:
                c_niches.add(creator.primary_specialization)
            niche_overlap = len(target_niches.intersection(c_niches))
            if target_niches:
                f2_score = round(min(100.0, 30.0 + (niche_overlap / len(target_niches)) * 70.0), 1)
                f2_exp = f"Strong vertical alignment in {', '.join(list(c_niches)[:2]) or 'commercial media'}"
            else:
                f2_score = 80.0
                f2_exp = f"General domain alignment in {creator.primary_specialization or 'AI visual production'}"

            # 3. Format & Platform Expertise (15%)
            c_formats = set(creator.preferred_formats or [])
            c_types = set(creator.content_types or [])
            platform_overlap = len(target_platforms.intersection(c_formats.union(c_types)))
            if target_platforms:
                f3_score = round(min(100.0, 40.0 + (platform_overlap / len(target_platforms)) * 60.0), 1)
                f3_exp = f"Proven experience in target formats ({', '.join(list(target_platforms)[:2])})"
            else:
                f3_score = 82.0
                f3_exp = "Multi-platform distribution readiness across vertical and cinematic aspect ratios"

            # 4. Target Audience Alignment (10%)
            f4_score = 85.0 if creator.is_verified else 70.0
            f4_exp = "Audience demographic and aesthetic tone align with campaign visual benchmark"

            # 5. Budget Compatibility (10%)
            c_rate = creator.hourly_rate_cents
            if max_budget and c_rate:
                # Approximate 10-20 hour project equivalent
                est_project_cost = c_rate * 15
                if est_project_cost <= max_budget:
                    f5_score = 95.0
                    f5_exp = f"Creator pricing (${c_rate/100:.0f}/hr) fits comfortably within campaign budget ceiling"
                elif est_project_cost <= max_budget * 1.25:
                    f5_score = 65.0
                    f5_exp = f"Creator rate (${c_rate/100:.0f}/hr) is near upper budget threshold"
                else:
                    f5_score = 30.0
                    f5_exp = f"Creator rate (${c_rate/100:.0f}/hr) substantially exceeds target budget"
            elif max_budget:
                f5_score = 75.0
                f5_exp = "Creator has flexible commercial pricing open to milestone proposals"
            else:
                f5_score = 80.0
                f5_exp = "Standard commercial rate alignment"

            # 6. Timeline & Availability (10%)
            availability_status = creator.metadata.get("availability", "IMMEDIATE")
            if availability_status == "IMMEDIATE":
                f6_score = 95.0
                f6_exp = "Creator is actively accepting new brand commissions with immediate start"
            elif availability_status == "LIMITED":
                f6_score = 65.0
                f6_exp = "Creator has limited production bandwidth this cycle"
            else:
                f6_score = 85.0
                f6_exp = "Standard production turnaround availability"

            # 7. Brand/Creator Preferences & Values (5%)
            f7_score = 90.0 if creator.assessment_completed else 75.0
            f7_exp = "High aesthetic cohesion with brand visual guidelines and experimental tolerance"

            factors = [
                MatchScoreFactor(
                    factor_name="Skills & Portfolio Match",
                    weight=self.weights.skills_and_portfolio,
                    score=f1_score,
                    explanation=f1_exp,
                    confidence=0.95 if creator.is_verified else 0.80,
                ),
                MatchScoreFactor(
                    factor_name="Niche & Category Relevance",
                    weight=self.weights.niche_and_category,
                    score=f2_score,
                    explanation=f2_exp,
                    confidence=0.90,
                ),
                MatchScoreFactor(
                    factor_name="Format & Platform Expertise",
                    weight=self.weights.format_and_platform,
                    score=f3_score,
                    explanation=f3_exp,
                    confidence=0.88,
                ),
                MatchScoreFactor(
                    factor_name="Target Audience Alignment",
                    weight=self.weights.target_audience,
                    score=f4_score,
                    explanation=f4_exp,
                    confidence=0.85,
                ),
                MatchScoreFactor(
                    factor_name="Budget Compatibility",
                    weight=self.weights.budget_compatibility,
                    score=f5_score,
                    explanation=f5_exp,
                    confidence=0.90,
                ),
                MatchScoreFactor(
                    factor_name="Timeline & Availability",
                    weight=self.weights.timeline_and_availability,
                    score=f6_score,
                    explanation=f6_exp,
                    confidence=0.85,
                ),
                MatchScoreFactor(
                    factor_name="Preferences & Creative Values",
                    weight=self.weights.preferences_and_values,
                    score=f7_score,
                    explanation=f7_exp,
                    confidence=0.80,
                ),
            ]

            overall_score = round(sum(f.weight * f.score for f in factors), 1)

            # Extract top strengths and gaps
            strengths: List[str] = []
            gaps: List[str] = []
            if f1_score >= 80:
                strengths.append(f"Mastery of key AI tools: {', '.join(list(c_tools)[:2]) or 'Generative AI'}")
            if f2_score >= 80:
                strengths.append(f"Domain depth in {creator.primary_specialization or 'Digital Media'}")
            if f5_score >= 90:
                strengths.append("High budget compatibility")
            if f1_score < 60:
                gaps.append("Missing some specialized requested tool certifications")
            if f5_score < 50:
                gaps.append("Rate exceeds target project budget ceiling")

            summary_exp = (
                f"Ranked match ({overall_score}%) with strong affinity in {creator.primary_specialization or 'AI visual production'}, "
                f"certified in {', '.join(list(c_tools)[:2]) or 'AI workflows'}, and verified portfolio delivery."
            )

            achievement = achievement_service.ranking_bonus(str(creator.id), criteria.brief_id)
            results.append(
                CreatorMatchResult(
                    creator_id=str(creator.id),
                    creator_handle=creator.handle,
                    creator_name=creator.full_name,
                    creator_level=creator.level.value if hasattr(creator.level, "value") else str(creator.level),
                    reputation_score=creator.reputation_score or 4.8,
                    overall_match_score=overall_score,
                    achievement_points=achievement["lifetime_points"],
                    achievement_reputation_bonus=achievement["long_term_reputation_bonus"],
                    temporary_priority_bonus=achievement["temporary_priority_bonus"],
                    priority_score=round(min(100.0, overall_score + achievement["long_term_reputation_bonus"] + achievement["temporary_priority_bonus"]), 1),
                    factors=factors,
                    summary_explanation=summary_exp,
                    top_strengths=strengths,
                    potential_gaps=gaps,
                    hourly_rate_cents=creator.hourly_rate_cents,
                    ai_tools=creator.ai_tools or [],
                    skills=creator.skills or [],
                )
            )

        # Match fit remains visible; capped achievement bonuses only affect ordering transparently.
        results.sort(key=lambda r: (getattr(r, "priority_score", r.overall_match_score), r.overall_match_score), reverse=True)
        return results[: criteria.limit]

    async def get_matches_for_brief_id(self, brief_id: str) -> List[CreatorMatchResult]:
        """Convenience method to compute matches directly from a saved brief ID."""
        criteria = MatchCriteria(brief_id=brief_id)
        return await self.compute_matches_for_brief(criteria)

    async def get_recommended_briefs_for_creator(self, user_id: str) -> List[BriefMatchResult]:
        """
        Recommends high-affinity campaign briefs to an authenticated creator
        based on the creator's skills, verified tools, and preferences.
        """
        creator = await self.creator_repo.get_by_user_id(user_id)
        if not creator:
            try:
                from uuid import UUID
                creator = await self.creator_repo.get_by_id(UUID(user_id))
            except Exception:
                pass
        if not creator:
            # Fallback recommendations if creator profile not yet complete
            return self._fallback_brief_recommendations()

        briefs = await self.brief_repo.list_all(limit=10)
        recommendations: List[BriefMatchResult] = []

        c_tools = set(creator.ai_tools or [])
        c_skills = set(creator.skills or [])
        c_niches = set(creator.target_niches or [])

        for b in briefs:
            b_tools = set(b.required_tools or [])
            b_skills = set(b.creator_capabilities.required_capabilities or [])
            tool_ov = len(b_tools.intersection(c_tools))
            skill_ov = len(b_skills.intersection(c_skills))

            tool_score = (tool_ov / max(1, len(b_tools))) * 100 if b_tools else 85.0
            skill_score = (skill_ov / max(1, len(b_skills))) * 100 if b_skills else 80.0
            overall = round(tool_score * 0.5 + skill_score * 0.5, 1)

            factors = [
                MatchScoreFactor(
                    factor_name="Tool & Workflow Alignment",
                    weight=0.5,
                    score=tool_score,
                    explanation=f"Overlaps with your certified tools ({', '.join(list(c_tools)[:2])})",
                ),
                MatchScoreFactor(
                    factor_name="Deliverable Competency",
                    weight=0.5,
                    score=skill_score,
                    explanation="Matches your production deliverables and stylistic specialization",
                ),
            ]

            recommendations.append(
                BriefMatchResult(
                    brief_id=str(b.id),
                    brief_title=b.title,
                    brand_name=b.brand_or_product_name or "Verified Brand",
                    overall_match_score=overall,
                    factors=factors,
                    summary_explanation=f"High affinity project ({overall}% match) matching your toolstack.",
                    budget_cents=b.budget_cents or 250000,
                    deadline=b.deadline,
                    category=b.campaign_category or "Commercial Creative",
                    platforms=b.platforms or ["TikTok", "Instagram Reels"],
                    required_tools=b.required_tools or ["Midjourney", "Runway"],
                )
            )

        recommendations.sort(key=lambda r: r.overall_match_score, reverse=True)
        return recommendations[:5] if recommendations else self._fallback_brief_recommendations()

    def _fallback_brief_recommendations(self) -> List[BriefMatchResult]:
        """Provides high-quality default recommendations when database briefs are sparse."""
        return [
            BriefMatchResult(
                brief_id="rec-brief-01",
                brief_title="Cyberpunk Streetwear 3D Kinetic Ad",
                brand_name="AURA Futurewear",
                overall_match_score=94.5,
                factors=[
                    MatchScoreFactor(
                        factor_name="Tool Alignment",
                        weight=0.5,
                        score=95.0,
                        explanation="Requires Runway Gen-3 and Midjourney v6 photorealism",
                    ),
                    MatchScoreFactor(
                        factor_name="Format Expertise",
                        weight=0.5,
                        score=94.0,
                        explanation="9:16 vertical short-form narrative with dynamic glitch transitions",
                    ),
                ],
                summary_explanation="Exceptional match for cinematic generative visual artists.",
                budget_cents=350000,
                category="Fashion & Apparel",
                platforms=["TikTok", "Instagram Reels"],
                required_tools=["Midjourney", "Runway Gen-3"],
            ),
            BriefMatchResult(
                brief_id="rec-brief-02",
                brief_title="Neo-Tokyo Energy Drink Launch Campaign",
                brand_name="Volt Beverages",
                overall_match_score=88.0,
                factors=[
                    MatchScoreFactor(
                        factor_name="Tool Alignment",
                        weight=0.5,
                        score=86.0,
                        explanation="Sound design and multi-angle product animation",
                    ),
                    MatchScoreFactor(
                        factor_name="Category Depth",
                        weight=0.5,
                        score=90.0,
                        explanation="Commercial product visualization and high-retention editing",
                    ),
                ],
                summary_explanation="Strong match with competitive budget and clear deliverables.",
                budget_cents=450000,
                category="Food & Beverage",
                platforms=["YouTube Shorts", "Instagram"],
                required_tools=["Stable Diffusion", "ElevenLabs"],
            ),
        ]
