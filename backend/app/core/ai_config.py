"""Centralized AI configuration validator and modality readiness monitor."""

from typing import Dict, Any
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("ai.config")


class AIConfigValidator:
    """
    Validates AI infrastructure configuration at startup.
    Discloses non-sensitive readiness status for each creative modality.
    Ensures safe fallbacks without exposing secrets to client callers.
    """

    @staticmethod
    def get_status() -> Dict[str, Any]:
        """Returns non-sensitive readiness state across all AI modalities."""
        has_openai = bool(settings.openai_api_key and len(settings.openai_api_key.strip()) > 8)
        has_anthropic = bool(settings.anthropic_api_key and len(settings.anthropic_api_key.strip()) > 8)
        
        has_image = bool(
            (settings.image_api_key and len(settings.image_api_key.strip()) > 8)
            or has_openai
            or (settings.stability_api_key and len(settings.stability_api_key.strip()) > 8)
            or (settings.fal_ai_api_key and len(settings.fal_ai_api_key.strip()) > 8)
        )

        has_video = bool(
            (settings.video_api_key and len(settings.video_api_key.strip()) > 8)
            or (settings.runway_api_key and len(settings.runway_api_key.strip()) > 8)
        )

        has_voice = bool(
            (settings.voice_api_key and len(settings.voice_api_key.strip()) > 8)
            or (settings.elevenlabs_api_key and len(settings.elevenlabs_api_key.strip()) > 8)
        )

        has_embedding = bool(
            (settings.embedding_api_key and len(settings.embedding_api_key.strip()) > 8)
            or has_openai
        )

        return {
            "text": {
                "provider": settings.ai_provider,
                "status": "READY" if (has_openai or has_anthropic) else "UNCONFIGURED",
                "model": settings.openai_model if settings.ai_provider == "openai" else settings.anthropic_model,
                "is_fallback": not (has_openai or has_anthropic),
            },
            "image": {
                "provider": settings.image_provider,
                "status": "READY" if has_image else "UNCONFIGURED",
                "model": settings.image_model,
                "is_fallback": not has_image,
            },
            "video": {
                "provider": settings.video_provider,
                "status": "READY" if has_video else "UNCONFIGURED",
                "model": settings.video_model,
                "is_fallback": not has_video,
            },
            "voice": {
                "provider": settings.voice_provider,
                "status": "READY" if has_voice else "UNCONFIGURED",
                "model": settings.voice_model,
                "is_fallback": not has_voice,
            },
            "embedding": {
                "provider": settings.embedding_provider,
                "status": "READY" if has_embedding else "UNCONFIGURED",
                "model": settings.embedding_model,
                "is_fallback": not has_embedding,
            },
            "guardrails": {
                "max_input_chars": settings.ai_max_input_chars,
                "timeout_seconds": settings.ai_request_timeout_seconds,
                "max_retries": settings.ai_max_retries,
            },
        }

    @classmethod
    def log_startup_summary(cls) -> None:
        """Logs sanitized diagnostic summary during FastAPI startup."""
        from app.core.readiness import system_readiness_monitor
        report = system_readiness_monitor.get_full_report()
        logger.info("=== CreatorBridge Centralized Integration Readiness Audit ===")
        logger.info(f"System Status: {report.system_status} | {report.summary_message}")
        for item in report.integrations:
            masked = f"[{item.masked_key}]" if item.masked_key else "[No Key]"
            logger.info(
                f"  • {item.name:<38} | {item.status.value:<16} | Key: {masked:<16} | Ready: {item.is_ready}"
            )
        logger.info("=============================================================")


ai_config_validator = AIConfigValidator()
