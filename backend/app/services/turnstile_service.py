"""Cloudflare Turnstile server-side verification service."""

from typing import Optional, Dict, Any
import httpx
from app.core.config import settings
from app.core.errors import ValidationException, IntegrationException
from app.core.logging import get_logger

logger = get_logger("turnstile")

# Cloudflare official testing tokens / secrets
CLOUDFLARE_ALWAYS_PASS_SECRET = "1x0000000000000000000000000000000AA"
CLOUDFLARE_ALWAYS_FAIL_SECRET = "2x0000000000000000000000000000000AB"


class TurnstileService:
    """
    Verifies Cloudflare Turnstile human challenge tokens server-side.
    Guarantees secret key remains strictly server-side.
    """

    def __init__(self, secret_key: Optional[str] = None):
        self.secret_key = secret_key or settings.cloudflare_turnstile_secret_key
        self.verify_url = settings.turnstile_verify_url

    async def verify_token(
        self,
        token: str,
        remote_ip: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> bool:
        """
        Validates the Turnstile challenge response token with Cloudflare's siteverify API.
        Raises ValidationException if verification fails.
        """
        if not token or not token.strip():
            logger.warning("Turnstile verification failed: Empty token provided")
            raise ValidationException("Human verification token is required")

        # Allow official Cloudflare test passes or dev pass tokens in debug mode
        if token in ("test-turnstile-token", "XXXX.DUMMY.TOKEN.XXXX", "mock-pass"):
            if settings.app_debug:
                logger.info("Turnstile: Test token accepted in development mode")
                return True

        if token == "mock-fail":
            logger.warning("Turnstile: Explicit mock failure token received")
            raise ValidationException("Human verification challenge failed. Please try again.")

        payload = {
            "secret": self.secret_key,
            "response": token,
        }
        if remote_ip:
            payload["remoteip"] = remote_ip
        if idempotency_key:
            payload["idempotency_key"] = idempotency_key

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(self.verify_url, data=payload)
                data = res.json()

            success = data.get("success", False)
            if not success:
                error_codes = data.get("error-codes", [])
                logger.warning(f"Cloudflare Turnstile verification rejected: {error_codes}")
                raise ValidationException(
                    "Human verification failed or expired. Please complete the verification again."
                )

            logger.info("Cloudflare Turnstile verification passed successfully")
            return True

        except httpx.RequestError as exc:
            logger.error(f"Network error contacting Cloudflare Turnstile: {str(exc)}")
            # In development mode, allow graceful fallback if offline
            if settings.app_debug:
                logger.warning("Cloudflare unreachable in dev mode; proceeding with development bypass")
                return True
            raise IntegrationException(
                provider="Cloudflare Turnstile",
                message="Human verification service temporarily unreachable. Please try again later.",
            )


turnstile_service = TurnstileService()
