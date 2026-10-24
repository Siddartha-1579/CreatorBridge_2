"""Endpoints for CreatorBridge Platform Policies, status checking, and acceptance."""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Request
from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.common import ApiResponse
from app.schemas.policy import (
    PlatformPolicyResponse,
    PolicyStatusResponse,
    PolicyAcceptanceRequest,
    PolicyAcceptanceRecord,
)
from app.services.policy_service import policy_service

router = APIRouter()


def _get_client_ip(request: Request) -> str:
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


@router.get("/current", response_model=ApiResponse[PlatformPolicyResponse], summary="Get current platform policies")
async def get_current_policies() -> ApiResponse[PlatformPolicyResponse]:
    """Returns the complete, authoritative CreatorBridge Platform Policies document."""
    data = policy_service.get_current_policy()
    return ApiResponse(
        success=True,
        data=PlatformPolicyResponse(**data),
        message="Active platform policies retrieved successfully",
    )


@router.get("/status", response_model=ApiResponse[PolicyStatusResponse], summary="Check user policy acceptance status")
async def get_my_policy_status(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[PolicyStatusResponse]:
    """Returns the compliance status and latest accepted version for the authenticated user."""
    status = policy_service.get_user_policy_status(current_user.id)
    return ApiResponse(
        success=True,
        data=PolicyStatusResponse(**status),
        message="User policy compliance status retrieved",
    )


@router.post("/accept", response_model=ApiResponse[Dict[str, Any]], summary="Accept active platform policies")
async def accept_platform_policies(
    request: Request,
    body: PolicyAcceptanceRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[Dict[str, Any]]:
    """Records an immutable policy acceptance for the authenticated user in the database.
    Never accepts on behalf of another user; the authenticated user ID is strictly enforced.
    """
    ip = _get_client_ip(request)
    ua = request.headers.get("user-agent")

    result = policy_service.record_policy_acceptance(
        user_id=current_user.id,
        policy_version=body.policy_version,
        ip_address=ip,
        user_agent=ua,
    )
    return ApiResponse(
        success=True,
        data=result,
        message=f"Platform Policies version {body.policy_version} accepted successfully",
    )


@router.get("/history", response_model=ApiResponse[List[PolicyAcceptanceRecord]], summary="Get user acceptance history")
async def get_my_acceptance_history(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[List[PolicyAcceptanceRecord]]:
    """Returns the complete chronological audit history of policy acceptances for the user."""
    history = policy_service.get_acceptance_history(current_user.id)
    records = [PolicyAcceptanceRecord(**r) for r in history]
    return ApiResponse(
        success=True,
        data=records,
        message="Acceptance audit records retrieved",
    )
