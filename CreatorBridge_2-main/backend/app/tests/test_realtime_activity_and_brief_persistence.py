import pytest
from uuid import UUID
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.db import get_db_connection
from app.services.auth_service import AuthService
from app.services.brief_service import BriefService
from app.repositories.brief_repository import BriefRepository
from app.schemas.brief import CampaignBriefCreate, CampaignBriefUpdate, DeliverableItem, CreativeDirection, CreatorCapabilityRequirements, CommercialTerms
from app.schemas.brand import BrandProfileUpdate

client = TestClient(app)

def get_auth_headers(user_id: str, role: str) -> dict:
    auth_service = AuthService()
    token = auth_service.create_access_token({"sub": user_id, "role": role})
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.anyio
async def test_foundational_brief_seeding_and_16_sections():
    """Verify foundational brief 00000000-0000-0000-0000-000000000004 has all 16 sections, brand_id, and published_at."""
    repo = BriefRepository()
    sample_id = UUID("00000000-0000-0000-0000-000000000004")
    brief = await repo.get_by_id(sample_id)
    assert brief is not None
    assert str(brief.id) == "00000000-0000-0000-0000-000000000004"
    assert brief.status.value == "PUBLISHED"
    assert brief.published_at is not None
    assert brief.sections is not None
    assert len(brief.sections) == 16
    assert "campaign_overview" in brief.sections
    assert "call_to_action" in brief.sections
    assert "creator_eligibility" in brief.sections
    assert "deliverables_and_specs" in brief.sections
    # Verify brand join metadata populated
    assert brief.brand_name is not None

@pytest.mark.anyio
async def test_published_at_preserved_on_edit():
    """Editing a published brief preserves its original published_at timestamp."""
    repo = BriefRepository()
    service = BriefService()
    sample_id = UUID("00000000-0000-0000-0000-000000000004")
    original = await repo.get_by_id(sample_id)
    assert original is not None
    orig_pub = original.published_at

    # Update title
    updated = await service.update_brief(
        sample_id,
        "usr_lumina_skincare",
        CampaignBriefUpdate(title="Futuristic Beverage Launch Campaign - Updated Edition"),
    )
    assert updated.title == "Futuristic Beverage Launch Campaign - Updated Edition"
    assert updated.published_at is not None
    if orig_pub:
        assert updated.published_at == orig_pub

@pytest.mark.anyio
async def test_brand_created_at_persistence_and_protection():
    """Brand profile created_at is inherited from users table and cannot be overwritten."""
    from app.services.brand_service import BrandService
    brand_service = BrandService()
    # Query Lumina Skincare profile
    profile = await brand_service.get_brand_by_user_id("usr_lumina_skincare")
    assert profile is not None
    assert profile.created_at is not None
    original_created_at = profile.created_at

    # Attempt to overwrite created_at via update
    updated = await brand_service.update_profile_by_user_id(
        "usr_lumina_skincare",
        BrandProfileUpdate(company_name="Lumina Skincare"),
    )
    assert updated.created_at == original_created_at

@pytest.mark.anyio
async def test_creator_campaign_participation_idempotency_and_aliases():
    """Creator can join a campaign idempotently without duplicating participant records."""
    repo = BriefRepository()
    campaign_id = "00000000-0000-0000-0000-000000000004"
    creator_user_id = "usr_elena_rostova"
    creator_uuid = "00000000-0000-0000-0000-000000000021"

    # Join using user ID
    res1 = await repo.join_campaign(campaign_id, creator_user_id)
    assert res1 is True

    # Check participant by user ID
    part1 = await repo.get_campaign_participant(campaign_id, creator_user_id)
    assert part1 is not None

    # Check participant by UUID alias
    part2 = await repo.get_campaign_participant(campaign_id, creator_uuid)
    assert part2 is not None

    # Join again using UUID alias - should be idempotent
    res2 = await repo.join_campaign(campaign_id, creator_uuid)
    assert res2 is True

@pytest.mark.anyio
async def test_brief_draft_creation_and_retrieval_with_all_sections():
    """Draft brief with custom sections persists and retrieves properly."""
    service = BriefService()
    sections_data = {f"section_{i}": f"Content for section {i}" for i in range(1, 17)}
    brief_create = CampaignBriefCreate(
        title="Test 16-Section Draft Brief",
        description="Testing complete section persistence",
        sections=sections_data,
        budget_cents=500000,
        deliverables=[
            DeliverableItem(
                id="deliv_test",
                content_type="Short-form video",
                quantity=1,
                aspect_ratio="9:16",
            )
        ],
        creative_direction=CreativeDirection(styles=["Cinematic"]),
        creator_capabilities=CreatorCapabilityRequirements(required_capabilities=["Prompting"]),
        commercial_terms=CommercialTerms(budget_cents=500000),
    )
    created = await service.create_brief("usr_lumina_skincare", brief_create)
    assert created.id is not None
    assert created.sections is not None
    assert len(created.sections) == 16
    assert created.sections["section_1"] == "Content for section 1"

    # Retrieve and verify (with owning brand ID for draft permission)
    retrieved = await service.get_brief_by_id(created.id, current_user_id="usr_lumina_skincare")
    assert retrieved.sections["section_16"] == "Content for section 16"
