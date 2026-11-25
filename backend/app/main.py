"""Main FastAPI application entry point."""

import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.database import db_client
from app.core.errors import (
    AppException,
    app_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)
from app.api.v1.api import api_v1_router

# Initialize structured logging
setup_logging(settings.log_level)
logger = get_logger("main")


from app.core.ai_config import ai_config_validator

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    logger.info(f"Starting {settings.app_name} v{settings.app_version} [{settings.app_env}]")
    await db_client.connect()
    ai_config_validator.log_startup_summary()
    yield
    await db_client.disconnect()
    logger.info("Application shutdown complete.")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-native marketplace connecting AI creators with brands and creative agencies.",
    lifespan=lifespan,
    docs_url="/docs" if settings.app_debug else None,
    redoc_url="/redoc" if settings.app_debug else None,
)

# Register structured error handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)


# Security Headers middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(), payment=()"
    if not settings.app_debug:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Request timing & structured audit logging middleware
@app.middleware("http")
async def audit_logging_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    # Exclude high frequency internal health checks from noisy logs if desired
    if request.url.path != f"{settings.api_v1_prefix}/health":
        logger.info(
            f"{request.method} {request.url.path} - {response.status_code} ({duration_ms}ms)"
        )
    return response


# Configure CORS - added last so CORSMiddleware is the outermost application middleware,
# ensuring preflights are handled immediately and all responses (including errors) carry CORS headers.
raw_origins = list(settings.cors_origins)
if settings.frontend_url:
    raw_origins.append(settings.frontend_url)
raw_origins.extend([
    "https://creatorbridge2.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
])

allowed_origins: list[str] = []
for origin in raw_origins:
    if origin and isinstance(origin, str):
        cleaned = origin.strip().rstrip("/")
        if cleaned and cleaned not in allowed_origins:
            allowed_origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https://creatorbridge2.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)


# Include API v1 Router
app.include_router(api_v1_router, prefix=settings.api_v1_prefix)


@app.get("/", tags=["Root"])
async def root():
    """Root info endpoint."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "online",
        "documentation": "/docs" if settings.app_debug else "disabled in production",
        "api_v1": settings.api_v1_prefix,
    }
