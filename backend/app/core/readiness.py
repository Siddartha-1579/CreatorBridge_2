"""Centralized System & Integration Readiness Monitor for CreatorBridge.

Evaluates configuration formats, distinguishes required vs. optional providers,
and returns sanitized status reports with ZERO credential exposure.
"""

from typing import Dict, Any, List, Optional
from enum import Enum
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("core.readiness")


class IntegrationCategory(str, Enum):
    REQUIRED_FOR_PRODUCTION = "REQUIRED_FOR_PRODUCTION"
    REQUIRED_FOR_AI_FEATURES = "REQUIRED_FOR_AI_FEATURES"
    CREATIVE_MODALITY = "CREATIVE_MODALITY"
    OPTIONAL_SERVICE = "OPTIONAL_SERVICE"
    COMMERCIAL_ESCROW = "COMMERCIAL_ESCROW"


class IntegrationStatus(str, Enum):
    CONFIGURED = "CONFIGURED"
    REUSES_OPENAI = "REUSES_OPENAI"
    DEVELOPMENT_MOCK = "DEVELOPMENT_MOCK"
    MISSING = "MISSING"


class IntegrationDetail(BaseModel):
    id: str
    name: str
    category: IntegrationCategory
    status: IntegrationStatus
    is_ready: bool
    requires_action: bool
    env_keys_checked: List[str]
    masked_key: Optional[str] = None
    provider_selected: str
    model_or_endpoint: Optional[str] = None
    guidance: str


class SystemReadinessReport(BaseModel):
    app_name: str
    app_env: str
    app_version: str
    system_status: str
    total_integrations: int
    configured_count: int
    missing_count: int
    mock_count: int
    integrations: List[IntegrationDetail]
    summary_message: str


def _mask_secret(secret: Optional[str]) -> Optional[str]:
    """Safely masks a secret string, revealing only the prefix and last 3 characters.
    Never reveals the secret body."""
    if not secret or len(secret.strip()) == 0:
        return None
    val = secret.strip()
    if val.startswith("mock-") or "1x000000" in val:
        return "mock-development-key"
    if len(val) <= 8:
        return "***"
    prefix = val[:4]
    suffix = val[-3:]
    return f"{prefix}...{suffix}"


class SystemReadinessMonitor:
    """Evaluates readiness of all 9 CreatorBridge integrations."""

    @classmethod
    def evaluate_supabase(cls) -> IntegrationDetail:
        url = settings.effective_supabase_url
        has_url = bool(url and "supabase.co" in url)
        is_mock = "mock.supabase.co" in url or "mock-" in settings.effective_supabase_secret_key
        has_key = bool(settings.effective_supabase_secret_key and len(settings.effective_supabase_secret_key) > 20)

        if is_mock:
            status = IntegrationStatus.DEVELOPMENT_MOCK
            is_ready = False
        elif has_url and has_key:
            status = IntegrationStatus.CONFIGURED
            is_ready = True
        else:
            status = IntegrationStatus.MISSING
            is_ready = False

        return IntegrationDetail(
            id="supabase",
            name="Supabase (Auth, Database & Storage)",
            category=IntegrationCategory.REQUIRED_FOR_PRODUCTION,
            status=status,
            is_ready=is_ready,
            requires_action=not is_ready,
            env_keys_checked=["SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
            masked_key=_mask_secret(settings.effective_supabase_secret_key),
            provider_selected="supabase",
            model_or_endpoint=url,
            guidance="Configure your real Supabase Project URL and Service Role Secret Key from the Supabase dashboard." if not is_ready else "Supabase is connected with active Project URL and Service Role Secret Key.",
        )

    @classmethod
    def evaluate_core_ai(cls) -> IntegrationDetail:
        has_key = bool(settings.openai_api_key and len(settings.openai_api_key.strip()) > 8)
        is_valid_format = has_key and settings.openai_api_key.strip().startswith("sk-")

        if has_key and is_valid_format:
            status = IntegrationStatus.CONFIGURED
            is_ready = True
        elif has_key:
            status = IntegrationStatus.CONFIGURED
            is_ready = True
        else:
            status = IntegrationStatus.MISSING
            is_ready = False

        return IntegrationDetail(
            id="core_ai",
            name="OpenAI (Core AI Engine & Briefs)",
            category=IntegrationCategory.REQUIRED_FOR_AI_FEATURES,
            status=status,
            is_ready=is_ready,
            requires_action=not is_ready,
            env_keys_checked=["OPENAI_API_KEY", "OPENAI_MODEL", "OPENAI_EMBEDDING_MODEL"],
            masked_key=_mask_secret(settings.openai_api_key),
            provider_selected=settings.ai_provider,
            model_or_endpoint=settings.openai_model,
            guidance="Provide OPENAI_API_KEY (sk-...) to activate onboarding analysis, campaign brief generation, and creator matching.",
        )

    @classmethod
    def evaluate_turnstile(cls) -> IntegrationDetail:
        is_test_key = (
            settings.cloudflare_turnstile_secret_key == "1x0000000000000000000000000000000AA"
            or settings.cloudflare_turnstile_site_key == "1x00000000000000000000AA"
        )
        has_key = bool(settings.cloudflare_turnstile_secret_key and len(settings.cloudflare_turnstile_secret_key) > 5)

        if is_test_key:
            status = IntegrationStatus.DEVELOPMENT_MOCK
            is_ready = True
        elif has_key:
            status = IntegrationStatus.CONFIGURED
            is_ready = True
        else:
            status = IntegrationStatus.MISSING
            is_ready = False

        return IntegrationDetail(
            id="turnstile",
            name="Cloudflare Turnstile (Bot Protection)",
            category=IntegrationCategory.REQUIRED_FOR_PRODUCTION,
            status=status,
            is_ready=is_ready,
            requires_action=is_test_key,
            env_keys_checked=["CLOUDFLARE_TURNSTILE_SECRET_KEY", "CLOUDFLARE_TURNSTILE_SITE_KEY"],
            masked_key=_mask_secret(settings.cloudflare_turnstile_secret_key),
            provider_selected="cloudflare",
            model_or_endpoint=settings.turnstile_verify_url,
            guidance="Using Cloudflare test dummy keys for local development. Set live Turnstile keys before production release.",
        )

    @classmethod
    def evaluate_image_generation(cls) -> IntegrationDetail:
        has_dedicated = bool(
            (settings.image_api_key and len(settings.image_api_key) > 8)
            or (settings.stability_api_key and len(settings.stability_api_key) > 8)
            or (settings.fal_ai_api_key and len(settings.fal_ai_api_key) > 8)
        )
        has_openai = bool(settings.openai_api_key and len(settings.openai_api_key.strip()) > 8)

        if has_dedicated:
            status = IntegrationStatus.CONFIGURED
            is_ready = True
            masked = _mask_secret(settings.image_api_key or settings.stability_api_key or settings.fal_ai_api_key)
        elif has_openai:
            status = IntegrationStatus.REUSES_OPENAI
            is_ready = True
            masked = _mask_secret(settings.openai_api_key)
        else:
            status = IntegrationStatus.MISSING
            is_ready = False
            masked = None

        return IntegrationDetail(
            id="image_generation",
            name="AI Image Studio (DALL-E 3 / FLUX)",
            category=IntegrationCategory.CREATIVE_MODALITY,
            status=status,
            is_ready=is_ready,
            requires_action=not is_ready,
            env_keys_checked=["OPENAI_IMAGE_MODEL", "IMAGE_API_KEY", "OPENAI_API_KEY"],
            masked_key=masked,
            provider_selected=settings.image_provider,
            model_or_endpoint=settings.effective_image_model,
            guidance="Reuses OPENAI_API_KEY with DALL-E 3 by default, or accepts dedicated IMAGE_API_KEY / FAL_AI_API_KEY.",
        )

    @classmethod
    def evaluate_video_generation(cls) -> IntegrationDetail:
        has_key = bool(settings.effective_video_api_key and len(settings.effective_video_api_key.strip()) > 8)

        return IntegrationDetail(
            id="video_generation",
            name="AI Video Studio (Runway / Motion AI)",
            category=IntegrationCategory.CREATIVE_MODALITY,
            status=IntegrationStatus.CONFIGURED if has_key else IntegrationStatus.MISSING,
            is_ready=has_key,
            requires_action=not has_key,
            env_keys_checked=["VIDEO_AI_API_KEY", "RUNWAY_API_KEY", "VIDEO_AI_MODEL"],
            masked_key=_mask_secret(settings.effective_video_api_key),
            provider_selected=settings.video_provider,
            model_or_endpoint=settings.video_ai_model,
            guidance="Set VIDEO_AI_API_KEY or RUNWAY_API_KEY when the video provider is activated.",
        )

    @classmethod
    def evaluate_voiceover(cls) -> IntegrationDetail:
        has_dedicated = bool(
            (settings.tts_api_key and len(settings.tts_api_key) > 8)
            or (settings.elevenlabs_api_key and len(settings.elevenlabs_api_key) > 8)
        )
        has_openai = bool(settings.openai_api_key and len(settings.openai_api_key.strip()) > 8)

        if has_dedicated:
            status = IntegrationStatus.CONFIGURED
            is_ready = True
            masked = _mask_secret(settings.tts_api_key or settings.elevenlabs_api_key)
        elif has_openai:
            status = IntegrationStatus.REUSES_OPENAI
            is_ready = True
            masked = _mask_secret(settings.openai_api_key)
        else:
            status = IntegrationStatus.MISSING
            is_ready = False
            masked = None

        return IntegrationDetail(
            id="voiceover",
            name="AI Voiceover & Audio (TTS / ElevenLabs)",
            category=IntegrationCategory.CREATIVE_MODALITY,
            status=status,
            is_ready=is_ready,
            requires_action=not is_ready,
            env_keys_checked=["TTS_API_KEY", "ELEVENLABS_API_KEY", "OPENAI_API_KEY"],
            masked_key=masked,
            provider_selected=settings.voice_provider,
            model_or_endpoint=settings.tts_model,
            guidance="Reuses OPENAI_API_KEY with OpenAI TTS-1 by default, or accepts dedicated TTS_API_KEY / ELEVENLABS_API_KEY.",
        )

    @classmethod
    def evaluate_transcription(cls) -> IntegrationDetail:
        has_dedicated = bool(settings.transcription_api_key and len(settings.transcription_api_key) > 8)
        has_openai = bool(settings.openai_api_key and len(settings.openai_api_key.strip()) > 8)

        if has_dedicated:
            status = IntegrationStatus.CONFIGURED
            is_ready = True
            masked = _mask_secret(settings.transcription_api_key)
        elif has_openai:
            status = IntegrationStatus.REUSES_OPENAI
            is_ready = True
            masked = _mask_secret(settings.openai_api_key)
        else:
            status = IntegrationStatus.MISSING
            is_ready = False
            masked = None

        return IntegrationDetail(
            id="transcription",
            name="Audio Transcription (Whisper)",
            category=IntegrationCategory.OPTIONAL_SERVICE,
            status=status,
            is_ready=is_ready,
            requires_action=False,
            env_keys_checked=["TRANSCRIPTION_API_KEY", "OPENAI_API_KEY"],
            masked_key=masked,
            provider_selected="openai",
            model_or_endpoint=settings.transcription_model,
            guidance="Optional speech-to-text transcription. Reuses OPENAI_API_KEY automatically when configured.",
        )

    @classmethod
    def evaluate_email(cls) -> IntegrationDetail:
        has_key = bool(settings.resend_api_key and len(settings.resend_api_key.strip()) > 8)

        return IntegrationDetail(
            id="email",
            name="Email Notifications (Resend)",
            category=IntegrationCategory.OPTIONAL_SERVICE,
            status=IntegrationStatus.CONFIGURED if has_key else IntegrationStatus.MISSING,
            is_ready=has_key,
            requires_action=False,
            env_keys_checked=["RESEND_API_KEY", "EMAIL_FROM"],
            masked_key=_mask_secret(settings.resend_api_key),
            provider_selected="resend",
            model_or_endpoint=settings.email_from,
            guidance="Set RESEND_API_KEY (re_...) and verify your EMAIL_FROM address to enable transactional email notifications.",
        )

    @classmethod
    def evaluate_payments(cls) -> IntegrationDetail:
        has_key = bool(settings.stripe_secret_key and len(settings.stripe_secret_key.strip()) > 8)

        return IntegrationDetail(
            id="payments",
            name="Payments & Escrow (Stripe)",
            category=IntegrationCategory.COMMERCIAL_ESCROW,
            status=IntegrationStatus.CONFIGURED if has_key else IntegrationStatus.MISSING,
            is_ready=has_key,
            requires_action=False,
            env_keys_checked=["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY"],
            masked_key=_mask_secret(settings.stripe_secret_key),
            provider_selected="stripe",
            model_or_endpoint="api.stripe.com",
            guidance="Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY to enable campaign milestone payments and creator payouts.",
        )

    @classmethod
    def get_full_report(cls) -> SystemReadinessReport:
        integrations = [
            cls.evaluate_supabase(),
            cls.evaluate_core_ai(),
            cls.evaluate_turnstile(),
            cls.evaluate_image_generation(),
            cls.evaluate_video_generation(),
            cls.evaluate_voiceover(),
            cls.evaluate_transcription(),
            cls.evaluate_email(),
            cls.evaluate_payments(),
        ]

        configured_count = sum(1 for i in integrations if i.status in (IntegrationStatus.CONFIGURED, IntegrationStatus.REUSES_OPENAI))
        mock_count = sum(1 for i in integrations if i.status == IntegrationStatus.DEVELOPMENT_MOCK)
        missing_count = sum(1 for i in integrations if i.status == IntegrationStatus.MISSING)

        if missing_count == 0 and mock_count == 0:
            system_status = "FULLY_CONFIGURED"
            summary_message = "All 9 integrations are configured with active credentials."
        elif mock_count > 0 and missing_count == 0:
            system_status = "DEVELOPMENT_MOCK_ACTIVE"
            summary_message = "All features are active; some are running under development test keys."
        else:
            system_status = "READY_WITH_OPTIONAL_MISSING"
            summary_message = f"{configured_count} of 9 integrations configured. Application is running gracefully with placeholders for awaiting keys."

        return SystemReadinessReport(
            app_name=settings.app_name,
            app_env=settings.app_env,
            app_version=settings.app_version,
            system_status=system_status,
            total_integrations=len(integrations),
            configured_count=configured_count,
            missing_count=missing_count,
            mock_count=mock_count,
            integrations=integrations,
            summary_message=summary_message,
        )


system_readiness_monitor = SystemReadinessMonitor()
