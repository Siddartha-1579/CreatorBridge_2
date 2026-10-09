"""Authentication and Authorization foundation using Supabase Auth & JWT."""

from typing import List, Optional
from enum import Enum
from pydantic import BaseModel
from fastapi import Depends, Header
from app.core.config import settings
from app.core.errors import UnauthorizedException, ForbiddenException
from app.core.logging import get_logger

logger = get_logger("security")


class UserRole(str, Enum):
    CREATOR = "CREATOR"
    BRAND = "BRAND"
    AGENCY = "AGENCY"
    ADMIN = "ADMIN"


class AuthenticatedUser(BaseModel):
    """Normalized authenticated user entity passed to routes/services."""
    id: str
    email: str
    role: UserRole
    is_verified: bool = False


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
) -> AuthenticatedUser:
    """
    Extracts and authenticates the user from the Authorization Bearer token.
    Separates authentication ('who you are') from authorization ('what you can do').
    In development mode, allows development header simulation for testability.
    """
    if not authorization and not (settings.app_debug and x_user_id):
        raise UnauthorizedException("Authorization header is missing")

    token = ""
    if authorization:
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise UnauthorizedException("Invalid authorization scheme. Expected 'Bearer <token>'")
        token = parts[1]

    # In development mode, allow simulated mock user if mock token or mock headers provided
    if settings.app_debug and (token.startswith("dev-") or x_user_id):
        role_str = (x_user_role or "CREATOR").upper()
        try:
            role = UserRole(role_str)
        except ValueError:
            role = UserRole.CREATOR

        user_id = x_user_id or (token.replace("dev-", "") if token.startswith("dev-") else "dev-user-001")
        return AuthenticatedUser(
            id=user_id,
            email=f"{user_id}@marketplace.local",
            role=role,
            is_verified=True,
        )

    # In production, Supabase JWT verification is performed
    # (Token decoding with Supabase JWT Secret or auth verification)
    try:
        import jwt
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id = payload.get("sub")
        email = payload.get("email", "")
        role_str = payload.get("app_metadata", {}).get("role", "CREATOR").upper()
        role = UserRole(role_str) if role_str in UserRole._value2member_map_ else UserRole.CREATOR

        return AuthenticatedUser(
            id=user_id,
            email=email,
            role=role,
            is_verified=payload.get("user_metadata", {}).get("is_verified", False),
        )
    except Exception as e:
        logger.warning(f"Failed to authenticate token: {str(e)}")
        raise UnauthorizedException("Invalid or expired authentication token")


async def get_optional_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
) -> Optional[AuthenticatedUser]:
    """Dependency that returns AuthenticatedUser if credentials are provided, or None if anonymous."""
    if not authorization and not (settings.app_debug and x_user_id):
        return None
    try:
        return await get_current_user(authorization, x_user_role, x_user_id)
    except Exception:
        return None


def require_role(allowed_roles: List[UserRole]):
    """
    Role-based Access Control (RBAC) dependency factory.
    Enforces authorization on the backend.
    """
    async def role_checker(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if current_user.role not in allowed_roles and current_user.role != UserRole.ADMIN:
            logger.warning(
                f"Forbidden access: User {current_user.id} with role {current_user.role} "
                f"attempted to access endpoint requiring {allowed_roles}"
            )
            raise ForbiddenException(
                f"Operation requires one of the following roles: {[r.value for r in allowed_roles]}"
            )
        return current_user

    return role_checker
