"""Tests for AI configuration validator, provider adapters, and generation workflows."""

import pytest
import anyio
from app.core.ai_config import AIConfigValidator
from app.services.generation_service import GenerationService
from app.schemas.generation import GenerationJobCreate
from app.schemas.portfolio import AssetType
from app.core.errors import ValidationException


def test_ai_status_masks_secrets():
    """Verifies that the status endpoint never discloses private API keys or tokens."""
    status = AIConfigValidator.get_status()
    assert "text" in status
    assert "image" in status
    assert "video" in status
    assert "voice" in status
    assert "embedding" in status
    assert "guardrails" in status

    # Verify no raw secrets leaked
    for key, val in status.items():
        if isinstance(val, dict):
            assert "api_key" not in val
            assert "secret" not in val
            assert "token" not in val


def test_generation_input_length_ceiling():
    """Verifies that prompt character limit ceiling is strictly enforced."""
    async def run():
        service = GenerationService()
        huge_prompt = "A" * 15000  # Exceeds 12000 limit

        with pytest.raises(ValidationException) as excinfo:
            await service.submit_job(
                user_id="test-user",
                data=GenerationJobCreate(modality=AssetType.IMAGE, prompt=huge_prompt),
            )
        assert "exceeds maximum allowed" in str(excinfo.value)

    anyio.run(run)


def test_generation_service_multi_modal_execution():
    """Verifies generation execution across multi-modal adapters."""
    async def run():
        service = GenerationService()

        # Test Image generation
        img_job = await service.submit_job(
            user_id="test-user",
            data=GenerationJobCreate(
                modality=AssetType.IMAGE,
                prompt="Cyberpunk neon Tokyo rain",
                parameters={"aspect_ratio": "16:9"},
            ),
        )
        assert img_job.status.value == "COMPLETED"
        assert img_job.result_asset_path is not None

        # Test Video generation
        video_job = await service.submit_job(
            user_id="test-user",
            data=GenerationJobCreate(
                modality=AssetType.VIDEO,
                prompt="Hyperlapse camera zoom into futuristic skyscraper",
                parameters={"duration": 5, "aspect_ratio": "16:9"},
            ),
        )
        assert video_job.status.value == "COMPLETED"
        assert video_job.result_asset_path is not None

        # Test Voice generation
        voice_job = await service.submit_job(
            user_id="test-user",
            data=GenerationJobCreate(
                modality=AssetType.AUDIO,
                prompt="Welcome to HacXLerate AI Creator Marketplace.",
                parameters={"voice_id": "rachel"},
            ),
        )
        assert voice_job.status.value == "COMPLETED"
        assert voice_job.result_asset_path is not None

        # Test save to portfolio
        save_res = await service.save_asset_to_portfolio(
            user_id="test-user",
            job_id=img_job.id,
            title="Tokyo Rain Showcase",
        )
        assert save_res["success"] is True
        assert "portfolio_item_id" in save_res

    anyio.run(run)
