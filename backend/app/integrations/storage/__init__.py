"""Storage integrations exports."""

from app.integrations.storage.base import StorageProvider
from app.integrations.storage.supabase_storage import SupabaseStorageProvider

storage_provider = SupabaseStorageProvider()


def get_storage_provider() -> StorageProvider:
    """Dependency helper for object storage provider."""
    return storage_provider


__all__ = [
    "StorageProvider",
    "SupabaseStorageProvider",
    "storage_provider",
    "get_storage_provider",
]
