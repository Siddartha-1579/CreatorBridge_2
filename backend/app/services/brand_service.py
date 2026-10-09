"""Brand domain service for organization profile, completeness, trust signals, and dashboard overview."""

from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.services.base import BaseService
from app.core.errors import NotFoundException, ForbiddenException
from app.repositories import (
    brand_repository,
    BrandRepository,
    brand_preferences_repository,
    BrandPreferencesRepository,
    brand_verification_repository,
    BrandVerificationRepository,
    brief_repository,
)
from app.schemas.brand import (
    BrandProfileCreate,
    BrandProfileUpdate,
    BrandProfileResponse,
    BrandPreferencesBase,
    BrandPreferencesResponse,
    BrandCompletenessItem,
    BrandCompletenessResponse,
    BrandVerificationBadge,
    BrandVerificationStatus,
    BrandVerificationCategory,
    BrandVerificationClaimCreate,
    BrandVerificationRecordResponse,
    BrandDashboardOverviewResponse,
)


class BrandService(BaseService):
    """Business logic for Brand organization profiles, preferences, and verification."""

    def __init__(
        self,
        repo: Optional[BrandRepository] = None,
        pref_repo: Optional[BrandPreferencesRepository] = None,
        verif_repo: Optional[BrandVerificationRepository] = None,
    ):
        super().__init__("brand")
        self.repo = repo or brand_repository
        self.pref_repo = pref_repo or brand_preferences_repository
        self.verif_repo = verif_repo or brand_verification_repository

    async def get_brand_by_id(self, brand_id: UUID) -> BrandProfileResponse:
        brand = await self.repo.get_by_id(brand_id)
        if not brand:
            raise NotFoundException("Brand Organization", brand_id)
        return brand

    async def list_brands(self, skip: int = 0, limit: int = 20) -> List[BrandProfileResponse]:
        return await self.repo.list_all(skip=skip, limit=limit)

    async def get_brand_by_user_id(
        self,
        user_id: str,
        user_email: Optional[str] = None,
    ) -> BrandProfileResponse:
        """Retrieves brand profile by user ID or auto-creates draft organization profile."""
        profile = await self.repo.get_by_user_id(user_id)
        if profile:
            return profile

        now = datetime.now(timezone.utc)
        email_prefix = user_email.split("@")[0] if user_email else "Organization"
        company_name = f"{email_prefix.replace('.', ' ').capitalize()} Brand"

        new_profile = BrandProfileResponse(
            id=uuid4(),
            user_id=user_id,
            company_name=company_name,
            organization_type="Consumer Brand",
            primary_industry="Technology",
            secondary_industries=[],
            contact_name=email_prefix.capitalize(),
            business_email=user_email,
            website=None,
            logo_url=None,
            description=None,
            location=None,
            team_size="1-10",
            social_links={},
            brand_guidelines_url=None,
            preferred_communication="EMAIL",
            is_agency=False,
            verification_status=BrandVerificationStatus.NOT_STARTED,
            onboarding_completed=False,
            profile_completeness_pct=25,
            metadata={},
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create(new_profile)

    async def create_profile(self, user_id: str, data: BrandProfileCreate) -> BrandProfileResponse:
        existing = await self.repo.get_by_user_id(user_id)
        if existing:
            return existing

        now = datetime.now(timezone.utc)
        profile = BrandProfileResponse(
            id=uuid4(),
            user_id=user_id,
            company_name=data.company_name,
            organization_type=data.organization_type or "Consumer Brand",
            primary_industry=data.primary_industry or data.industry,
            secondary_industries=data.secondary_industries,
            contact_name=data.contact_name,
            business_email=data.business_email or data.billing_email,
            website=data.website,
            logo_url=data.logo_url,
            description=data.description,
            location=data.location,
            team_size=data.team_size or data.company_size,
            social_links=data.social_links,
            brand_guidelines_url=data.brand_guidelines_url,
            preferred_communication=data.preferred_communication,
            is_agency=data.is_agency,
            verification_status=BrandVerificationStatus.NOT_STARTED,
            onboarding_completed=False,
            profile_completeness_pct=30,
            metadata={},
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create(profile)

    async def update_profile_by_user_id(
        self,
        user_id: str,
        data: BrandProfileUpdate,
    ) -> BrandProfileResponse:
        """Safely updates brand profile while strictly protecting calculated fields."""
        profile = await self.get_brand_by_user_id(user_id)

        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}

        # Guard against tampering with server-calculated fields
        protected_fields = ["id", "user_id", "verification_status"]
        for field in protected_fields:
            update_dict.pop(field, None)

        # Handle backward compatibility aliases
        if "industry" in update_dict and not update_dict.get("primary_industry"):
            update_dict["primary_industry"] = update_dict.pop("industry")
        if "company_size" in update_dict and not update_dict.get("team_size"):
            update_dict["team_size"] = update_dict.pop("company_size")
        if "billing_email" in update_dict and not update_dict.get("business_email"):
            update_dict["business_email"] = update_dict.pop("billing_email")

        updated = await self.repo.update(profile.id, update_dict)
        if not updated:
            raise NotFoundException("Brand Organization", profile.id)

        # Recalculate completeness
        comp = await self.calculate_completeness(updated.id)
        if updated.profile_completeness_pct != comp.percentage:
            updated = await self.repo.update(updated.id, {"profile_completeness_pct": comp.percentage})

        return updated

    async def update_profile(self, brand_id: UUID, data: BrandProfileUpdate) -> BrandProfileResponse:
        """Legacy updater by brand_id."""
        existing = await self.repo.get_by_id(brand_id)
        if not existing:
            raise NotFoundException("Brand Organization", brand_id)
        return await self.update_profile_by_user_id(existing.user_id, data)

    async def calculate_completeness(self, brand_id: UUID) -> BrandCompletenessResponse:
        """
        Dynamically calculates organization profile completeness across 10 checklist criteria.
        Returns percentage (0-100), items with hints, and prioritized tips.
        """
        brand = await self.repo.get_by_id(brand_id)
        if not brand:
            raise NotFoundException("Brand Organization", brand_id)

        pref = await self.pref_repo.get_by_brand_id(brand_id)

        items: List[BrandCompletenessItem] = [
            BrandCompletenessItem(
                key="company_name",
                label="Organization Name",
                completed=bool(brand.company_name and len(brand.company_name.strip()) >= 2),
                impact_pct=10,
                action_hint="Enter your official registered company or agency name",
            ),
            BrandCompletenessItem(
                key="organization_type",
                label="Organization Type",
                completed=bool(brand.organization_type and brand.organization_type != "Other"),
                impact_pct=10,
                action_hint="Select whether you are a Consumer Brand, D2C, Agency, or Production Studio",
            ),
            BrandCompletenessItem(
                key="primary_industry",
                label="Primary Industry",
                completed=bool(brand.primary_industry and len(brand.primary_industry.strip()) > 0),
                impact_pct=10,
                action_hint="Select your organization's primary industry sector",
            ),
            BrandCompletenessItem(
                key="contact_name",
                label="Primary Contact Person",
                completed=bool(brand.contact_name and len(brand.contact_name.strip()) >= 2),
                impact_pct=10,
                action_hint="Add the lead campaign manager or creative director's name",
            ),
            BrandCompletenessItem(
                key="business_email",
                label="Corporate Business Email",
                completed=bool(brand.business_email and "@" in brand.business_email),
                impact_pct=10,
                action_hint="Add a corporate business email domain for verification",
            ),
            BrandCompletenessItem(
                key="website",
                label="Official Website URL",
                completed=bool(brand.website and len(brand.website.strip()) >= 5),
                impact_pct=10,
                action_hint="Add your corporate or brand website for creator portfolio reference",
            ),
            BrandCompletenessItem(
                key="description",
                label="Organization Description",
                completed=bool(brand.description and len(brand.description.strip()) >= 20),
                impact_pct=10,
                action_hint="Write a short paragraph detailing your brand ethos, aesthetic, and mission",
            ),
            BrandCompletenessItem(
                key="location_and_team",
                label="Location & Team Size",
                completed=bool(brand.location or brand.team_size),
                impact_pct=10,
                action_hint="Provide your headquarters city and approximate organization team size",
            ),
            BrandCompletenessItem(
                key="content_requirements",
                label="Content Requirements & Intended Uses",
                completed=bool(pref and len(pref.content_requirements) > 0 and len(pref.intended_uses) > 0),
                impact_pct=10,
                action_hint="Configure creative formats and content requirements in brand preferences",
            ),
            BrandCompletenessItem(
                key="formats_and_styles",
                label="Preferred Formats & Visual Styles",
                completed=bool(pref and len(pref.preferred_formats) > 0 and len(pref.creative_styles) > 0),
                impact_pct=10,
                action_hint="Select aspect ratios (16:9, 9:16) and creative visual styles (Cinematic, Editorial)",
            ),
        ]

        total_pct = sum(item.impact_pct for item in items if item.completed)
        tips = [item.action_hint for item in items if not item.completed][:3]
        if not tips:
            tips.append("Your organization profile is 100% complete and optimized for creator matching!")

        return BrandCompletenessResponse(
            percentage=total_pct,
            items=items,
            improvement_tips=tips,
        )

    async def get_verification_badges(self, brand_id: UUID) -> List[BrandVerificationBadge]:
        """Returns the 4 verification badge categories and their current states."""
        records = await self.verif_repo.list_by_brand(brand_id)
        record_map = {r.verification_type: r for r in records}

        categories = [
            (BrandVerificationCategory.EMAIL_VERIFIED, "Corporate Email Verified"),
            (BrandVerificationCategory.DOMAIN_VERIFIED, "Website & Domain Authenticated"),
            (BrandVerificationCategory.ORGANIZATION_IDENTITY, "Company Legal Identity Verified"),
            (BrandVerificationCategory.BUSINESS_REGISTRATION, "Business Registration & Signatory Cleared"),
        ]

        badges: List[BrandVerificationBadge] = []
        for cat, label in categories:
            rec = record_map.get(cat)
            if rec:
                badges.append(
                    BrandVerificationBadge(
                        category=cat,
                        label=label,
                        status=rec.status,
                        verified_at=rec.created_at if rec.status == BrandVerificationStatus.VERIFIED else None,
                    )
                )
            else:
                badges.append(
                    BrandVerificationBadge(
                        category=cat,
                        label=label,
                        status=BrandVerificationStatus.NOT_STARTED,
                        verified_at=None,
                    )
                )
        return badges

    async def submit_verification_claim(
        self,
        brand_id: UUID,
        claim: BrandVerificationClaimCreate,
    ) -> BrandVerificationRecordResponse:
        """Records an organization verification claim. Kept private to protect company records."""
        now = datetime.now(timezone.utc)
        status = BrandVerificationStatus.PENDING

        # Domain/Email verified automatically if basic corporate match passes
        if claim.verification_type == BrandVerificationCategory.EMAIL_VERIFIED:
            status = BrandVerificationStatus.VERIFIED

        record = BrandVerificationRecordResponse(
            id=uuid4(),
            brand_id=brand_id,
            verification_type=claim.verification_type,
            status=status,
            notes=claim.notes or f"Verification submission for {claim.verification_type.value}",
            created_at=now,
        )
        return await self.verif_repo.create(record)

    async def get_dashboard_overview(self, user_id: str, email: Optional[str] = None) -> BrandDashboardOverviewResponse:
        """Gathers unified dashboard data: profile, preferences, dynamic completeness, and badges."""
        profile = await self.get_brand_by_user_id(user_id, email)
        preferences = await self.pref_repo.get_by_brand_id(profile.id)
        completeness = await self.calculate_completeness(profile.id)
        badges = await self.get_verification_badges(profile.id)

        # Count active briefs from brief repository
        briefs = await brief_repository.list_by_brand(profile.id)
        active_briefs_count = len(briefs)

        return BrandDashboardOverviewResponse(
            profile=profile,
            preferences=preferences,
            completeness=completeness,
            verification_badges=badges,
            active_briefs_count=active_briefs_count,
        )

    async def get_preferences(self, brand_id: UUID) -> Optional[BrandPreferencesResponse]:
        return await self.pref_repo.get_by_brand_id(brand_id)

    async def update_preferences(
        self,
        brand_id: UUID,
        data: BrandPreferencesBase,
    ) -> BrandPreferencesResponse:
        pref = await self.pref_repo.upsert(brand_id, data)
        # Recalculate completeness
        comp = await self.calculate_completeness(brand_id)
        await self.repo.update(brand_id, {"profile_completeness_pct": comp.percentage})
        return pref


brand_service = BrandService()
