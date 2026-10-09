"""Centralized application settings using Pydantic Settings."""

from typing import List, Optional
from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for HacXLerate application."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # 1. Application Settings
    app_name: str = Field(default="CreatorBridge AI Creator Marketplace", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    app_debug: bool = Field(default=True, alias="APP_DEBUG")
    app_version: str = Field(default="1.0.0", alias="APP_VERSION")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")
    cors_origins: List[str] = Field(
        default=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
        alias="CORS_ORIGINS",
    )

    # 2. Database & Supabase Settings (A)
    supabase_url: str = Field(default="https://mock.supabase.co", alias="SUPABASE_URL")
    supabase_secret_key: str = Field(default="", alias="SUPABASE_SECRET_KEY")
    supabase_service_role_key: str = Field(default="mock-service-role-key", alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_anon_key: str = Field(default="mock-anon-key", alias="SUPABASE_ANON_KEY")
    supabase_jwt_secret: str = Field(default="mock-jwt-secret-do-not-use-in-production", alias="SUPABASE_JWT_SECRET")

    # 3. Storage Settings (Supabase Storage Buckets)
    storage_portfolios_bucket: str = Field(default="portfolios", alias="STORAGE_PORTFOLIOS_BUCKET")
    storage_generations_bucket: str = Field(default="generated-assets", alias="STORAGE_GENERATIONS_BUCKET")
    storage_projects_bucket: str = Field(default="project-files", alias="STORAGE_PROJECTS_BUCKET")
    storage_avatars_bucket: str = Field(default="avatars", alias="STORAGE_AVATARS_BUCKET")

    # 4. Cloudflare Turnstile Settings (Bot Protection - C)
    cloudflare_turnstile_site_key: str = Field(
        default="1x00000000000000000000AA", alias="CLOUDFLARE_TURNSTILE_SITE_KEY"
    )
    cloudflare_turnstile_secret_key: str = Field(
        default="1x0000000000000000000000000000000AA", alias="CLOUDFLARE_TURNSTILE_SECRET_KEY"
    )
    turnstile_verify_url: str = Field(
        default="https://challenges.cloudflare.com/turnstile/v0/siteverify",
        alias="TURNSTILE_VERIFY_URL",
    )

    # 5. Security & Rate Limiting Settings
    rate_limit_auth_per_minute: int = Field(default=10, alias="RATE_LIMIT_AUTH_PER_MINUTE")
    rate_limit_api_per_minute: int = Field(default=60, alias="RATE_LIMIT_API_PER_MINUTE")
    enable_security_headers: bool = Field(default=True, alias="ENABLE_SECURITY_HEADERS")

    # 6. Core AI Engine — OpenAI & Structured Reasoning (B)
    ai_provider: str = Field(default="openai", alias="AI_PROVIDER")
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", validation_alias=AliasChoices("OPENAI_MODEL", "OPENAI_TEXT_MODEL"))
    openai_embedding_model: str = Field(default="text-embedding-3-small", alias="OPENAI_EMBEDDING_MODEL")
    embedding_model: str = Field(default="text-embedding-3-small", alias="EMBEDDING_MODEL")
    embedding_provider: str = Field(default="openai", alias="EMBEDDING_PROVIDER")
    embedding_api_key: str = Field(default="", alias="EMBEDDING_API_KEY")

    anthropic_api_key: str = Field(default="", alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(default="claude-3-5-sonnet-20241022", alias="ANTHROPIC_MODEL")
    openai_base_url: Optional[str] = Field(default=None, alias="OPENAI_BASE_URL")
    ai_request_timeout_seconds: int = Field(default=30, alias="AI_REQUEST_TIMEOUT_SECONDS")
    ai_max_retries: int = Field(default=3, alias="AI_MAX_RETRIES")
    ai_max_input_chars: int = Field(default=12000, alias="AI_MAX_INPUT_CHARS")
    ai_max_questions_per_request: int = Field(default=3, alias="AI_MAX_QUESTIONS_PER_REQUEST")
    ai_max_output_tokens: int = Field(default=800, alias="AI_MAX_OUTPUT_TOKENS")
    ai_max_requests_per_window: int = Field(default=30, alias="AI_MAX_REQUESTS_PER_WINDOW")

    # 7. AI Image Generation Configuration (D)
    openai_image_model: str = Field(default="dall-e-3", alias="OPENAI_IMAGE_MODEL")
    image_provider: str = Field(default="openai", alias="IMAGE_PROVIDER")
    image_api_key: str = Field(default="", alias="IMAGE_API_KEY")
    image_model: str = Field(default="dall-e-3", alias="IMAGE_MODEL")
    stability_api_key: str = Field(default="", alias="STABILITY_API_KEY")
    fal_ai_api_key: str = Field(default="", alias="FAL_AI_API_KEY")

    # 8. AI Video Generation Configuration (E)
    video_ai_api_key: str = Field(default="", alias="VIDEO_AI_API_KEY")
    video_ai_base_url: str = Field(default="", alias="VIDEO_AI_BASE_URL")
    video_ai_model: str = Field(default="gen3a_turbo", alias="VIDEO_AI_MODEL")
    video_provider: str = Field(default="runway", alias="VIDEO_PROVIDER")
    video_api_key: str = Field(default="", alias="VIDEO_API_KEY")
    video_model: str = Field(default="gen3a_turbo", alias="VIDEO_MODEL")
    runway_api_key: str = Field(default="", alias="RUNWAY_API_KEY")

    # 9. AI Voiceover & Audio Configuration (F)
    tts_api_key: str = Field(default="", alias="TTS_API_KEY")
    tts_base_url: str = Field(default="", alias="TTS_BASE_URL")
    tts_model: str = Field(default="tts-1", alias="TTS_MODEL")
    voice_provider: str = Field(default="openai", alias="VOICE_PROVIDER")
    voice_api_key: str = Field(default="", alias="VOICE_API_KEY")
    voice_model: str = Field(default="tts-1", alias="VOICE_MODEL")
    elevenlabs_api_key: str = Field(default="", alias="ELEVENLABS_API_KEY")

    # 10. Optional Audio Transcription (G)
    transcription_api_key: str = Field(default="", alias="TRANSCRIPTION_API_KEY")
    transcription_model: str = Field(default="whisper-1", alias="TRANSCRIPTION_MODEL")

    # 11. Email & Notification Services (H)
    resend_api_key: str = Field(default="", alias="RESEND_API_KEY")
    email_from: str = Field(default="notifications@creatorbridge.com", alias="EMAIL_FROM")

    # 12. Payment Processing & Commercial Escrow (I)
    stripe_secret_key: str = Field(default="", alias="STRIPE_SECRET_KEY")
    stripe_publishable_key: str = Field(default="", alias="STRIPE_PUBLISHABLE_KEY")
    stripe_webhook_secret: str = Field(default="", alias="STRIPE_WEBHOOK_SECRET")

    # 13. Logging Settings
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    @property
    def effective_supabase_url(self) -> str:
        """Returns normalized Supabase REST API URL."""
        url = (self.supabase_url or "").strip()
        if "supabase.com/dashboard/project/" in url:
            parts = url.rstrip("/").split("/")
            ref = parts[-1]
            return f"https://{ref}.supabase.co"
        return url

    @property
    def effective_supabase_secret_key(self) -> str:
        """Returns the primary secret key or legacy service-role fallback."""
        return self.supabase_secret_key or self.supabase_service_role_key

    @property
    def effective_embedding_model(self) -> str:
        """Returns the active embedding model."""
        return self.openai_embedding_model or self.embedding_model

    @property
    def effective_image_model(self) -> str:
        """Returns the active image generation model."""
        return self.openai_image_model or self.image_model

    @property
    def effective_video_api_key(self) -> str:
        """Returns the active video generation API key."""
        return self.video_ai_api_key or self.runway_api_key or self.video_api_key

    @property
    def effective_tts_api_key(self) -> str:
        """Returns the active voice API key (reusing OpenAI key if unconfigured)."""
        return self.tts_api_key or self.elevenlabs_api_key or self.voice_api_key or self.openai_api_key

    @property
    def effective_transcription_api_key(self) -> str:
        """Returns the active transcription API key (reusing OpenAI key if unconfigured)."""
        return self.transcription_api_key or self.openai_api_key


settings = Settings()
