"""Server-side Capability Assessment and Creator Level calculation engine.

Evaluates raw creator responses against scoring rubrics and production benchmarks.
Enforces strict anti-tampering: scores and levels are computed exclusively on the server.
"""

from typing import Dict, Any, List, Tuple
from uuid import uuid4, UUID
from datetime import datetime, timezone

from app.schemas.assessment import (
    DimensionScores,
    AssessmentResultResponse,
    SkillDimension,
    QuestionDifficulty,
)
from app.services.question_bank import (
    QUESTION_SCORING_RULES,
    QUESTION_BANK_DEFINITIONS,
    TOOL_CATALOG,
)


class AssessmentEngine:
    """
    Algorithmic calculation engine for creator creative capabilities and level ranking.
    Decouples self-reported experience from evidence-based capability testing.
    """

    # Level thresholds and descriptive titles
    LEVEL_TIERS = [
        {"threshold": 91.0, "code": "LEVEL_5_PROFESSIONAL", "title": "Professional AI Creator", "badge": "Tier 5 Master"},
        {"threshold": 80.0, "code": "LEVEL_4_ADVANCED", "title": "Advanced AI Creator", "badge": "Tier 4 Advanced"},
        {"threshold": 65.0, "code": "LEVEL_3_SKILLED", "title": "Skilled AI Creator", "badge": "Tier 3 Specialist"},
        {"threshold": 45.0, "code": "LEVEL_2_PRACTITIONER", "title": "AI Practitioner", "badge": "Tier 2 Practitioner"},
        {"threshold": 0.0, "code": "LEVEL_1_EXPLORER", "title": "AI Explorer", "badge": "Tier 1 Explorer"},
    ]

    @classmethod
    def calculate_results(
        cls,
        assessment_id: UUID,
        user_id: str,
        responses: Dict[str, Any],
        specialization: str = "ai_filmmaking",
    ) -> AssessmentResultResponse:
        """
        Computes multi-dimensional capability scores and authoritative creator level.
        Prevents client tampering by calculating all metrics from first principles.
        """
        dimension_points: Dict[str, float] = {
            "TECHNICAL": 0.0,
            "CREATIVE": 0.0,
            "WORKFLOW": 0.0,
            "PROBLEM_SOLVING": 0.0,
            "COMMERCIAL": 0.0,
        }
        dimension_max_points: Dict[str, float] = {
            "TECHNICAL": 0.0,
            "CREATIVE": 0.0,
            "WORKFLOW": 0.0,
            "PROBLEM_SOLVING": 0.0,
            "COMMERCIAL": 0.0,
        }

        # 1. Evaluate tool catalog breadth and sophistication
        tools_selected = responses.get("tools_selected", [])
        if isinstance(tools_selected, list):
            # Base technical points from tool stack
            tool_points = min(100.0, len(tools_selected) * 12.0)
            if any(t in tools_selected for t in ["comfyui", "sdxl", "blender"]):
                tool_points = min(100.0, tool_points + 15.0)  # bonus for node/advanced local tooling
            dimension_points["TECHNICAL"] += tool_points
            dimension_max_points["TECHNICAL"] += 100.0

        # 2. Evaluate all scored questions
        for q_id, rule in QUESTION_SCORING_RULES.items():
            if q_id not in responses:
                continue

            user_ans = responses[q_id]
            dim = rule.get("dimension", "TECHNICAL")
            weight = rule.get("weight", 1) * 20.0
            score_fraction = 0.0

            # Single Choice / Scenario evaluation
            if "correct" in rule:
                correct_answers = rule["correct"]
                partial_answers = rule.get("partial", {})

                if user_ans in correct_answers:
                    score_fraction = 1.0
                elif user_ans in partial_answers:
                    score_fraction = partial_answers[user_ans]
                else:
                    # Minor baseline for plausible attempt
                    score_fraction = 0.2

            # Workflow Ordering evaluation
            elif "correct_order" in rule:
                correct_order = rule["correct_order"]
                if isinstance(user_ans, list) and len(user_ans) == len(correct_order):
                    # Check sequence alignment
                    matches = sum(1 for i, item in enumerate(user_ans) if item == correct_order[i])
                    score_fraction = max(0.2, matches / len(correct_order))
                else:
                    score_fraction = 0.5

            dimension_points[dim] += score_fraction * weight
            dimension_max_points[dim] += weight

        # 3. Factor in Confidence Scale
        confidence_ans = responses.get("comm_turnaround_confidence")
        if confidence_ans is not None:
            try:
                rating = float(confidence_ans)
                conf_score = min(100.0, max(20.0, (rating / 5.0) * 100.0))
                dimension_points["WORKFLOW"] += conf_score * 0.3
                dimension_max_points["WORKFLOW"] += 30.0
            except (ValueError, TypeError):
                pass

        # 4. Normalize dimension scores to 0.0 - 100.0 scale
        normalized_dimensions: Dict[str, float] = {}
        for dim, pts in dimension_points.items():
            max_pts = dimension_max_points.get(dim, 1.0)
            if max_pts > 0:
                normalized = round(min(100.0, max(25.0, (pts / max_pts) * 100.0)), 2)
            else:
                normalized = 50.0  # sensible baseline
            normalized_dimensions[dim] = normalized

        # 5. Calculate Weighted Overall Capability Score
        overall_score = round(
            (normalized_dimensions["TECHNICAL"] * 0.25)
            + (normalized_dimensions["CREATIVE"] * 0.25)
            + (normalized_dimensions["WORKFLOW"] * 0.20)
            + (normalized_dimensions["PROBLEM_SOLVING"] * 0.15)
            + (normalized_dimensions["COMMERCIAL"] * 0.15),
            2,
        )

        # 6. Assign Creator Level based on evidence
        calculated_level = "LEVEL_1_EXPLORER"
        level_name = "AI Explorer"

        for tier in cls.LEVEL_TIERS:
            if overall_score >= tier["threshold"]:
                calculated_level = tier["code"]
                level_name = tier["title"]
                break

        # 7. Identify Strengths, Growth Areas & Recommended Paths
        sorted_dims = sorted(normalized_dimensions.items(), key=lambda x: x[1], reverse=True)
        top_dims = [dim.replace("_", " ").title() for dim, val in sorted_dims if val >= 70.0]
        bottom_dims = [dim.replace("_", " ").title() for dim, val in sorted_dims if val < 75.0]

        strengths = top_dims[:3] if top_dims else ["Creative Vision", "Prompt Exploration"]
        growth_areas = bottom_dims[-2:] if bottom_dims else ["Advanced Node Graph Workflows", "Commercial Mastering"]

        recommended_paths = [
            f"Explore master brief invitations in {specialization.replace('_', ' ').title()}",
            "Calibrate consistency using custom LoRA and IP-Adapter control points",
            "Master studio deliverable standards with ProRes 422HQ and uncompressed stems",
        ]

        dim_scores = DimensionScores(
            technical=normalized_dimensions["TECHNICAL"],
            creative=normalized_dimensions["CREATIVE"],
            workflow=normalized_dimensions["WORKFLOW"],
            problem_solving=normalized_dimensions["PROBLEM_SOLVING"],
            commercial=normalized_dimensions["COMMERCIAL"],
        )

        return AssessmentResultResponse(
            id=uuid4(),
            assessment_id=assessment_id,
            user_id=user_id,
            overall_score=overall_score,
            calculated_level=calculated_level,
            level_name=level_name,
            technical_score=normalized_dimensions["TECHNICAL"],
            creative_score=normalized_dimensions["CREATIVE"],
            workflow_score=normalized_dimensions["WORKFLOW"],
            problem_solving_score=normalized_dimensions["PROBLEM_SOLVING"],
            commercial_readiness_score=normalized_dimensions["COMMERCIAL"],
            dimension_scores=dim_scores,
            strengths=strengths,
            growth_areas=growth_areas,
            recommended_paths=recommended_paths,
            created_at=datetime.now(timezone.utc),
        )


assessment_engine = AssessmentEngine()
