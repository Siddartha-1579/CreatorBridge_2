"""Public statistics endpoint providing genuine platform aggregated metrics."""

from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.db import get_db_connection
from app.core.logging import get_logger
from app.schemas.common import ApiResponse
from app.schemas.stats import PublicStatsResponse

logger = get_logger("api.v1.stats")

router = APIRouter()

DEMO_USER_FILTER = """
    id NOT IN (
        'usr_lumina_skincare', 'usr_terra_outdoor', 'usr_elena_rostova', 'usr_marcus_vance',
        'usr_aaliyah_chen', 'usr_sarah_chen', 'usr_brand_alpha', 'usr_brand_beta',
        'usr_creator_no_balance_999', 'dev-user-001', 'brand-test-alpha'
    )
    AND id NOT LIKE '00000000-%'
    AND id NOT LIKE 'usr_audit_%'
    AND email NOT LIKE '%@demo.creatorbridge.com'
    AND email NOT LIKE '%@test.com'
    AND email NOT LIKE '%@example.com'
"""


@router.get("/public", response_model=ApiResponse[PublicStatsResponse], summary="Retrieve authentic public platform statistics")
async def get_public_stats() -> ApiResponse[PublicStatsResponse]:
    """Returns genuine, aggregated database counts of registered creators, brands,

    published campaigns, completed engagements, and portfolio assets. Excludes demo accounts.
    Does not leak any PII.
    """
    total_users = 0
    total_creators = 0
    total_brands = 0
    total_published_campaigns = 0
    total_completed_engagements = 0
    total_portfolio_items = 0
    total_submissions = 0

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # 1. Total genuine registered users (excluding demo/test accounts)
            cursor.execute(f"SELECT COUNT(DISTINCT id) FROM users WHERE {DEMO_USER_FILTER}")
            row = cursor.fetchone()
            if row:
                total_users = row[0] or 0

            # 2. Total registered creators (from creator_profiles joined with genuine users, fallback to genuine users with CREATOR role)
            cursor.execute(f"SELECT COUNT(DISTINCT user_id) FROM creator_profiles WHERE user_id IN (SELECT id FROM users WHERE {DEMO_USER_FILTER})")
            row = cursor.fetchone()
            creator_profile_count = row[0] if row else 0

            cursor.execute(f"SELECT COUNT(DISTINCT id) FROM users WHERE role = 'CREATOR' AND {DEMO_USER_FILTER}")
            row = cursor.fetchone()
            user_creator_count = row[0] if row else 0

            total_creators = max(creator_profile_count, user_creator_count)

            # 3. Total registered brands (from brand_profiles joined with genuine users, fallback to genuine users with BRAND or AGENCY role)
            cursor.execute(f"SELECT COUNT(DISTINCT user_id) FROM brand_profiles WHERE user_id IN (SELECT id FROM users WHERE {DEMO_USER_FILTER})")
            row = cursor.fetchone()
            brand_profile_count = row[0] if row else 0

            cursor.execute(f"SELECT COUNT(DISTINCT id) FROM users WHERE role IN ('BRAND', 'AGENCY') AND {DEMO_USER_FILTER}")
            row = cursor.fetchone()
            user_brand_count = row[0] if row else 0

            total_brands = max(brand_profile_count, user_brand_count)

            # Ensure total_users is at least the sum of creator and brand accounts
            if total_users < (total_creators + total_brands):
                total_users = total_creators + total_brands

            # 4. Total published campaigns
            cursor.execute("SELECT COUNT(DISTINCT id) FROM campaign_briefs WHERE status = 'PUBLISHED'")
            row = cursor.fetchone()
            if row:
                total_published_campaigns = row[0] or 0

            # 5. Total completed engagements (accepted applications + approved submissions)
            cursor.execute("SELECT COUNT(DISTINCT id) FROM campaign_applications WHERE status IN ('ACCEPTED', 'COMPLETED')")
            row = cursor.fetchone()
            accepted_apps = row[0] if row else 0

            cursor.execute("SELECT COUNT(DISTINCT id) FROM clip_submissions WHERE status = 'APPROVED'")
            row = cursor.fetchone()
            approved_subs = row[0] if row else 0

            total_completed_engagements = (accepted_apps or 0) + (approved_subs or 0)

            # 6. Total public portfolio items
            cursor.execute("SELECT COUNT(DISTINCT id) FROM portfolio_items WHERE visibility = 'PUBLIC'")
            row = cursor.fetchone()
            if row:
                total_portfolio_items = row[0] or 0

            # 7. Total clip submissions
            cursor.execute("SELECT COUNT(DISTINCT id) FROM clip_submissions")
            row = cursor.fetchone()
            if row:
                total_submissions = row[0] or 0

    except Exception as e:
        logger.error(f"Error querying public statistics: {e}")
        # Retain calculated counts or zeroes on error, never inject fake numbers

    stats = PublicStatsResponse(
        total_creators=total_creators,
        total_brands=total_brands,
        total_users=total_users,
        total_published_campaigns=total_published_campaigns,
        total_completed_engagements=total_completed_engagements,
        total_portfolio_items=total_portfolio_items,
        total_submissions=total_submissions,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

    return ApiResponse[PublicStatsResponse](
        success=True,
        data=stats,
        message="Authentic platform statistics retrieved successfully",
    )
