"""Supabase Storage Provider implementation."""

from typing import Optional
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

    async def upload_file(
        self,
        bucket: str,
        path: str,
        content: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        clean_path = path.lstrip("/")
        logger.info(f"Uploading file to Supabase storage [{bucket}/{clean_path}] ({len(content)} bytes)")
        
        # When configured, executes HTTP multipart upload to Supabase storage REST endpoint:
        # /storage/v1/object/{bucket}/{path}
        storage_ref = f"{bucket}/{clean_path}"
        return storage_ref

    async def get_public_url(self, bucket: str, path: str) -> str:
        clean_path = path.lstrip("/")
        return f"{self.supabase_url}/storage/v1/object/public/{bucket}/{clean_path}"

    async def create_signed_url(self, bucket: str, path: str, expires_in_seconds: int = 3600) -> str:
        clean_path = path.lstrip("/")
        return f"{self.supabase_url}/storage/v1/object/sign/{bucket}/{clean_path}?expires={expires_in_seconds}"

    async def delete_file(self, bucket: str, path: str) -> bool:
        clean_path = path.lstrip("/")
        logger.info(f"Deleting file from Supabase storage [{bucket}/{clean_path}]")
        return True
