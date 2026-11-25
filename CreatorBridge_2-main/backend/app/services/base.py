"""Base service abstraction."""

from app.core.logging import get_logger


class BaseService:
    """Base class for domain application services."""

    def __init__(self, service_name: str):
        self.logger = get_logger(f"service.{service_name}")
