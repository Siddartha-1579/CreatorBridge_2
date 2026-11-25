"""Vercel Serverless Function entrypoint for CreatorBridge FastAPI Backend."""

import sys
from pathlib import Path

# Ensure backend root is on sys.path so app modules import cleanly
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app

# Vercel's Python runtime automatically detects and wraps ASGI `app`
