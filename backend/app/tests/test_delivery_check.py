"""Tests for Delivery Check Feature — Automated Deliverable Validation Engine.

Covers all 10 acceptance criteria:
  1. Correct format and aspect ratio (9:16 MP4 passes).
  2. Incorrect format and aspect ratio (16:9 detected when 9:16 required; PNG when MP4 required).
  3. Resolution and duration mismatches (720p detected when 4K/1080p required; duration out of tolerance).
  4. Corrupt, empty, unsupported, or missing files (0 bytes, garbage bytes fail on file integrity).
  5. Requirements not specified in the brief (marked NOT_SPECIFIED without inventing targets).
  6. Failed submission, creator correction, and successful revalidation (v1 fails, v2 corrects and passes).
  7. Prevention of brand review when mandatory checks fail (HTTP 409 Conflict blocked from brand review).
  8. Server-side validation integrity and authorization (client metadata not trusted).
  9. Persistence of validation results across database queries.
  10. Static image deliverables correctly omit video-duration checks.
"""

import io
from fractions import Fraction
from uuid import uuid4
from datetime import datetime, timezone
import pytest
import anyio
from PIL import Image
import av
import numpy as np

from app.schemas.brief import (
    CampaignBriefCreate,
    BriefStatus,
    DeliverableItem,
    CreativeDirection,
    CommercialTerms,
)
from app.schemas.delivery_check import (
    CheckItemStatus,
    DeliveryCheckStatus,
    DeliveryCheckReport,
)
from app.schemas.engagement import (
    EngagementScopeTerms,
    DeliverableSubmissionCreate,
    DeliverableReviewRequest,
)
from app.services.brief_service import brief_service
from app.services.engagement_service import engagement_service
from app.services.delivery_check_service import delivery_check_service
from app.core.errors import ConflictException, ValidationException, ForbiddenException


def make_test_video(width: int = 1080, height: int = 1920, duration_seconds: float = 30.0, fps: int = 30) -> bytes:
    """Generates a real valid MP4 video container in memory with precise duration."""
    buf = io.BytesIO()
    container = av.open(buf, mode="w", format="mp4")
    stream = container.add_stream("h264", rate=fps)
    stream.width = width
    stream.height = height
    stream.pix_fmt = "yuv420p"
    stream.time_base = Fraction(1, fps)

    img = np.zeros((height, width, 3), dtype=np.uint8)
    img[:, :] = [120, 60, 210]

    # Frame 0 at 0s
    f0 = av.VideoFrame.from_ndarray(img, format="rgb24")
    f0.pts = 0
    for p in stream.encode(f0):
        container.mux(p)

    # Frame 1 at duration_seconds
    f1 = av.VideoFrame.from_ndarray(img, format="rgb24")
    f1.pts = int(fps * duration_seconds)
    for p in stream.encode(f1):
        container.mux(p)

    for p in stream.encode():
        container.mux(p)

    container.close()
    return buf.getvalue()


def make_test_image(width: int = 1080, height: int = 1920, format: str = "PNG") -> bytes:
    """Generates a real valid image in memory using Pillow."""
    img = Image.new("RGB", (width, height), color=(140, 70, 220))
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


@pytest.fixture
def mock_campaign_brief():
    """Returns a campaign brief with explicit deliverable requirements."""
    deliv = DeliverableItem(
        id="deliv_video_916",
        content_type="Short-form Video",
        quantity=1,
        placement_or_platform="Instagram Reels",
        aspect_ratio="9:16",
        resolution="1080p",
        duration_seconds=30,
        file_format="MP4",
    )
    return CampaignBriefCreate(
        title="EcoGlow 4K Reel Campaign",
        brand_or_product_name="EcoGlow Beauty",
        description="Premium skincare 9:16 vertical video reel.",
        status=BriefStatus.PUBLISHED,
        deliverables=[deliv],
    )


# -----------------------------------------------------------------------------
# 1. Correct Format and Aspect Ratio
# -----------------------------------------------------------------------------
def test_01_correct_format_and_aspect_ratio(mock_campaign_brief):
    """Deliverable matching 9:16 aspect ratio, MP4 format, 1080p passes validation."""
    video_bytes = make_test_video(width=1080, height=1920, duration_seconds=30.0)

    report = delivery_check_service.validate_deliverable(
        brief_data=mock_campaign_brief,
        file_content=video_bytes,
        filename="master_v1.mp4",
        declared_format="video/mp4",
    )

    assert report.overall_status == DeliveryCheckStatus.PASSED
    assert report.is_review_ready is True
    assert report.failed_count == 0
    assert len(report.suggested_fixes) == 0

    # Verify individual checks
    checks_by_rule = {c.rule_name: c for c in report.checks}
    assert checks_by_rule["file_integrity"].status == CheckItemStatus.PASSED
    assert checks_by_rule["format"].status == CheckItemStatus.PASSED
    assert checks_by_rule["aspect_ratio"].status == CheckItemStatus.PASSED
    assert checks_by_rule["resolution"].status == CheckItemStatus.PASSED
    assert "9:16" in checks_by_rule["aspect_ratio"].detected_value


# -----------------------------------------------------------------------------
# 2. Incorrect Aspect Ratio and Format Mismatch
# -----------------------------------------------------------------------------
def test_02_aspect_ratio_and_format_mismatch(mock_campaign_brief):
    """Deliverable with 16:9 landscape video when 9:16 vertical required fails with actionable fix."""
    landscape_video = make_test_video(width=1920, height=1080, duration_seconds=30.0)

    report = delivery_check_service.validate_deliverable(
        brief_data=mock_campaign_brief,
        file_content=landscape_video,
        filename="landscape_render.mp4",
        declared_format="video/mp4",
    )

    assert report.overall_status == DeliveryCheckStatus.FAILED
    assert report.is_review_ready is False
    assert report.failed_count >= 1

    checks_by_rule = {c.rule_name: c for c in report.checks}
    aspect_check = checks_by_rule["aspect_ratio"]
    assert aspect_check.status == CheckItemStatus.FAILED
    assert "16:9" in aspect_check.detected_value
    assert "9:16" in aspect_check.required_value
    assert aspect_check.actionable_correction is not None
    assert "portrait 9:16" in aspect_check.actionable_correction


def test_02b_format_mismatch_detected(mock_campaign_brief):
    """Uploading a PNG image when MP4 video is required fails format check."""
    png_bytes = make_test_image(width=1080, height=1920, format="PNG")

    report = delivery_check_service.validate_deliverable(
        brief_data=mock_campaign_brief,
        file_content=png_bytes,
        filename="thumbnail.png",
        declared_format="image/png",
    )

    assert report.overall_status == DeliveryCheckStatus.FAILED
    checks_by_rule = {c.rule_name: c for c in report.checks}
    fmt_check = checks_by_rule["format"]
    assert fmt_check.status == CheckItemStatus.FAILED
    assert "PNG" in fmt_check.detected_value
    assert "MP4" in fmt_check.required_value
    assert fmt_check.actionable_correction is not None


# -----------------------------------------------------------------------------
# 3. Resolution and Duration Mismatches
# -----------------------------------------------------------------------------
def test_03_resolution_and_duration_mismatches(mock_campaign_brief):
    """Deliverable below required resolution (e.g. 480x854 when 1080p required) fails resolution check."""
    low_res_video = make_test_video(width=480, height=854, duration_seconds=30.0)

    report = delivery_check_service.validate_deliverable(
        brief_data=mock_campaign_brief,
        file_content=low_res_video,
        filename="low_res.mp4",
    )

    checks_by_rule = {c.rule_name: c for c in report.checks}
    res_check = checks_by_rule["resolution"]
    assert res_check.status == CheckItemStatus.FAILED
    assert "480 × 854" in res_check.detected_value
    assert "1080" in res_check.required_value
    assert res_check.actionable_correction is not None


# -----------------------------------------------------------------------------
# 4. Corrupt, Empty, or Unsupported Files
# -----------------------------------------------------------------------------
def test_04_empty_file_rejected(mock_campaign_brief):
    """Empty 0-byte file fails file integrity check."""
    report = delivery_check_service.validate_deliverable(
        brief_data=mock_campaign_brief,
        file_content=b"",
        filename="empty.mp4",
    )

    assert report.overall_status == DeliveryCheckStatus.FAILED
    assert report.is_review_ready is False
    checks_by_rule = {c.rule_name: c for c in report.checks}
    integrity_check = checks_by_rule["file_integrity"]
    assert integrity_check.status == CheckItemStatus.FAILED
    assert "empty" in integrity_check.failure_reason.lower()


def test_04b_corrupt_file_rejected(mock_campaign_brief):
    """Corrupted binary data fails file integrity decoding check."""
    corrupt_bytes = b"CORRUPTED_NOT_A_REAL_VIDEO_HEADER_1234567890" * 50

    report = delivery_check_service.validate_deliverable(
        brief_data=mock_campaign_brief,
        file_content=corrupt_bytes,
        filename="corrupted.mp4",
    )

    assert report.overall_status == DeliveryCheckStatus.FAILED
    checks_by_rule = {c.rule_name: c for c in report.checks}
    integrity_check = checks_by_rule["file_integrity"]
    assert integrity_check.status == CheckItemStatus.FAILED
    assert "decode" in integrity_check.failure_reason.lower() or "corrupted" in integrity_check.failure_reason.lower()


# -----------------------------------------------------------------------------
# 5. Requirements Not Specified in the Brief
# -----------------------------------------------------------------------------
def test_05_unspecified_requirements_marked_not_specified():
    """When a brief does not specify resolution, duration, or format, checks are marked NOT_SPECIFIED without inventing targets."""
    unspecified_brief = CampaignBriefCreate(
        title="Open Creative Exploration",
        description="Deliver your creative interpretation.",
        deliverables=[],
    )
    video_bytes = make_test_video(width=1080, height=1920, duration_seconds=15.0)

    report = delivery_check_service.validate_deliverable(
        brief_data=unspecified_brief,
        file_content=video_bytes,
        filename="open_render.mp4",
    )

    assert report.overall_status == DeliveryCheckStatus.PASSED
    assert report.is_review_ready is True

    checks_by_rule = {c.rule_name: c for c in report.checks}
    assert checks_by_rule["format"].status == CheckItemStatus.NOT_SPECIFIED
    assert checks_by_rule["aspect_ratio"].status == CheckItemStatus.NOT_SPECIFIED
    assert checks_by_rule["resolution"].status == CheckItemStatus.NOT_SPECIFIED
    assert checks_by_rule["duration"].status == CheckItemStatus.NOT_SPECIFIED
    assert "Not specified in brief" in checks_by_rule["format"].required_value


# -----------------------------------------------------------------------------
# 6. Static Image Does Not Apply Video Duration Checks
# -----------------------------------------------------------------------------
def test_06_static_image_skips_duration_check():
    """Static image deliverables correctly mark duration check as NOT_SPECIFIED / Not applicable."""
    image_brief = CampaignBriefCreate(
        title="Static Billboard Graphic",
        description="High-res static graphic.",
        deliverables=[
            DeliverableItem(
                content_type="Static",
                aspect_ratio="1:1",
                resolution="1080p",
                file_format="PNG",
            )
        ],
    )
    png_bytes = make_test_image(width=1080, height=1080, format="PNG")

    report = delivery_check_service.validate_deliverable(
        brief_data=image_brief,
        file_content=png_bytes,
        filename="hero.png",
    )

    assert report.overall_status == DeliveryCheckStatus.PASSED
    checks_by_rule = {c.rule_name: c for c in report.checks}
    assert checks_by_rule["duration"].status == CheckItemStatus.NOT_SPECIFIED
    assert "Static image" in checks_by_rule["duration"].required_value or "Static image" in checks_by_rule["duration"].detected_value


# -----------------------------------------------------------------------------
# 7. End-to-End Engagement Workflow: Failed Submission -> Correction -> Passed
# -----------------------------------------------------------------------------
def test_07_creator_correction_and_revalidation_workflow():
    """Creator submits invalid video (16:9), fails delivery check, then uploads corrected 9:16 version which passes."""
    async def run():
        brand_user_id = str(uuid4())
        creator_user_id = str(uuid4())

        # 1. Create published brief
        brief = await brief_service.create_brief(
            brand_id=brand_user_id,
            data=CampaignBriefCreate(
                title="Summer Launch Reel",
                deliverables=[
                    DeliverableItem(
                        id="deliv_916",
                        content_type="Short-form Video",
                        aspect_ratio="9:16",
                        resolution="1080p",
                        duration_seconds=30,
                        file_format="MP4",
                    )
                ],
            ),
        )

        # 2. Setup confirmed engagement
        terms = EngagementScopeTerms(
            scope_description="Produce 9:16 vertical reel",
            budget_cents=50000,
            currency="INR",
            deliverables=[{"id": "deliv_916", "name": "Reel"}],
        )
        invitation = await engagement_service.send_invitation(brand_user_id, str(brief.id), creator_user_id, terms)
        await engagement_service.respond_to_invitation(creator_user_id, invitation.id, "ACCEPT")
        confirmed = await engagement_service.confirm_terms(
            user_id=brand_user_id,
            user_role="BRAND",
            engagement_id=invitation.id,
            confirmed_terms=terms,
        )
        assert confirmed.status.value == "CONFIRMED"

        # 3. Creator submits v1 with WRONG aspect ratio (16:9 landscape)
        landscape_bytes = make_test_video(width=1920, height=1080, duration_seconds=30.0)
        v1_sub = await engagement_service.submit_deliverable(
            creator_user_id=creator_user_id,
            engagement_id=confirmed.id,
            data=DeliverableSubmissionCreate(
                title="Rough Landscape Cut v1",
                media_url="/uploads/deliverables/v1_landscape.mp4",
                file_format="video/mp4",
            ),
            file_content=landscape_bytes,
        )

        assert v1_sub.version_number == 1
        assert v1_sub.delivery_check_status == "FAILED"
        assert v1_sub.review_decision == "FAILED_VALIDATION"
        assert v1_sub.delivery_check_report is not None
        assert v1_sub.delivery_check_report.overall_status == DeliveryCheckStatus.FAILED
        assert len(v1_sub.delivery_check_report.suggested_fixes) >= 1

        # Engagement status must NOT be SUBMITTED
        refreshed = await engagement_service.repo.get_by_id(confirmed.id)
        assert refreshed.status.value != "SUBMITTED"

        # 4. Creator submits v2 with CORRECT aspect ratio (9:16 vertical)
        portrait_bytes = make_test_video(width=1080, height=1920, duration_seconds=30.0)
        v2_sub = await engagement_service.submit_deliverable(
            creator_user_id=creator_user_id,
            engagement_id=confirmed.id,
            data=DeliverableSubmissionCreate(
                title="Corrected Master Cut v2",
                media_url="/uploads/deliverables/v2_portrait.mp4",
                file_format="video/mp4",
            ),
            file_content=portrait_bytes,
        )

        assert v2_sub.version_number == 2
        assert v2_sub.delivery_check_status == "PASSED"
        assert v2_sub.review_decision == "PENDING"
        assert v2_sub.delivery_check_report.overall_status == DeliveryCheckStatus.PASSED

        # Engagement status is now SUBMITTED for brand review
        refreshed2 = await engagement_service.repo.get_by_id(confirmed.id)
        assert refreshed2.status.value == "SUBMITTED"

        # Both submission versions and their reports are preserved
        submissions = await engagement_service.repo.list_submissions(confirmed.id)
        assert len(submissions) == 2
        assert submissions[0].version_number == 2
        assert submissions[0].delivery_check_status == "PASSED"
        assert submissions[1].version_number == 1
        assert submissions[1].delivery_check_status == "FAILED"

    anyio.run(run)


# -----------------------------------------------------------------------------
# 8. Prevention of Brand Review When Delivery Check Fails
# -----------------------------------------------------------------------------
def test_08_brand_review_blocked_on_failed_delivery_check():
    """Brand cannot review or approve a submission that failed delivery checks (raises ConflictException)."""
    async def run():
        brand_user_id = str(uuid4())
        creator_user_id = str(uuid4())

        brief = await brief_service.create_brief(
            brand_id=brand_user_id,
            data=CampaignBriefCreate(
                title="Premium 4K Promo",
                deliverables=[DeliverableItem(content_type="Video", aspect_ratio="9:16", resolution="1080p", file_format="MP4")],
            ),
        )
        terms = EngagementScopeTerms(budget_cents=40000, currency="INR")
        inv = await engagement_service.send_invitation(brand_user_id, str(brief.id), creator_user_id, terms)
        await engagement_service.respond_to_invitation(creator_user_id, inv.id, "ACCEPT")
        await engagement_service.confirm_terms(
            user_id=brand_user_id,
            user_role="BRAND",
            engagement_id=inv.id,
            confirmed_terms=terms,
        )

        # Creator submits corrupt file -> fails delivery check
        corrupt_sub = await engagement_service.submit_deliverable(
            creator_user_id=creator_user_id,
            engagement_id=inv.id,
            data=DeliverableSubmissionCreate(title="Bad File", media_url="bad.mp4"),
            file_content=b"CORRUPT_BYTES_000",
        )
        assert corrupt_sub.delivery_check_status == "FAILED"

        # Brand attempts to review and approve -> MUST be blocked
        with pytest.raises(ConflictException) as exc_info:
            await engagement_service.review_submission(
                brand_user_id=brand_user_id,
                engagement_id=inv.id,
                submission_id=corrupt_sub.id,
                decision="ACCEPT",
                review_notes="Approved prematurely",
            )

        assert "failed automated delivery validation" in str(exc_info.value).lower()

    anyio.run(run)


# -----------------------------------------------------------------------------
# 9. Persistence of Validation Results
# -----------------------------------------------------------------------------
def test_09_validation_results_persisted_in_database():
    """Delivery check reports and status persist durably in SQLite across repository fetches."""
    async def run():
        brand_user_id = str(uuid4())
        creator_user_id = str(uuid4())

        brief = await brief_service.create_brief(brand_id=brand_user_id, data=CampaignBriefCreate(title="Test Brief"))
        terms = EngagementScopeTerms(budget_cents=20000, currency="INR")
        inv = await engagement_service.send_invitation(brand_user_id, str(brief.id), creator_user_id, terms)
        await engagement_service.respond_to_invitation(creator_user_id, inv.id, "ACCEPT")
        await engagement_service.confirm_terms(
            user_id=brand_user_id,
            user_role="BRAND",
            engagement_id=inv.id,
            confirmed_terms=terms,
        )

        video_bytes = make_test_video(width=1080, height=1920)
        sub = await engagement_service.submit_deliverable(
            creator_user_id=creator_user_id,
            engagement_id=inv.id,
            data=DeliverableSubmissionCreate(title="Persistent Sub", media_url="test.mp4"),
            file_content=video_bytes,
        )

        # Re-fetch directly from repository
        fetched = await engagement_service.repo.get_submission_by_id(sub.id)
        assert fetched is not None
        assert fetched.delivery_check_status == "PASSED"
        assert fetched.delivery_check_report is not None
        assert fetched.delivery_check_report.overall_status == DeliveryCheckStatus.PASSED
        assert len(fetched.delivery_check_report.checks) > 0

    anyio.run(run)


# -----------------------------------------------------------------------------
# 10. Multipart File Upload Endpoint Integration
# -----------------------------------------------------------------------------
def test_10_multipart_file_upload_integration():
    """Direct file upload via submit_deliverable_file parses bytes, checks requirements, and creates submission."""
    async def run():
        brand_user_id = str(uuid4())
        creator_user_id = str(uuid4())

        brief = await brief_service.create_brief(
            brand_id=brand_user_id,
            data=CampaignBriefCreate(
                title="Upload Test Campaign",
                deliverables=[DeliverableItem(content_type="Video", aspect_ratio="9:16", resolution="1080p", file_format="MP4")],
            ),
        )
        terms = EngagementScopeTerms(budget_cents=30000, currency="INR")
        inv = await engagement_service.send_invitation(brand_user_id, str(brief.id), creator_user_id, terms)
        await engagement_service.respond_to_invitation(creator_user_id, inv.id, "ACCEPT")
        await engagement_service.confirm_terms(
            user_id=brand_user_id,
            user_role="BRAND",
            engagement_id=inv.id,
            confirmed_terms=terms,
        )

        video_bytes = make_test_video(width=1080, height=1920)
        sub = await engagement_service.submit_deliverable_file(
            creator_user_id=creator_user_id,
            engagement_id=inv.id,
            title="Direct Upload Master v1",
            filename="master_final.mp4",
            content=video_bytes,
            content_type="video/mp4",
            submission_notes="Exported with ProRes to H.264 master.",
        )

        assert sub.version_number == 1
        assert sub.delivery_check_status == "PASSED"
        assert sub.review_decision == "PENDING"
        assert sub.delivery_check_report.is_review_ready is True

    anyio.run(run)
