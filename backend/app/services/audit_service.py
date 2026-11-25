"""Security audit logging service."""

from typing import Optional, Dict, Any
from datetime import datetime, timezone
from uuid import uuid4
from app.core.logging import get_logger

logger = get_logger("security.audit")

# Redacted keys from metadata
REDACTED_KEYS = {"password", "token", "secret", "access_token", "turnstile_secret"}


class AuditService:
    """
    Logs and records security-sensitive events in a privacy-preserving audit trail.
    Ensures no passwords, tokens, or credentials enter audit storage.
    """

    def __init__(self):
        # In-memory storage buffer for dev/testing before DB flushing
        self._audit_events = []

    def _sanitize_metadata(self, metadata: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        if not metadata:
            return {}
        clean = {}
        for k, v in metadata.items():
            if any(s in k.lower() for s in REDACTED_KEYS):
                clean[k] = "[REDACTED]"
            else:
                clean[k] = v
        return clean

    async def log_event(
        self,
        action: str,
        status: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        clean_metadata = self._sanitize_metadata(metadata)
        event = {
            "id": str(uuid4()),
            "user_id": user_id,
            "action": action,
            "status": status,
            "ip_address": ip_address or "unknown",
            "user_agent": user_agent[:255] if user_agent else "unknown",
            "metadata": clean_metadata,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._audit_events.append(event)
        logger.info(
            f"SECURITY AUDIT: action={action} status={status} user={user_id or 'anon'} ip={ip_address}"
        )


audit_service = AuditService()
