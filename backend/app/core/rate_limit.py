"""In-memory rate limiter with sliding window tracking."""

import time
from collections import defaultdict
from typing import Dict, List, Optional
from fastapi import Request, Response
from app.core.config import settings
from app.core.errors import AppException
from app.core.logging import get_logger

logger = get_logger("rate_limiter")


class RateLimiter:
    """
    Sliding window in-memory rate limiter.
    Enforces request frequency limits per client IP or authenticated user ID.
    """

    def __init__(self, requests_per_minute: int = 60, prefix: str = "default"):
        self.requests_per_minute = requests_per_minute
        self.prefix = prefix
        self.window_seconds = 60
        # Map: key -> list of timestamps
        self._history: Dict[str, List[float]] = defaultdict(list)

    def _clean_old_requests(self, now: float, key: str) -> None:
        cutoff = now - self.window_seconds
        self._history[key] = [t for t in self._history[key] if t > cutoff]

    def _get_client_identifier(self, request: Request) -> str:
        # Check CF-Connecting-IP (from Cloudflare) or X-Forwarded-For or client.host
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return cf_ip.strip()

        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        if request.client and request.client.host:
            return request.client.host

        return "unknown_client"

    async def __call__(self, request: Request, response: Response) -> None:
        client_id = self._get_client_identifier(request)
        if settings.app_debug and client_id == "testclient":
            return
        rate_key = f"{self.prefix}:{client_id}"
        now = time.time()

        self._clean_old_requests(now, rate_key)
        current_count = len(self._history[rate_key])

        remaining = max(0, self.requests_per_minute - current_count)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)

        if current_count >= self.requests_per_minute:
            oldest = self._history[rate_key][0]
            retry_after = max(1, int(self.window_seconds - (now - oldest)))
            response.headers["Retry-After"] = str(retry_after)
            logger.warning(
                f"Rate limit exceeded for client {client_id} on {request.url.path} "
                f"({current_count}/{self.requests_per_minute} req/min)"
            )
            raise AppException(
                message=f"Rate limit exceeded. Please wait {retry_after} seconds before retrying.",
                code="RATE_LIMIT_EXCEEDED",
                status_code=429,
                details={"retry_after_seconds": retry_after, "limit": self.requests_per_minute},
            )

        self._history[rate_key].append(now)


# Standard rate limiters for dependency injection
auth_rate_limiter = RateLimiter(requests_per_minute=10, prefix="auth")
api_rate_limiter = RateLimiter(requests_per_minute=60, prefix="api")
search_rate_limiter = RateLimiter(requests_per_minute=30, prefix="search")
generation_rate_limiter = RateLimiter(requests_per_minute=15, prefix="generation")
