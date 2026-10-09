"""Authentication endpoints protected by Cloudflare Turnstile, sliding-window rate limiting, and audit logging."""

from typing import Optional, Dict
from fastapi import APIRouter, Depends, Request
from app.core.security import get_current_user, AuthenticatedUser
from app.core.rate_limit import auth_rate_limiter
from app.schemas.common import ApiResponse
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    PasswordResetRequest,
    PasswordResetConfirmRequest,
    TurnstileVerifyRequest,
    TokenResponse,
    UserResponse,
)
from app.services import auth_service, turnstile_service

router = APIRouter()


def _get_client_ip(request: Request) -> str:
    """Extracts client IP from Cloudflare header or forwarded headers."""
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


@router.post(
    "/register",
    response_model=ApiResponse[TokenResponse],
    dependencies=[Depends(auth_rate_limiter)],
    summary="Register user (Creator or Brand)",
)
async def register(request: Request, body: RegisterRequest) -> ApiResponse[TokenResponse]:
    """
    Registers a new creator or brand/agency account.
    Validates Turnstile human verification and rate limits registration frequency.
    """
    ip = _get_client_ip(request)
    ua = request.headers.get("user-agent")
    result = await auth_service.register(body, ip_address=ip, user_agent=ua)
    return ApiResponse(success=True, data=result, message="Registration successful")


@router.post(
    "/login",
    response_model=ApiResponse[TokenResponse],
    dependencies=[Depends(auth_rate_limiter)],
    summary="Authenticate user",
)
async def login(request: Request, body: LoginRequest) -> ApiResponse[TokenResponse]:
    """
    Authenticates an existing user and returns an authorized session JWT.
    Validates Turnstile human verification challenge.
    """
    ip = _get_client_ip(request)
    ua = request.headers.get("user-agent")
    result = await auth_service.login(body, ip_address=ip, user_agent=ua)
    return ApiResponse(success=True, data=result, message="Authentication successful")


@router.post(
    "/forgot-password",
    response_model=ApiResponse[Dict[str, str]],
    dependencies=[Depends(auth_rate_limiter)],
    summary="Request password reset link",
)
async def forgot_password(
    request: Request, body: PasswordResetRequest
) -> ApiResponse[Dict[str, str]]:
    """
    Sends a password reset link to the specified email with anti-enumeration protection.
    Always returns identical message regardless of whether the email exists.
    """
    ip = _get_client_ip(request)
    ua = request.headers.get("user-agent")
    result = await auth_service.request_password_reset(body, ip_address=ip, user_agent=ua)
    return ApiResponse(success=True, data=result, message=result["message"])


@router.post(
    "/reset-password",
    response_model=ApiResponse[Dict[str, str]],
    dependencies=[Depends(auth_rate_limiter)],
    summary="Confirm new password",
)
async def reset_password(
    request: Request, body: PasswordResetConfirmRequest
) -> ApiResponse[Dict[str, str]]:
    """Updates password using an authorized recovery token."""
    ip = _get_client_ip(request)
    ua = request.headers.get("user-agent")
    result = await auth_service.confirm_password_reset(body, ip_address=ip, user_agent=ua)
    return ApiResponse(success=True, data=result, message=result["message"])


@router.post(
    "/verify-turnstile",
    response_model=ApiResponse[Dict[str, bool]],
    dependencies=[Depends(auth_rate_limiter)],
    summary="Standalone Turnstile challenge verification",
)
async def verify_turnstile(
    request: Request, body: TurnstileVerifyRequest
) -> ApiResponse[Dict[str, bool]]:
    """Validates Turnstile challenge token without triggering full login/register flow."""
    ip = _get_client_ip(request)
    passed = await turnstile_service.verify_token(body.token, remote_ip=ip)
    return ApiResponse(success=True, data={"verified": passed})


@router.post("/logout", response_model=ApiResponse[Dict[str, str]], summary="User logout")
async def logout(
    request: Request,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user),
) -> ApiResponse[Dict[str, str]]:
    """Terminates session and records security audit trail."""
    ip = _get_client_ip(request)
    ua = request.headers.get("user-agent")
    user_id = current_user.id if current_user else None
    await auth_service.logout(user_id=user_id, ip_address=ip, user_agent=ua)
    return ApiResponse(success=True, data={"status": "logged_out"}, message="Logged out successfully")


@router.get("/me", response_model=ApiResponse[AuthenticatedUser], summary="Current user profile")
async def get_me(current_user: AuthenticatedUser = Depends(get_current_user)) -> ApiResponse[AuthenticatedUser]:
    """Retrieves authoritative user profile and role from authenticated session token."""
    return ApiResponse(success=True, data=current_user)
