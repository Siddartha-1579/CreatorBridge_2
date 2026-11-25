"""Trust repository managing authoritative incident ledger, cases, and scores."""

from typing import Dict, List, Any, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.schemas.trust import (
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
    CaseStatus,
    VerifiedBadge,
    TrustIncidentResponse,
    TrustCaseResponse,
    TrustScoreResponse,
    PublicTrustProfileResponse,
)
from app.services.trust_engine import (
    compute_trust_score,
    calculate_incident_penalty,
    validate_non_discriminatory,
)
from app.core.errors import ValidationException, NotFoundException, ForbiddenException
from app.core.logging import get_logger

logger = get_logger("trust_repository")


class TrustRepository:
    def __init__(self):
        # account_id -> List[Dict] (Authoritative incident ledger)
        self._incidents: Dict[str, List[Dict[str, Any]]] = {}
        # case_id -> Dict
        self._cases: Dict[str, Dict[str, Any]] = {}
        # account_id -> List[VerifiedBadge]
        self._badges: Dict[str, List[VerifiedBadge]] = {}
        # Audit history: List[Dict]
        self._audits: List[Dict[str, Any]] = []

    async def get_or_create_score(self, account_id: str) -> TrustScoreResponse:
        incidents = self._incidents.get(account_id, [])
        # Never fabricate a verification badge or timestamp. Only persisted/explicitly
        # recorded badges are evidence; a new account has no public numerical trust score.
        badges = self._badges.get(account_id, [])
        calc = compute_trust_score(incidents, verified_badges=badges)

        incident_models = [
            TrustIncidentResponse(**inc) for inc in incidents
        ]

        return TrustScoreResponse(
            account_id=account_id,
            score=calc["score"],
            status_label=calc["status_label"],
            total_active_demerits=calc["total_active_demerits"],
            eligible_recovery_points=calc["eligible_recovery_points"],
            confirmed_incidents_count=calc["confirmed_incidents_count"],
            overturned_incidents_count=calc["overturned_incidents_count"],
            verified_badges=badges,
            active_incidents=[inc for inc in incident_models if inc.status == IncidentStatus.ACTIVE],
            last_violation_at=calc["last_violation_at"],
            last_recalculated_at=calc["last_recalculated_at"],
        )

    async def get_public_profile(self, account_id: str) -> PublicTrustProfileResponse:
        score_res = await self.get_or_create_score(account_id)
        active_count = len(score_res.active_incidents)
        return PublicTrustProfileResponse(
            account_id=account_id,
            score=(score_res.score if (score_res.verified_badges or score_res.confirmed_incidents_count > 0) else None),
            status_label=(score_res.status_label if (score_res.verified_badges or score_res.confirmed_incidents_count > 0) else "New — insufficient verified history"),
            verified_badges=score_res.verified_badges,
            active_incidents_count=active_count,
            last_recalculated_at=score_res.last_recalculated_at,
        )

    async def create_case(
        self,
        reporting_account_id: str,
        reported_account_id: str,
        category: IncidentCategory,
        description: str,
        evidence_urls: List[str],
        reference_id: Optional[str] = None,
    ) -> TrustCaseResponse:
        if reporting_account_id == reported_account_id:
            raise ValidationException("Users cannot submit dispute reports against their own account.")

        # Guardrail against prohibited / discriminatory claims
        validate_non_discriminatory(description)

        case_id = str(uuid4())
        case_num = f"CASE-{datetime.now(timezone.utc).strftime('%Y')}-{str(uuid4())[:6].upper()}"
        now = datetime.now(timezone.utc).isoformat()

        record = {
            "id": case_id,
            "case_number": case_num,
            "reporting_account_id": reporting_account_id,
            "reported_account_id": reported_account_id,
            "category": category,
            "description": description,
            "evidence_urls": evidence_urls,
            "reference_id": reference_id,
            "status": CaseStatus.SUBMITTED,
            "assigned_reviewer_id": None,
            "decision_rationale": None,
            "severity_assessed": None,
            "penalty_applied": 0,
            "incident_id": None,
            "appeal_text": None,
            "appeal_submitted_at": None,
            "appeal_rationale": None,
            "created_at": now,
            "updated_at": now,
        }
        self._cases[case_id] = record
        logger.info(f"Trust dispute case created: {case_num} for reported account {reported_account_id}")
        return TrustCaseResponse(**record)

    async def get_cases_for_account(self, account_id: str) -> List[TrustCaseResponse]:
        results = []
        for case in self._cases.values():
            if case["reported_account_id"] == account_id or case["reporting_account_id"] == account_id:
                results.append(TrustCaseResponse(**case))
        return results

    async def review_case(
        self,
        case_id: str,
        reviewer_id: str,
        decision: str,  # "CONFIRM" or "DISMISS"
        rationale: str,
        severity: Optional[IncidentSeverity] = None,
    ) -> TrustCaseResponse:
        case = self._cases.get(case_id)
        if not case:
            raise NotFoundException(f"Case {case_id} not found")

        validate_non_discriminatory(rationale)
        now = datetime.now(timezone.utc).isoformat()

        if decision == "DISMISS":
            case["status"] = CaseStatus.DISMISSED
            case["decision_rationale"] = rationale
            case["assigned_reviewer_id"] = reviewer_id
            case["updated_at"] = now
            return TrustCaseResponse(**case)

        # Decision is CONFIRM: Add incident to authoritative ledger
        if not severity:
            severity = IncidentSeverity.MODERATE

        reported_id = case["reported_account_id"]
        cat = case["category"]

        # Calculate recurrence in this category
        account_incidents = self._incidents.setdefault(reported_id, [])
        cat_incidents = [
            inc for inc in account_incidents
            if inc["incident_category"] == cat and inc["status"] != IncidentStatus.OVERTURNED.value
        ]
        recurrence_count = len(cat_incidents) + 1

        base_pen, multiplier, calc_pen = calculate_incident_penalty(severity, recurrence_count)

        incident_id = str(uuid4())
        incident_record = {
            "id": incident_id,
            "account_id": reported_id,
            "case_id": case_id,
            "incident_category": cat,
            "severity": severity,
            "base_penalty": base_pen,
            "recurrence_count": recurrence_count,
            "recurrence_multiplier": multiplier,
            "calculated_penalty": calc_pen,
            "status": IncidentStatus.ACTIVE.value,
            "rationale": rationale,
            "confirmed_at": now,
            "overturned_at": None,
            "overturned_reason": None,
        }
        account_incidents.append(incident_record)

        # Update case
        case["status"] = CaseStatus.CONFIRMED
        case["assigned_reviewer_id"] = reviewer_id
        case["decision_rationale"] = rationale
        case["severity_assessed"] = severity
        case["penalty_applied"] = calc_pen
        case["incident_id"] = incident_id
        case["updated_at"] = now

        # Record audit
        self._audits.append({
            "account_id": reported_id,
            "incident_id": incident_id,
            "penalty": calc_pen,
            "action": "INCIDENT_CONFIRMED",
            "timestamp": now,
        })
        logger.info(f"Incident confirmed for account {reported_id}: penalty {calc_pen}")
        return TrustCaseResponse(**case)

    async def submit_appeal(
        self,
        case_id: str,
        account_id: str,
        appeal_text: str,
        supporting_evidence: List[str],
    ) -> TrustCaseResponse:
        case = self._cases.get(case_id)
        if not case:
            raise NotFoundException(f"Case {case_id} not found")

        if case["reported_account_id"] != account_id:
            raise ForbiddenException("Only the reported account may appeal a case.")

        if case["status"] != CaseStatus.CONFIRMED:
            raise ValidationException("Only confirmed cases can be appealed.")

        case["status"] = CaseStatus.APPEALED
        case["appeal_text"] = appeal_text
        case["appeal_submitted_at"] = datetime.now(timezone.utc).isoformat()
        case["updated_at"] = datetime.now(timezone.utc).isoformat()
        return TrustCaseResponse(**case)

    async def decide_appeal(
        self,
        case_id: str,
        reviewer_id: str,
        decision: str,  # "OVERTURN" or "UPHOLD"
        rationale: str,
    ) -> TrustCaseResponse:
        case = self._cases.get(case_id)
        if not case:
            raise NotFoundException(f"Case {case_id} not found")

        now = datetime.now(timezone.utc).isoformat()
        case["appeal_rationale"] = rationale

        if decision == "OVERTURN":
            case["status"] = CaseStatus.OVERTURNED
            inc_id = case.get("incident_id")
            if inc_id:
                # Find and overturn incident in ledger
                reported_id = case["reported_account_id"]
                for inc in self._incidents.get(reported_id, []):
                    if inc["id"] == inc_id:
                        inc["status"] = IncidentStatus.OVERTURNED.value
                        inc["overturned_at"] = now
                        inc["overturned_reason"] = rationale
                        logger.info(f"Incident {inc_id} overturned for account {reported_id}. Penalty reversed.")
                        break

            self._audits.append({
                "account_id": case["reported_account_id"],
                "case_id": case_id,
                "action": "APPEAL_OVERTURNED",
                "timestamp": now,
            })
        else:
            case["status"] = CaseStatus.CONFIRMED  # Upheld

        case["updated_at"] = now
        return TrustCaseResponse(**case)


trust_repository = TrustRepository()
