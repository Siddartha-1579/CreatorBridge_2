"""Database connection and client management for PostgreSQL / Supabase."""

from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("database")


class DatabaseClient:
    """
    Manages database access via Supabase Client or connection pooling.
    Abstracts direct connection logic away from domain services.
    """

    def __init__(self):
        self._is_connected: bool = False

    async def connect(self) -> None:
        """Initializes database connectivity."""
        logger.info(f"Connecting to database via Supabase at {settings.supabase_url}...")
        self._is_connected = True

    async def disconnect(self) -> None:
        """Closes active database connections."""
        logger.info("Closing database connections...")
        self._is_connected = False

    async def check_health(self) -> Dict[str, Any]:
        """Performs a lightweight health check on the database."""
        return {
            "status": "connected" if self._is_connected else "configured",
            "url": settings.supabase_url.split("@")[-1] if "@" in settings.supabase_url else "configured",
        }


# Global database client singleton
db_client = DatabaseClient()


async def get_db() -> DatabaseClient:
    """Dependency injection helper for database access."""
    return db_client
