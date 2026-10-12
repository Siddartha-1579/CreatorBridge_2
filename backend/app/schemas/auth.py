"""Authentication request and response schemas with strict input validation."""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from app.core.security import UserRole


class RegisterRequest(BaseModel):
    """Registration request schema with password complexity and Turnstile validation."""
    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr
    password: str = Field(min_length=8, max_length=128, description="Minimum 8 characters")
    confirm_password: Optional[str] = Field(default=None, alias="confirmPassword")
    full_name: str = Field(min_length=2, max_length=100, alias="fullName")
    role: UserRole = UserRole.CREATOR
    turnstile_token: Optional[str] = Field(default=None, alias="turnstileToken", description="Cloudflare Turnstile token")

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if v is not None and "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginRequest(BaseModel):
    """Login request schema with Turnstile support."""
    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    turnstile_token: Optional[str] = Field(default=None, alias="turnstileToken", description="Cloudflare Turnstile token")


class PasswordResetRequest(BaseModel):
    """Password reset request schema with anti-enumeration response."""
    email: EmailStr
    turnstile_token: Optional[str] = Field(default=None, description="Cloudflare Turnstile token")


class PasswordResetConfirmRequest(BaseModel):
    """Confirm new password request schema."""
    new_password: str = Field(min_length=8, max_length=128)
    access_token: str = Field(min_length=1)


class TurnstileVerifyRequest(BaseModel):
    """Standalone Turnstile challenge token verification request."""
    token: str = Field(min_length=1)


class UserResponse(BaseModel):
    """Safe user profile response without sensitive tokens or passwords."""
    id: str
    email: str
    full_name: str
    role: UserRole
    status: str = "ACTIVE"
    is_verified: bool = False
    email_verified: bool = False
    avatar_url: Optional[str] = None


class TokenResponse(BaseModel):
    """Authenticated session response containing JWT and safe user profile."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    redirect_path: Optional[str] = None
