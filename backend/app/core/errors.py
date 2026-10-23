"""Centralized error handling and standard structured exception definitions."""

from typing import Any, Dict, Optional
import re
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("errors")

ALLOWED_ORIGIN_REGEX = re.compile(r"^https://creatorbridge2.*\.vercel\.app$")
DEFAULT_ALLOWED_ORIGINS = {
    "https://creatorbridge2.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
}


def add_cors_headers(request: Request, response: JSONResponse) -> JSONResponse:
    """Explicitly attaches CORS headers to error responses for allowed origins."""
    origin = request.headers.get("origin")
    if not origin:
        return response
    cleaned = origin.strip().rstrip("/")
    is_allowed = (
        cleaned in DEFAULT_ALLOWED_ORIGINS
        or cleaned in settings.cors_origins
        or (settings.frontend_url and cleaned == settings.frontend_url.strip().rstrip("/"))
        or bool(ALLOWED_ORIGIN_REGEX.match(cleaned))
    )
    if is_allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Vary"] = "Origin"
    return response


class AppException(Exception):
    """Base application exception for all domain errors."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class NotFoundException(AppException):
    def __init__(self, resource: str, identifier: Any = ""):
        message = f"{resource} '{identifier}' not found" if identifier else f"{resource} not found"
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "identifier": str(identifier)},
        )


class ValidationException(AppException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", status.HTTP_422_UNPROCESSABLE_ENTITY),
            details=details,
        )


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "Access forbidden"):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class ConflictException(AppException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
            details=details,
        )


class IntegrationException(AppException):
    def __init__(self, provider: str, message: str):
        super().__init__(
            message=f"External provider failure ({provider}): {message}",
            code="EXTERNAL_PROVIDER_ERROR",
            status_code=status.HTTP_502_BAD_GATEWAY,
            details={"provider": provider},
        )


class ProviderNotConfiguredException(AppException):
    def __init__(self, provider: str, message: str):
        super().__init__(
            message=message,
            code="PROVIDER_NOT_CONFIGURED",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"provider": provider},
        )


def format_error_response(code: str, message: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Builds a standardized error envelope."""
    return {
        "success": false if False else False,
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        },
    }


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handles custom domain application exceptions."""
    logger.warning(f"AppException: [{exc.code}] {exc.message} on {request.url.path}")
    response = JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(code=exc.code, message=exc.message, details=exc.details),
    )
    return add_cors_headers(request, response)


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handles standard Starlette / FastAPI HTTPExceptions."""
    code = "HTTP_ERROR"
    if exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 403:
        code = "FORBIDDEN"

    response = JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(
            code=code,
            message=str(exc.detail),
            details={},
        ),
    )
    return add_cors_headers(request, response)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handles Pydantic request validation errors."""
    simplified_errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        simplified_errors.append({
            "field": loc,
            "message": err.get("msg", ""),
            "type": err.get("type", ""),
        })

    logger.info(f"Validation failure on {request.url.path}: {simplified_errors}")
    response = JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=format_error_response(
            code="VALIDATION_ERROR",
            message="Request input validation failed",
            details={"fields": simplified_errors},
        ),
    )
    return add_cors_headers(request, response)


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handles unexpected internal server errors without leaking stack traces."""
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
    response = JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=format_error_response(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected server error occurred. Please try again later.",
            details={},
        ),
    )
    return add_cors_headers(request, response)
