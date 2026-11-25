"""Storage provider abstraction interface."""

from abc import ABC, abstractmethod
from typing import Optional


class StorageProvider(ABC):
    """Abstract interface for object storage providers (Supabase Storage, S3, etc.)."""

    @abstractmethod
    async def upload_file(
        self,
        bucket: str,
        path: str,
        content: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Uploads a binary asset to storage and returns its storage reference path."""
        pass

    @abstractmethod
    async def get_public_url(self, bucket: str, path: str) -> str:
        """Returns the public HTTPS URL for an asset."""
        pass

    @abstractmethod
    async def create_signed_url(self, bucket: str, path: str, expires_in_seconds: int = 3600) -> str:
        """Generates a temporary pre-signed URL for protected assets."""
        pass

    @abstractmethod
    async def delete_file(self, bucket: str, path: str) -> bool:
        """Removes an asset from storage."""
        pass

    def is_configured(self) -> bool:
        """Returns True if the storage provider has valid remote credentials configured."""
        return True
