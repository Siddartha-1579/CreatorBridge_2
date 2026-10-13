"""Structured server-side logging with sensitive data redaction."""

import logging
import re
import sys
from typing import Any

# Patterns to mask sensitive information
SENSITIVE_PATTERNS = [
    re.compile(r'(password|secret|token|api[_-]?key|authorization|bearer)\s*[:=]\s*["\']?([^"\'\s]+)', re.IGNORECASE),
]


class RedactingFormatter(logging.Formatter):
    """Log formatter that masks credentials, tokens, and secrets."""

    def format(self, record: logging.LogRecord) -> str:
        msg = super().format(record)
        for pattern in SENSITIVE_PATTERNS:
            msg = pattern.sub(r'\1: [REDACTED]', msg)
        return msg


def setup_logging(log_level: str = "INFO") -> None:
    """Configures structured application logging."""
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Avoid duplicate handlers
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = RedactingFormatter(
            fmt="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        root_logger.addHandler(handler)


def get_logger(name: str) -> logging.Logger:
    """Returns a named logger."""
    return logging.getLogger(f"creatorbridge.{name}")
