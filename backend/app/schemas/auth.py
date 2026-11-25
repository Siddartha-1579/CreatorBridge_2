"""Authentication request and response schemas with strict input validation."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict, computed_field
from app.core.security import UserRole


class RegisterRequest(BaseModel):
    """Registration request schema with password complexity, Turnstile, and mandatory policy acceptance."""
    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr
    password: str = Field(min_length=8, max_length=128, description="Minimum 8 characters")
    confirm_password: Optional[str] = Field(default=None, alias="confirmPassword")
    full_name: str = Field(min_length=2, max_length=100, alias="fullName")
    role: UserRole = UserRole.CREATOR
    turnstile_token: Optional[str] = Field(default=None, alias="turnstileToken", description="Cloudflare Turnstile token")
    policy_accepted: bool = Field(default=False, alias="policyAccepted", description="Mandatory agreement to CreatorBridge Platform Policies")
    policy_version: Optional[str] = Field(default=None, alias="policyVersion", description="Accepted policy version reference")

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if v is not None and "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginRequest(BaseModel):
    """Login request schema with Turnstile and optional portal hint."""
    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    turnstile_token: Optional[str] = Field(default=None, alias="turnstileToken", description="Cloudflare Turnstile token")
    portal: Optional[str] = Field(default=None, description="Optional portal context hint ('brand' or 'creator')")


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
    model_config = ConfigDict(populate_by_name=True)

    id: str
    email: str
    full_name: str
    role: UserRole
    status: str = "ACTIVE"
    is_verified: bool = False
    email_verified: bool = False
    avatar_url: Optional[str] = None
    policy_accepted: bool = True
    accepted_policy_version: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @computed_field
    @property
    def fullName(self) -> str:
        return self.full_name

    @computed_field
    @property
    def isVerified(self) -> bool:
        return self.is_verified

    @computed_field
    @property
    def emailVerified(self) -> bool:
        return self.email_verified

    @computed_field
    @property
    def avatarUrl(self) -> Optional[str]:
        return self.avatar_url

    @computed_field
    @property
    def policyAccepted(self) -> bool:
        return self.policy_accepted


class TokenResponse(BaseModel):
    """Authenticated session response containing JWT and safe user profile."""
    model_config = ConfigDict(populate_by_name=True)

    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    redirect_path: Optional[str] = None

    @computed_field
    @property
    def accessToken(self) -> str:
        return self.access_token

    @computed_field
    @property
    def tokenType(self) -> str:
        return self.token_type

    @computed_field
    @property
    def redirectPath(self) -> Optional[str]:
        return self.redirect_path
