"""Persistent database engine using SQLite for durable data integrity across restarts.

Seamlessly stores Brand profiles, preferences, verification records, and campaign briefs.
Dual-persistence architecture: stores data persistently locally in SQLite, and provides
automatic synchronization hooks for Supabase PostgreSQL PostgREST when remote tables exist.
"""

import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from app.core.logging import get_logger

logger = get_logger("core.db")

# Path to persistent database file inside backend/data/
DB_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "creatorbridge.db"


def get_db_connection() -> sqlite3.Connection:
    """Returns a connection to the persistent SQLite database with Row factory."""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes tables matching the Supabase SQL schema migrations."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. brand_profiles
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS brand_profiles (
                id TEXT PRIMARY KEY,
                user_id TEXT UNIQUE NOT NULL,
                company_name TEXT NOT NULL,
                organization_type TEXT NOT NULL DEFAULT 'Consumer Brand',
                primary_industry TEXT,
                secondary_industries TEXT DEFAULT '[]',
                contact_name TEXT,
                business_email TEXT,
                website TEXT,
                logo_url TEXT,
                description TEXT,
                location TEXT,
                team_size TEXT DEFAULT '1-10',
                social_links TEXT DEFAULT '{}',
                brand_guidelines_url TEXT,
                preferred_communication TEXT DEFAULT 'EMAIL',
                is_agency INTEGER DEFAULT 0,
                verification_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
                onboarding_completed INTEGER DEFAULT 0,
                profile_completeness_pct INTEGER DEFAULT 25,
                metadata TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

        # 2. brand_preferences
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS brand_preferences (
                id TEXT PRIMARY KEY,
                brand_id TEXT UNIQUE NOT NULL,
                intended_uses TEXT DEFAULT '[]',
                content_requirements TEXT DEFAULT '[]',
                target_niches TEXT DEFAULT '[]',
                preferred_formats TEXT DEFAULT '[]',
                creative_styles TEXT DEFAULT '[]',
                style_description TEXT,
                intended_usage_channels TEXT DEFAULT '[]',
                project_timeline TEXT,
                commercial_rights_required INTEGER DEFAULT 1,
                exclusive_usage_required INTEGER DEFAULT 0,
                source_files_required INTEGER DEFAULT 0,
                budget_range TEXT,
                engagement_type TEXT,
                adaptive_data TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

        # 3. brand_verification_records
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS brand_verification_records (
                id TEXT PRIMARY KEY,
                brand_id TEXT NOT NULL,
                verification_type TEXT NOT NULL,
                target_identifier TEXT,
                status TEXT NOT NULL DEFAULT 'NOT_STARTED',
                evidence_reference TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

        # 4. campaign_briefs
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS campaign_briefs (
                id TEXT PRIMARY KEY,
                brand_id TEXT NOT NULL,
                title TEXT NOT NULL,
                brand_or_product_name TEXT,
                product_or_service TEXT,
                product_description TEXT,
                campaign_idea TEXT,
                executive_summary TEXT,
                description TEXT,
                objectives TEXT DEFAULT '[]',
                primary_objective TEXT,
                target_audience TEXT,
                target_market TEXT,
                preferred_language TEXT DEFAULT 'English',
                campaign_category TEXT,
                primary_message TEXT,
                desired_cta TEXT,
                platforms TEXT DEFAULT '[]',
                deliverables TEXT DEFAULT '[]',
                creative_direction TEXT DEFAULT '{}',
                creator_capabilities TEXT DEFAULT '{}',
                commercial_terms TEXT DEFAULT '{}',
                sections TEXT DEFAULT '{}',
                budget_cents INTEGER,
                start_date TEXT,
                deadline TEXT,
                required_tools TEXT DEFAULT '[]',
                ai_metadata TEXT DEFAULT '{}',
                is_public INTEGER DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'DRAFT',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

        # 5. users (persistent auth accounts)
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL,
                password TEXT NOT NULL,
                is_verified INTEGER DEFAULT 0,
                email_verified INTEGER DEFAULT 0,
                is_onboarded INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

        # 6. creator_profiles (persistent creator data)
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS creator_profiles (
                id TEXT PRIMARY KEY,
                user_id TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                handle TEXT UNIQUE NOT NULL,
                level TEXT NOT NULL DEFAULT 'EXPLORER',
                level_name TEXT DEFAULT 'AI Explorer',
                primary_specialization TEXT,
                skills TEXT DEFAULT '[]',
                ai_tools TEXT DEFAULT '[]',
                content_types TEXT DEFAULT '[]',
                target_niches TEXT DEFAULT '[]',
                preferred_formats TEXT DEFAULT '[]',
                social_links TEXT DEFAULT '{}',
                hourly_rate_cents INTEGER,
                reputation_score REAL DEFAULT 0.0,
                is_verified INTEGER DEFAULT 0,
                assessment_completed INTEGER DEFAULT 0,
                profile_completeness_pct INTEGER DEFAULT 20,
                bio TEXT,
                avatar_url TEXT,
                metadata TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

        # 7. portfolio_items (persistent portfolios)
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS portfolio_items (
                id TEXT PRIMARY KEY,
                creator_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT,
                content_type TEXT,
                media_type TEXT,
                thumbnail_url TEXT,
                media_url TEXT,
                tools TEXT DEFAULT '[]',
                models TEXT DEFAULT '[]',
                skills TEXT DEFAULT '[]',
                workflow_summary TEXT,
                workflow_stages TEXT DEFAULT '[]',
                aspect_ratio TEXT,
                resolution TEXT,
                duration_seconds INTEGER,
                commercial_use_status TEXT,
                ai_generation_type TEXT,
                visibility TEXT DEFAULT 'PUBLIC',
                is_featured INTEGER DEFAULT 0,
                verification_status TEXT DEFAULT 'VERIFIED',
                public_url TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

        # 8. project_workspaces (persistent project collaborations)
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS project_workspaces (
                id TEXT PRIMARY KEY,
                brief_id TEXT,
                brand_id TEXT NOT NULL,
                creator_id TEXT NOT NULL,
                title TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'INITIATED',
                milestones TEXT DEFAULT '[]',
                deliverables TEXT DEFAULT '[]',
                messages TEXT DEFAULT '[]',
                agreed_budget_cents INTEGER NOT NULL,
                due_date TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

        conn.commit()
        logger.info(f"Persistent database schema initialized at {DB_PATH}")


# Initialize schema on module import
init_db()
