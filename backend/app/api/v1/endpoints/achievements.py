"""Creator achievement ledger endpoints.

Points can be spent by the authenticated creator. Awards are intentionally not exposed
as a creator-controlled endpoint; trusted completion/review workflows call the service.
"""
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user, AuthenticatedUser, UserRole
from app.schemas.common import ApiResponse
from app.repositories import creator_repository
from app.services.achievement_service import achievement_service

router = APIRouter()


class PriorityBoostRequest(BaseModel):
    points: int = Field(ge=10, le=100)
    brief_id: Optional[str] = Field(default=None, max_length=128)


@router.get("/me", response_model=ApiResponse[dict], summary="Get achievement points and active boosts")
async def get_my_achievements(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[dict]:
    if current_user.role != UserRole.CREATOR and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Creator role required.")
    creator = await creator_repository.get_by_user_id(str(current_user.id))
    if not creator:
        try:
            from uuid import UUID
            creator = await creator_repository.get_by_id(UUID(str(current_user.id)))
        except Exception:
            creator = None
    if not creator:
        return ApiResponse(success=True, data={
            "lifetime_points": 0, "available_points": 0, "spent_points": 0,
            "long_term_reputation_bonus": 0.0, "active_boosts": [], "recent_achievements": [],
        }, message="No creator profile is linked to this account yet.")
    return ApiResponse(success=True, data=achievement_service.get_summary(str(creator.id)))


@router.post("/boosts", response_model=ApiResponse[dict], summary="Spend points on a temporary priority boost")
async def create_priority_boost(
    body: PriorityBoostRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[dict]:
    if current_user.role != UserRole.CREATOR:
        raise HTTPException(status_code=403, detail="Only creators can spend achievement points.")
    creator = await creator_repository.get_by_user_id(str(current_user.id))
    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found.")
    try:
        boost = achievement_service.spend_for_boost(str(creator.id), body.points, body.brief_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ApiResponse(success=True, data=boost, message="Temporary priority boost activated.")


@router.get("/accounts/{creator_id}", response_model=ApiResponse[dict], summary="Public achievement reputation summary")
async def get_creator_achievement_summary(creator_id: str) -> ApiResponse[dict]:
    # Public summary excludes account balance and private boost targeting.
    summary = achievement_service.get_summary(creator_id)
    return ApiResponse(success=True, data={
        "lifetime_points": summary["lifetime_points"],
        "long_term_reputation_bonus": summary["long_term_reputation_bonus"],
        "recent_achievements": summary["recent_achievements"],
    })
