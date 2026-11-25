"""CreatorBridge Transparent Honesty, Professional Reliability & Demerit Scoring Engine.

Implements mathematically reproducible, explainable trust calculation:
- Base score: 100
- Initial status: 'New — insufficient history'
- Severities: Minor (5), Moderate (15), Major (30), Critical (50)
- Recurrence multipliers: 1.0x (1st), 1.25x (2nd), 1.5x (3rd+) capped at 50 pts/incident
- Recovery: 5 pts per qualifying 90 days without confirmed violations (max 15 pts/year)
- Strict defense against prohibited / discriminatory criteria
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta
from uuid import UUID

from app.schemas.trust import (
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
    CaseStatus,
    VerifiedBadge,
    TrustIncidentResponse,
    TrustScoreResponse,
    PublicTrustProfileResponse,
)
from app.core.errors import ValidationException, ForbiddenException
from app.core.logging import get_logger

logger = get_logger("trust_engine")

# Severity Base Penalties
SEVERITY_BASE_PENALTIES: Dict[IncidentSeverity, int] = {
    IncidentSeverity.MINOR: 5,
    IncidentSeverity.MODERATE: 15,
    IncidentSeverity.MAJOR: 30,
    IncidentSeverity.CRITICAL: 50,
}

# Maximum penalty any single incident can incur after multipliers
SINGLE_INCIDENT_PENALTY_CAP = 50

# Maximum recovery points per rolling 12 months
ANNUAL_MAX_RECOVERY_POINTS = 15

# Prohibited criteria keywords that can NEVER trigger demerits
PROHIBITED_CRITERIA_KEYWORDS = [
    "religion", "religious", "faith", "mosque", "church", "temple", "synagogue",
    "christian", "muslim", "jewish", "hindu", "buddhist", "atheist",
    "political", "politics", "politician", "democrat", "republican", "conservative", "liberal",
    "nationality", "ethnicity", "race", "caucasian", "african", "asian", "hispanic",
    "gender", "sexuality", "transgender", "lgbt",
    "using ai", "uses ai", "ai generation"  # The use of AI itself cannot be penalized
]


def validate_non_discriminatory(text: str) -> None:
    """Verifies that an incident description or reason does NOT penalize prohibited characteristics."""
    if not text:
        return
    text_lower = text.lower()
    for keyword in PROHIBITED_CRITERIA_KEYWORDS:
        if keyword in text_lower:
            # Check context: If someone complains about the user's religion, politics, or nationality
            if any(cue in text_lower for cue in ["because of", "due to their", "origin", "belief", "is a"]):
                raise ValidationException(
                    f"Prohibited scoring criterion: Trust scores cannot penalize lawful expression, "
                    f"protected characteristics, or beliefs ({keyword})."
                )


def calculate_incident_penalty(
    severity: IncidentSeverity,
    recurrence_count: int = 1,
) -> Tuple[int, float, int]:
    """
    Calculates the penalty for a confirmed incident.
    Returns: (base_penalty, recurrence_multiplier, calculated_penalty)
    """
    base = SEVERITY_BASE_PENALTIES.get(severity, 5)

    if recurrence_count <= 1:
        multiplier = 1.00
    elif recurrence_count == 2:
        multiplier = 1.25
    else:
        multiplier = 1.50

    raw = round(base * multiplier)
    calculated = min(SINGLE_INCIDENT_PENALTY_CAP, raw)
    return base, multiplier, calculated


def calculate_recovery_points(
    last_violation_date: Optional[datetime],
    active_demerits: int,
    reference_time: Optional[datetime] = None,
) -> int:
    """
    Calculates eligible recovery points:
    - 5 points per qualifying 90-day period without a new confirmed violation
    - Capped at 15 points per rolling 12 months
    - Can never exceed active demerits (cannot raise score above 100)
    """
    if active_demerits <= 0 or not last_violation_date:
        return 0

    now = reference_time or datetime.now(timezone.utc)
    if last_violation_date.tzinfo is None:
        last_violation_date = last_violation_date.replace(tzinfo=timezone.utc)

    days_elapsed = max(0, (now - last_violation_date).days)
    qualifying_90_day_periods = days_elapsed // 90

    earned_points = qualifying_90_day_periods * 5
    capped_points = min(ANNUAL_MAX_RECOVERY_POINTS, earned_points)
    
    # Recovery points cannot exceed outstanding demerits
    return min(active_demerits, capped_points)


def compute_trust_score(
    incidents: List[Dict[str, Any]],
    verified_badges: Optional[List[VerifiedBadge]] = None,
    reference_time: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Authoritative, deterministic score calculation from incident ledger.
    Score = max(0, min(100, 100 - Total Active Demerits + Eligible Recovery Points))
    """
    now = reference_time or datetime.now(timezone.utc)

    # Filter active vs historical/overturned incidents
    active_incidents = [inc for inc in incidents if inc.get("status") == IncidentStatus.ACTIVE.value]
    overturned_incidents = [inc for inc in incidents if inc.get("status") == IncidentStatus.OVERTURNED.value]

    total_active_demerits = sum(inc.get("calculated_penalty", 0) for inc in active_incidents)

    # Find the most recent violation timestamp
    last_violation_date: Optional[datetime] = None
    for inc in active_incidents:
        confirmed_at_str = inc.get("confirmed_at")
        if confirmed_at_str:
            try:
                dt = datetime.fromisoformat(confirmed_at_str.replace("Z", "+00:00"))
                if not last_violation_date or dt > last_violation_date:
                    last_violation_date = dt
            except Exception:
                pass

    recovery_points = calculate_recovery_points(
        last_violation_date, total_active_demerits, reference_time=now
    )

    raw_score = 100 - total_active_demerits + recovery_points
    final_score = max(0, min(100, raw_score))

    # Determine status label
    if len(incidents) == 0:
        status_label = "New — insufficient history"
    elif final_score >= 90:
        status_label = "Good standing"
    elif final_score >= 70:
        status_label = "Under review — active demerits"
    elif final_score >= 50:
        status_label = "Action required — high demerits"
    else:
        status_label = "Restricted — critical reliability alerts"

    return {
        "score": final_score,
        "status_label": status_label,
        "total_active_demerits": total_active_demerits,
        "eligible_recovery_points": recovery_points,
        "confirmed_incidents_count": len(incidents) - len(overturned_incidents),
        "overturned_incidents_count": len(overturned_incidents),
        "last_violation_at": last_violation_date.isoformat() if last_violation_date else None,
        "last_recalculated_at": now.isoformat(),
        "verified_badges": verified_badges or [],
    }
