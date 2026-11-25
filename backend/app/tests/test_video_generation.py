"""
Comprehensive automated tests for AI Video Generation:
1. Zero-cost DEMO MODE (default hackathon mode at ₹0 cost):
   - Default mode is always available without credentials.
   - Generates verified local MP4 demo asset (/demo-assets/marcus-project-kinetic-trail.mp4 or temporal-flux.mp4).
   - Generates DEMO_SAMPLE job status with honest disclosure notice.
   - Allows saving DEMO_SAMPLE jobs to creator portfolio with explicit demo metadata ("Showcase Reel (Demo)").
   - Never calls external APIs, never incurs costs.
2. LIVE MODE (requires credentials):
   - Missing RUNWAY_API_KEY -> is_available() is False, raises ProviderNotConfiguredException.
   - submit_job in live mode without credentials -> status PROVIDER_NOT_CONFIGURED.
   - Cannot save PROVIDER_NOT_CONFIGURED or FAILED jobs to portfolio.
   - Successful Runway task lifecycle (POST -> poll -> download -> upload to persistent storage).
   - Provider failure (HTTP 401, 429, task status FAILED) handled gracefully.
   - Polling timeout handled gracefully.
   - Persistent storage upload failure handled gracefully.
3. Legacy safety:
   - Rejecting legacy ForBiggerBlazes URLs from portfolio saving.
   - Database migration safely repairing legacy ForBiggerBlazes items to verified local demo assets.
"""

import json
import uuid
import pytest
import anyio
import httpx
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

from app.core.config import settings
from app.core.errors import (
    ProviderNotConfiguredException,
    IntegrationException,
    ValidationException,
)
from app.core.db import get_db_connection, init_db
from app.integrations.ai.base import VideoGenerationRequest
from app.integrations.ai.providers.video import RunwayVideoProvider
from app.integrations.storage.base import StorageProvider
from app.schemas.generation import GenerationJobCreate, GenerationJobResponse, GenerationJobStatus
from app.schemas.portfolio import AssetType
from app.services.generation_service import GenerationService


class MockStorageProvider(StorageProvider):
    """Test stub for persistent object storage."""

    def __init__(self, configured: bool = True):
        self._configured = configured
        self.uploaded_files = {}

    def is_configured(self) -> bool:
        return self._configured

    async def upload_file(
        self, bucket: str, path: str, content: bytes, content_type: str = "application/octet-stream"
    ) -> str:
        if not self._configured:
            raise IntegrationException("storage", "Storage not configured")
        ref = f"{bucket}/{path}"
        self.uploaded_files[ref] = {"content": content, "content_type": content_type}
        return ref

    async def get_public_url(self, bucket: str, path: str) -> str:
        return f"https://mock-supabase.supabase.co/storage/v1/object/public/{bucket}/{path}"

    async def create_signed_url(self, bucket: str, path: str, expires_in_seconds: int = 3600) -> str:
        return f"https://mock-supabase.supabase.co/storage/v1/object/sign/{bucket}/{path}?expires={expires_in_seconds}"

    async def delete_file(self, bucket: str, path: str) -> bool:
        ref = f"{bucket}/{path}"
        self.uploaded_files.pop(ref, None)
        return True


# =========================================================================
# 1. Zero-Cost Demo Mode Tests (Default Mode)
# =========================================================================

def test_demo_mode_is_default_and_available():
    """Verifies that default settings use demo mode and require zero credentials."""
    async def run():
        provider = RunwayVideoProvider(api_key="", mode="demo")
        assert await provider.is_available() is True
        assert provider.mode == "demo"

    anyio.run(run)


def test_demo_mode_generates_verified_local_asset():
    """Verifies that demo mode returns a verified local MP4 asset with honest notice."""
    async def run():
        provider = RunwayVideoProvider(api_key="", mode="demo")

        # Cyber/tech prompt selects temporal-flux
        result_cyber = await provider.generate_video(
            VideoGenerationRequest(prompt="Futuristic holographic cyberpunk city", duration_seconds=5)
        )
        assert result_cyber.provider == "demo"
        assert result_cyber.video_url == "/demo-assets/marcus-project-temporal-flux.mp4"
        assert result_cyber.parameters_used.get("is_demo") is True
        assert "zero-cost" in result_cyber.parameters_used.get("notice", "").lower()
        assert "ForBiggerBlazes" not in result_cyber.video_url

        # Kinetic/nature prompt selects kinetic-trail
        result_action = await provider.generate_video(
            VideoGenerationRequest(prompt="High-speed trail running through alpine forest", duration_seconds=5)
        )
        assert result_action.video_url == "/demo-assets/marcus-project-kinetic-trail.mp4"
        assert result_action.parameters_used.get("is_demo") is True

    anyio.run(run)


def test_submit_job_in_demo_mode_yields_demo_sample_status():
    """Verifies that submitting a video job in demo mode produces a DEMO_SAMPLE status."""
    async def run():
        service = GenerationService()
        job = await service.submit_job(
            user_id="test-creator-001",
            data=GenerationJobCreate(
                modality=AssetType.VIDEO,
                prompt="Futuristic Tokyo hyperlapse orbit",
                parameters={"duration": 5, "aspect_ratio": "16:9"},
            ),
        )

        assert job.status == GenerationJobStatus.DEMO_SAMPLE
        assert job.result_asset_path is not None
        assert job.result_asset_path.startswith("/demo-assets/marcus-project-")
        assert "ForBiggerBlazes" not in job.result_asset_path

    anyio.run(run)


def test_save_demo_sample_job_to_portfolio_succeeds_with_demo_metadata():
    """Verifies that saving a DEMO_SAMPLE job to portfolio succeeds and records explicit demo tags."""
    async def run():
        service = GenerationService()
        job = await service.submit_job(
            user_id="test-creator-demo",
            data=GenerationJobCreate(
                modality=AssetType.VIDEO,
                prompt="Tech showcase reel demo",
                parameters={"duration": 5},
            ),
        )
        assert job.status == GenerationJobStatus.DEMO_SAMPLE

        save_res = await service.save_asset_to_portfolio(
            user_id="test-creator-demo",
            job_id=job.id,
            title="Curated Demo Showcase",
        )

        assert save_res is not None
        assert save_res["success"] is True
        assert save_res["is_demo"] is True

        # Verify stored portfolio item details
        stored_item = await service.portfolio_repo.get_by_id(uuid.UUID(save_res["portfolio_item_id"]))
        assert stored_item is not None
        assert stored_item.media_type.value == "VIDEO"
        assert stored_item.media_url == job.result_asset_path
        # Verify honest demo disclosure in portfolio metadata
        assert "Showcase Reel (Demo)" in stored_item.tools
        assert "Curated Demo Reel" in stored_item.models
        assert "curated showcase reel" in stored_item.description.lower()
        assert "zero-cost hackathon demonstration" in stored_item.description.lower()

    anyio.run(run)


# =========================================================================
# 2. Live Mode Tests (Requires Runway Credentials)
# =========================================================================

def test_live_mode_missing_credentials_raises_unconfigured():
    """Verifies that RunwayVideoProvider in live mode with missing credentials raises ProviderNotConfiguredException."""
    async def run():
        provider = RunwayVideoProvider(api_key="", mode="live")
        assert await provider.is_available() is False

        with pytest.raises(ProviderNotConfiguredException) as exc_info:
            await provider.generate_video(
                VideoGenerationRequest(prompt="Cinematic drone pan over misty canyon", duration_seconds=5)
            )
        assert "RUNWAY_API_KEY" in str(exc_info.value)
        assert "ForBiggerBlazes" not in str(exc_info.value)

    anyio.run(run)


def test_live_mode_submit_job_unconfigured_transitions_cleanly():
    """Verifies that submitting a live video job without credentials yields PROVIDER_NOT_CONFIGURED status."""
    async def run():
        service = GenerationService()
        video_provider = service.gateway._video_providers.get("runway")
        assert video_provider is not None
        # Explicitly configure live mode without key
        with patch.object(video_provider, "mode", "live"), \
             patch.object(video_provider, "api_key", ""):
            job = await service.submit_job(
                user_id="test-creator-live-unconf",
                data=GenerationJobCreate(
                    modality=AssetType.VIDEO,
                    prompt="Futuristic Tokyo hyperlapse orbit",
                    parameters={"duration": 5, "aspect_ratio": "16:9"},
                ),
            )

            assert job.status == GenerationJobStatus.PROVIDER_NOT_CONFIGURED
            assert job.result_asset_path is None
            assert job.error_message is not None
            assert "RUNWAY_API_KEY" in job.error_message
            assert job.result_asset_path != "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"

    anyio.run(run)


def test_cannot_save_unconfigured_or_failed_job_to_portfolio():
    """Verifies that saving an incomplete, failed, or unconfigured job to portfolio is rejected."""
    async def run():
        service = GenerationService()
        failed_job_id = uuid.uuid4()
        failed_job = GenerationJobResponse(
            id=failed_job_id,
            user_id="test-creator-failed",
            provider_name="runway",
            modality=AssetType.VIDEO,
            status=GenerationJobStatus.PROVIDER_NOT_CONFIGURED,
            result_asset_path=None,
            error_message="Missing RUNWAY_API_KEY",
        )
        await service.repo.create(failed_job)

        with pytest.raises(ValidationException) as exc_info:
            await service.save_asset_to_portfolio(
                user_id="test-creator-failed",
                job_id=failed_job_id,
                title="Should Fail To Save",
            )
        assert "Cannot save incomplete" in str(exc_info.value)

    anyio.run(run)


def test_cannot_save_job_with_for_bigger_blazes_url():
    """Verifies that any job containing the dead Google sample URL is rejected when saving to portfolio."""
    async def run():
        service = GenerationService()

        bad_job_id = uuid.uuid4()
        bad_job = GenerationJobResponse(
            id=bad_job_id,
            user_id="test-creator-001",
            provider_name="runway-simulated",
            modality=AssetType.VIDEO,
            status=GenerationJobStatus.COMPLETED,
            result_asset_path="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        )
        await service.repo.create(bad_job)

        with pytest.raises(ValidationException) as exc_info:
            await service.save_asset_to_portfolio(
                user_id="test-creator-001",
                job_id=bad_job_id,
                title="Corrupted Sample Video",
            )
        assert "placeholder video" in str(exc_info.value).lower()

    anyio.run(run)


def test_successful_runway_workflow_mocked():
    """
    Verifies full lifecycle in live mode with mocked Runway ML provider:
    1. POST /v1/text_to_video -> task ID
    2. GET /v1/tasks/{id} -> status RUNNING then SUCCEEDED
    3. GET video output URL -> binary MP4 bytes
    4. Upload to persistent storage
    5. Returns persistent storage URL
    """
    async def run():
        mock_storage = MockStorageProvider(configured=True)
        provider = RunwayVideoProvider(
            api_key="valid-test-runway-key-12345678",
            mode="live",
            storage=mock_storage,
            poll_interval_seconds=0.01,
            max_poll_seconds=5.0,
        )

        poll_counter = {"count": 0}

        def mock_transport(request: httpx.Request) -> httpx.Response:
            url_str = str(request.url)

            # 1. Job submission
            if request.method == "POST" and "/text_to_video" in url_str:
                body = json.loads(request.content)
                assert body["promptText"] == "High-speed solar hovercraft racing across salt flats"
                assert body["duration"] == 5
                assert body["ratio"] == "16:9"
                return httpx.Response(200, json={"id": "runway_task_999"})

            # 2. Polling status
            if request.method == "GET" and "/tasks/runway_task_999" in url_str:
                poll_counter["count"] += 1
                if poll_counter["count"] == 1:
                    return httpx.Response(200, json={"id": "runway_task_999", "status": "RUNNING"})
                return httpx.Response(
                    200,
                    json={
                        "id": "runway_task_999",
                        "status": "SUCCEEDED",
                        "output": ["https://cdn.runwayml.com/outputs/generated_clip_999.mp4"],
                    },
                )

            # 3. Video bytes download
            if request.method == "GET" and "generated_clip_999.mp4" in url_str:
                fake_mp4_bytes = b"\x00\x00\x00\x1cftypmp42\x00\x00\x00\x00isommp42\x00\x00\x00\x08free"
                return httpx.Response(200, content=fake_mp4_bytes, headers={"Content-Type": "video/mp4"})

            return httpx.Response(404, text="Not Found")

        with patch("httpx.AsyncClient", return_value=httpx.AsyncClient(transport=httpx.MockTransport(mock_transport))):
            result = await provider.generate_video(
                VideoGenerationRequest(
                    prompt="High-speed solar hovercraft racing across salt flats",
                    duration_seconds=5,
                    aspect_ratio="16:9",
                )
            )

        # Assertions
        assert result.provider == "runway"
        assert result.duration_seconds == 5
        assert "generated-assets/videos/runway_task_999.mp4" in result.video_url
        assert "mock-supabase.supabase.co" in result.video_url
        assert "ForBiggerBlazes" not in result.video_url

        # Check that file was saved to persistent storage
        storage_ref = f"{settings.storage_generations_bucket}/videos/runway_task_999.mp4"
        assert storage_ref in mock_storage.uploaded_files
        assert mock_storage.uploaded_files[storage_ref]["content_type"] == "video/mp4"

    anyio.run(run)


def test_runway_task_failure_mocked():
    """Verifies that when Runway returns task status FAILED in live mode, an IntegrationException is raised."""
    async def run():
        provider = RunwayVideoProvider(
            api_key="valid-test-runway-key-12345678",
            mode="live",
            poll_interval_seconds=0.01,
            max_poll_seconds=2.0,
        )

        def mock_transport(request: httpx.Request) -> httpx.Response:
            url_str = str(request.url)
            if request.method == "POST":
                return httpx.Response(200, json={"id": "runway_task_fail_1"})
            if request.method == "GET" and "/tasks/runway_task_fail_1" in url_str:
                return httpx.Response(
                    200,
                    json={
                        "id": "runway_task_fail_1",
                        "status": "FAILED",
                        "failure": "Content moderation policy triggered by prompt keyword.",
                    },
                )
            return httpx.Response(404)

        with patch("httpx.AsyncClient", return_value=httpx.AsyncClient(transport=httpx.MockTransport(mock_transport))):
            with pytest.raises(IntegrationException) as exc_info:
                await provider.generate_video(
                    VideoGenerationRequest(prompt="Unsafe prompt test", duration_seconds=5)
                )
            assert "Content moderation policy" in str(exc_info.value)
            assert "ForBiggerBlazes" not in str(exc_info.value)

    anyio.run(run)


def test_runway_timeout_mocked():
    """Verifies that when Runway task polling exceeds max_poll_seconds in live mode, a timeout exception is raised."""
    async def run():
        provider = RunwayVideoProvider(
            api_key="valid-test-runway-key-12345678",
            mode="live",
            poll_interval_seconds=0.01,
            max_poll_seconds=0.05,
        )

        def mock_transport(request: httpx.Request) -> httpx.Response:
            url_str = str(request.url)
            if request.method == "POST":
                return httpx.Response(200, json={"id": "runway_task_timeout"})
            if request.method == "GET":
                return httpx.Response(200, json={"id": "runway_task_timeout", "status": "RUNNING"})
            return httpx.Response(404)

        with patch("httpx.AsyncClient", return_value=httpx.AsyncClient(transport=httpx.MockTransport(mock_transport))):
            with pytest.raises(IntegrationException) as exc_info:
                await provider.generate_video(
                    VideoGenerationRequest(prompt="Slow video prompt", duration_seconds=5)
                )
            assert "timed out" in str(exc_info.value).lower()

    anyio.run(run)


def test_runway_auth_error_mocked():
    """Verifies that HTTP 401 Unauthorized from Runway in live mode produces an actionable auth error message."""
    async def run():
        provider = RunwayVideoProvider(
            api_key="invalid-runway-key-12345678",
            mode="live",
        )

        def mock_transport(request: httpx.Request) -> httpx.Response:
            return httpx.Response(401, text="Unauthorized: Invalid API key")

        with patch("httpx.AsyncClient", return_value=httpx.AsyncClient(transport=httpx.MockTransport(mock_transport))):
            with pytest.raises(IntegrationException) as exc_info:
                await provider.generate_video(
                    VideoGenerationRequest(prompt="Auth test prompt", duration_seconds=5)
                )
            assert "authentication failed" in str(exc_info.value).lower()

    anyio.run(run)


def test_runway_rate_limit_error_mocked():
    """Verifies that HTTP 429 Rate Limit from Runway in live mode produces an actionable rate limit error message."""
    async def run():
        provider = RunwayVideoProvider(
            api_key="valid-runway-key-12345678",
            mode="live",
        )

        def mock_transport(request: httpx.Request) -> httpx.Response:
            return httpx.Response(429, text="Rate limit exceeded")

        with patch("httpx.AsyncClient", return_value=httpx.AsyncClient(transport=httpx.MockTransport(mock_transport))):
            with pytest.raises(IntegrationException) as exc_info:
                await provider.generate_video(
                    VideoGenerationRequest(prompt="Rate limit test", duration_seconds=5)
                )
            assert "rate limit exceeded" in str(exc_info.value).lower()

    anyio.run(run)


def test_storage_upload_failure_handled():
    """Verifies that if storage upload fails after live video generation, an informative IntegrationException is raised."""
    async def run():
        failing_storage = MockStorageProvider(configured=True)
        failing_storage.upload_file = AsyncMock(side_effect=Exception("S3 bucket write permission denied"))

        provider = RunwayVideoProvider(
            api_key="valid-test-runway-key-12345678",
            mode="live",
            storage=failing_storage,
            poll_interval_seconds=0.01,
            max_poll_seconds=2.0,
        )

        def mock_transport(request: httpx.Request) -> httpx.Response:
            url_str = str(request.url)
            if request.method == "POST":
                return httpx.Response(200, json={"id": "runway_task_stor_fail"})
            if request.method == "GET" and "/tasks/" in url_str:
                return httpx.Response(
                    200,
                    json={
                        "id": "runway_task_stor_fail",
                        "status": "SUCCEEDED",
                        "output": ["https://cdn.runwayml.com/outputs/clip.mp4"],
                    },
                )
            if request.method == "GET" and "clip.mp4" in url_str:
                return httpx.Response(200, content=b"fake-video-bytes", headers={"Content-Type": "video/mp4"})
            return httpx.Response(404)

        with patch("httpx.AsyncClient", return_value=httpx.AsyncClient(transport=httpx.MockTransport(mock_transport))):
            with pytest.raises(IntegrationException) as exc_info:
                await provider.generate_video(
                    VideoGenerationRequest(prompt="Storage failure test", duration_seconds=5)
                )
            assert "persistent storage" in str(exc_info.value).lower()

    anyio.run(run)


# =========================================================================
# 3. Database Migration Repair Test
# =========================================================================

def test_database_migration_repairs_for_bigger_blazes():
    """Verifies that db initialization safely repairs legacy ForBiggerBlazes items to valid demo videos."""
    conn = get_db_connection()
    cursor = conn.cursor()

    test_item_id = str(uuid.uuid4())
    now_str = datetime.now(timezone.utc).isoformat()

    cursor.execute(
        """
        INSERT INTO portfolio_items (
            id, creator_id, title, description, category, content_type,
            media_type, thumbnail_url, media_url, public_url, workflow_stages,
            tools, models, skills, created_at, updated_at
        ) VALUES (
            ?, ?, 'Legacy Generated Video', 'Generated via CreatorBridge AI Studio (runway-simulated)',
            'AI Video', 'Commercial Reel', 'VIDEO', 'https://example.com/thumb.jpg',
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            '[]', '["runway"]', '["gen3a_turbo"]', '["AI"]', ?, ?
        )
        """,
        (test_item_id, "00000000-0000-0000-0000-000000000001", now_str, now_str),
    )
    conn.commit()

    init_db()

    cursor.execute("SELECT media_url, public_url, description FROM portfolio_items WHERE id = ?", (test_item_id,))
    row = cursor.fetchone()

    assert row is not None
    assert row["media_url"] == "/demo-assets/marcus-project-kinetic-trail.mp4"
    assert row["public_url"] == "/demo-assets/marcus-project-kinetic-trail.mp4"
    assert "ForBiggerBlazes" not in row["media_url"]
    assert "(repaired-demo)" in row["description"]

    cursor.execute("DELETE FROM portfolio_items WHERE id = ?", (test_item_id,))
    conn.commit()
    conn.close()
