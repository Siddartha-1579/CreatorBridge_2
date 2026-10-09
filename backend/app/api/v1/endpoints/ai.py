"""AI Infrastructure and Studio Configuration endpoints."""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from app.core.ai_config import ai_config_validator
from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.common import ApiResponse
from app.schemas.generation import GenerationJobCreate, GenerationJobResponse
from app.services import generation_service

router = APIRouter()


@router.get("/status", response_model=ApiResponse[Dict[str, Any]], summary="Get AI infrastructure readiness status")
async def get_ai_status() -> ApiResponse[Dict[str, Any]]:
    """
    Returns public/non-sensitive readiness status for each AI modality and provider.
    Never exposes API secrets, tokens, or private credentials.
    """
    status = ai_config_validator.get_status()
    return ApiResponse(success=True, data=status, message="AI infrastructure status retrieved")


@router.get("/studios", response_model=ApiResponse[List[Dict[str, Any]]], summary="List available AI Studio modules")
async def list_studios() -> ApiResponse[List[Dict[str, Any]]]:
    """Returns metadata for the 6 creator AI studios."""
    studios = [
        {
            "id": "image",
            "name": "AI Image Studio",
            "modality": "IMAGE",
            "description": "Concept art, visual keyframes, style exploration, and multi-aspect ratio rendering",
            "supported_aspect_ratios": ["1:1", "16:9", "9:16"],
            "default_provider": "openai",
        },
        {
            "id": "video",
            "name": "AI Video Studio",
            "modality": "VIDEO",
            "description": "Text-to-video motion dynamics, camera trajectories, and cinematic shot generation",
            "supported_aspect_ratios": ["16:9", "9:16"],
            "default_provider": "runway",
        },
        {
            "id": "voice",
            "name": "AI Voiceover Studio",
            "modality": "AUDIO",
            "description": "Script narration, emotional tone styling, voice clone preview, and multilingual TTS",
            "default_provider": "elevenlabs",
        },
        {
            "id": "writing",
            "name": "AI Writing Assistant",
            "modality": "TEXT",
            "description": "Brand pitch proposals, creative concept expansion, and campaign narrative synthesis",
            "default_provider": "openai",
        },
        {
            "id": "repurpose",
            "name": "AI Content Repurposing",
            "modality": "TEXT",
            "description": "Cross-platform adaptation, vertical video hook scriptwriting, and social cutdown planning",
            "default_provider": "openai",
        },
        {
            "id": "portfolio",
            "name": "AI Portfolio Assistant",
            "modality": "TEXT",
            "description": "Auto-tagging creator assets, analyzing toolstack mastery, and drafting case studies",
            "default_provider": "openai",
        },
    ]
    return ApiResponse(success=True, data=studios)


@router.post("/generate-asset", response_model=ApiResponse[GenerationJobResponse], summary="Submit studio generation job")
async def generate_studio_asset(
    data: GenerationJobCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[GenerationJobResponse]:
    """Dispatches a generative task from any creator studio module."""
    job = await generation_service.submit_job(user_id=current_user.id, data=data)
    return ApiResponse(success=True, data=job, message="Studio asset generation processed")
