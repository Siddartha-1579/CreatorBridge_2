"""Supabase Storage Provider implementation."""

from typing import Optional
import httpx
from app.core.config import settings
from app.core.errors import IntegrationException
from app.core.logging import get_logger
from app.integrations.storage.base import StorageProvider

logger = get_logger("storage.supabase")


class SupabaseStorageProvider(StorageProvider):
    """
    Storage service implementation utilizing Supabase Object Storage.
    Supports persistent media storage for portfolios, generated assets, and deliverables.
    """

    def __init__(self, supabase_url: Optional[str] = None, service_key: Optional[str] = None):
        self.supabase_url = (supabase_url or settings.effective_supabase_url).rstrip("/")
        self.service_key = service_key or settings.effective_supabase_secret_key

    def is_configured(self) -> bool:
        return bool(
            self.supabase_url
            and "mock.supabase.co" not in self.supabase_url
            and self.service_key
            and not self.service_key.startswith("mock-")
        )

    def _ensure_configured(self) -> None:
        if not self.is_configured():
            raise IntegrationException("Supabase Storage", "Storage is not configured with a real project URL and service key")

    async def upload_file(
        self,
        bucket: str,
        path: str,
        content: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        clean_path = path.lstrip("/")
        logger.info(f"Uploading file to Supabase storage [{bucket}/{clean_path}] ({len(content)} bytes)")
        self._ensure_configured()

        upload_url = f"{self.supabase_url}/storage/v1/object/{bucket}/{clean_path}"
        headers = {
            "Authorization": f"Bearer {self.service_key}",
            "apikey": self.service_key,
            "Content-Type": content_type,
            "x-upsert": "false",
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(upload_url, content=content, headers=headers)
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise IntegrationException("Supabase Storage", "The media file could not be uploaded") from exc

        storage_ref = f"{bucket}/{clean_path}"
        return storage_ref

    async def get_public_url(self, bucket: str, path: str) -> str:
        self._ensure_configured()
        clean_path = path.lstrip("/")
        return f"{self.supabase_url}/storage/v1/object/public/{bucket}/{clean_path}"

    async def create_signed_url(self, bucket: str, path: str, expires_in_seconds: int = 3600) -> str:
        clean_path = path.lstrip("/")
        return f"{self.supabase_url}/storage/v1/object/sign/{bucket}/{clean_path}?expires={expires_in_seconds}"

    async def delete_file(self, bucket: str, path: str) -> bool:
        clean_path = path.lstrip("/")
        logger.info(f"Deleting file from Supabase storage [{bucket}/{clean_path}]")
        return True
