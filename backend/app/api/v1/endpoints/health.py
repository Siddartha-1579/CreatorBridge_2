"""Health check endpoint."""

from typing import Dict, Any
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.common import ApiResponse

from app.core.readiness import system_readiness_monitor, SystemReadinessReport

router = APIRouter()


@router.get("/health", response_model=Dict[str, Any], summary="API Health Check")
async def health_check() -> Dict[str, Any]:
    """
    Returns API health status.
    Does not expose sensitive environment secrets.
    """
    return {
        "status": "ok",
        "version": settings.app_version,
        "environment": settings.app_env,
    }


@router.get("/health/readiness", response_model=ApiResponse[SystemReadinessReport], summary="API Integration Readiness Audit")
async def readiness_check() -> ApiResponse[SystemReadinessReport]:
    """
    Audits configuration readiness across all 9 platform integrations:
    - Supabase (Auth, Database, Storage)
    - OpenAI Core AI Engine
    - Cloudflare Turnstile Bot Protection
    - AI Image Generation
    - AI Video Generation
    - AI Voiceover / TTS
    - Audio Transcription
    - Resend Email & Notifications
    - Stripe Payments & Escrow

    Returns non-sensitive readiness state, masked key snippets, and guidance.
    NEVER exposes raw API keys, private tokens, or secrets.
    """
    report = system_readiness_monitor.get_full_report()
    return ApiResponse(
        success=True,
        data=report,
        message=report.summary_message,
    )

