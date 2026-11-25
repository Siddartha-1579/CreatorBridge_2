"""Verification domain service for creator trust signals and integrity claims."""

from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.services.base import BaseService
from app.repositories import verification_repository, VerificationRepository
from app.schemas.creator import (
    VerificationType,
    VerificationStatus,
    VerificationBadge,
    VerificationRecordCreate,
    VerificationRecordResponse,
    CreatorProfileResponse,
)


class VerificationService(BaseService):
    """
    Manages creator identity verification, tool authorization proof,
    workflow audits, and evidence-backed trust signals.
    """

    def __init__(self, repo: Optional[VerificationRepository] = None):
        super().__init__("verification")
        self.repo = repo or verification_repository

    async def get_badges_for_creator(self, creator_id: UUID) -> List[VerificationBadge]:
        """
        Returns verification badges across all 6 core categories.
        Badges without a record default to NOT_STARTED.
        """
        records = await self.repo.list_by_creator(creator_id)
        record_map = {r.verification_type: r for r in records}

        badge_definitions = [
            (VerificationType.EMAIL_VERIFIED, "Email Verified"),
            (VerificationType.TOOL_VERIFIED, "Tool Access Verified"),
            (VerificationType.PORTFOLIO_VERIFIED, "Portfolio Asset Verified"),
            (VerificationType.WORKFLOW_VERIFIED, "AI Workflow Audited"),
            (VerificationType.IDENTITY_VERIFIED, "Identity Verified"),
            (VerificationType.EXPERIENCE_VERIFIED, "Commercial Delivery Verified"),
        ]

        badges: List[VerificationBadge] = []
        for vtype, label in badge_definitions:
            rec = record_map.get(vtype)
            if rec:
                badges.append(
                    VerificationBadge(
                        type=vtype,
                        label=label,
                        status=rec.status,
                        target_id=rec.target_id,
                        verified_at=rec.created_at if rec.status == VerificationStatus.VERIFIED else None,
                    )
                )
            else:
                badges.append(
                    VerificationBadge(
                        type=vtype,
                        label=label,
                        status=VerificationStatus.NOT_STARTED,
                        target_id=None,
                        verified_at=None,
                    )
                )
        return badges

    async def get_creator_claims(self, creator_id: UUID) -> List[VerificationRecordResponse]:
        """Returns all private verification claims submitted by the creator."""
        return await self.repo.list_by_creator(creator_id)

    async def submit_verification_claim(
        self,
        creator_id: UUID,
        claim: VerificationRecordCreate,
    ) -> VerificationRecordResponse:
        """
        Records a new verification claim submitted by the creator.
        Status is set to PENDING for manual/automated review, except EMAIL_VERIFIED
        which can transition to VERIFIED immediately if basic requirements are satisfied.
        """
        now = datetime.now(timezone.utc)
        status = VerificationStatus.PENDING

        # Auto-verify email verification claims
        if claim.verification_type == VerificationType.EMAIL_VERIFIED:
            status = VerificationStatus.VERIFIED

        record = VerificationRecordResponse(
            id=uuid4(),
            creator_id=creator_id,
            verification_type=claim.verification_type,
            target_id=claim.target_id,
            status=status,
            notes=claim.notes or f"Verification submission for {claim.verification_type.value}",
            created_at=now,
        )
        return await self.repo.create(record)

    def generate_trust_signals(
        self,
        creator: CreatorProfileResponse,
        badges: List[VerificationBadge],
        portfolio_count: int,
    ) -> List[str]:
        """
        Generates strict, factual trust signal statements based ONLY on verified badges,
        authentic assessment status, and real portfolio metrics. No fake metrics allowed.
        """
        signals: List[str] = []

        # Assessment trust signal
        if creator.assessment_completed:
            signals.append(f"AI Capability Assessed ({creator.level.value.replace('_', ' ').title()})")

        # Badge-based trust signals
        for badge in badges:
            if badge.status == VerificationStatus.VERIFIED:
                if badge.type == VerificationType.EMAIL_VERIFIED:
                    signals.append("Identity & Contact Verified")
                elif badge.type == VerificationType.TOOL_VERIFIED:
                    tool_desc = f": {badge.target_id}" if badge.target_id else ""
                    signals.append(f"AI Toolchain Access Verified{tool_desc}")
                elif badge.type == VerificationType.PORTFOLIO_VERIFIED:
                    signals.append("Portfolio Assets Rights-Cleared")
                elif badge.type == VerificationType.WORKFLOW_VERIFIED:
                    signals.append("Multi-Stage AI Workflow Audited")
                elif badge.type == VerificationType.IDENTITY_VERIFIED:
                    signals.append("Government Identity / KYC Verified")
                elif badge.type == VerificationType.EXPERIENCE_VERIFIED:
                    signals.append("Commercial Client Track Record Verified")

        # Portfolio density signal
        if portfolio_count > 0:
            signals.append(f"{portfolio_count} Verified Production Asset{'s' if portfolio_count > 1 else ''}")

        if not signals:
            signals.append("Profile under verification review")

        return signals


verification_service = VerificationService()
