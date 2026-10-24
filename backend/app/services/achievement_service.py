"""Persistent creator achievement, reputation and temporary priority boost ledger.

Achievement reputation is intentionally separate from the trust incident ledger.
Only trusted server-side completion workflows should call record_verified_completion().
"""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from app.core.db import get_db_connection


QUALITY_WEIGHTS = {
    "quality": 0.40,
    "timeliness": 0.25,
    "brief_compliance": 0.20,
    "collaboration": 0.15,
}
MAX_LIFETIME_REPUTATION_BONUS = 5.0
MAX_ACTIVE_BOOST_BONUS = 8.0
MAX_BOOST_SPEND = 100
MIN_BOOST_SPEND = 10
BOOST_HOURS = 24


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_time(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


class AchievementService:
    """SQLite-backed ledger; uses the application's existing persistent DB."""

    def __init__(self) -> None:
        self._ensure_schema()

    def _ensure_schema(self) -> None:
        with get_db_connection() as conn:
            conn.execute(
                """CREATE TABLE IF NOT EXISTS creator_achievement_accounts (
                    creator_id TEXT PRIMARY KEY,
                    lifetime_points INTEGER NOT NULL DEFAULT 0 CHECK(lifetime_points >= 0),
                    available_points INTEGER NOT NULL DEFAULT 0 CHECK(available_points >= 0),
                    spent_points INTEGER NOT NULL DEFAULT 0 CHECK(spent_points >= 0),
                    updated_at TEXT NOT NULL
                )"""
            )
            conn.execute(
                """CREATE TABLE IF NOT EXISTS creator_achievement_events (
                    id TEXT PRIMARY KEY,
                    creator_id TEXT NOT NULL,
                    source_engagement_id TEXT NOT NULL UNIQUE,
                    achievement_score REAL NOT NULL,
                    points_awarded INTEGER NOT NULL CHECK(points_awarded >= 0),
                    evidence_json TEXT NOT NULL,
                    verified_by TEXT NOT NULL,
                    completed_at TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )"""
            )
            conn.execute(
                """CREATE TABLE IF NOT EXISTS creator_priority_boosts (
                    id TEXT PRIMARY KEY,
                    creator_id TEXT NOT NULL,
                    brief_id TEXT,
                    points_spent INTEGER NOT NULL CHECK(points_spent > 0),
                    starts_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'ACTIVE',
                    created_at TEXT NOT NULL
                )"""
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_achievement_events_creator ON creator_achievement_events(creator_id)"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_priority_boost_lookup ON creator_priority_boosts(creator_id, brief_id, status, expires_at)"
            )

    def get_summary(self, creator_id: str) -> Dict[str, Any]:
        now = _now().isoformat()
        with get_db_connection() as conn:
            row = conn.execute(
                "SELECT lifetime_points, available_points, spent_points FROM creator_achievement_accounts WHERE creator_id = ?",
                (creator_id,),
            ).fetchone()
            events = conn.execute(
                """SELECT id, source_engagement_id, achievement_score, points_awarded, evidence_json, completed_at, created_at
                   FROM creator_achievement_events WHERE creator_id = ? ORDER BY created_at DESC LIMIT 20""",
                (creator_id,),
            ).fetchall()
            boosts = conn.execute(
                """SELECT id, brief_id, points_spent, starts_at, expires_at, status
                   FROM creator_priority_boosts WHERE creator_id = ? AND status = 'ACTIVE' AND expires_at > ?
                   ORDER BY expires_at ASC""",
                (creator_id, now),
            ).fetchall()
        values = dict(row) if row else {"lifetime_points": 0, "available_points": 0, "spent_points": 0}

        parsed_events = []
        for item in events:
            d = dict(item)
            ev = {}
            if "evidence_json" in d and d["evidence_json"]:
                try:
                    ev = json.loads(d["evidence_json"])
                except Exception:
                    pass
            d["evidence"] = ev
            parsed_events.append(d)

        return {
            **values,
            "long_term_reputation_bonus": self.long_term_bonus(values["lifetime_points"]),
            "active_boosts": [dict(item) for item in boosts],
            "recent_achievements": parsed_events,
        }

    @staticmethod
    def long_term_bonus(lifetime_points: int) -> float:
        # Capped, gradual ranking benefit; it never changes the trust score.
        return round(min(MAX_LIFETIME_REPUTATION_BONUS, max(0, lifetime_points) / 200.0), 2)

    def ranking_bonus(self, creator_id: str, brief_id: Optional[str]) -> Dict[str, Any]:
        now = _now().isoformat()
        with get_db_connection() as conn:
            row = conn.execute(
                "SELECT lifetime_points FROM creator_achievement_accounts WHERE creator_id = ?",
                (creator_id,),
            ).fetchone()
            active = conn.execute(
                """SELECT COALESCE(MAX(points_spent), 0) AS points_spent
                   FROM creator_priority_boosts
                   WHERE creator_id = ? AND status = 'ACTIVE' AND starts_at <= ? AND expires_at > ?
                     AND (brief_id IS NULL OR brief_id = ?)""",
                (creator_id, now, now, brief_id),
            ).fetchone()
        lifetime_points = int(row["lifetime_points"]) if row else 0
        spent = int(active["points_spent"]) if active else 0
        temporary = round(min(MAX_ACTIVE_BOOST_BONUS, spent * MAX_ACTIVE_BOOST_BONUS / MAX_BOOST_SPEND), 2)
        return {
            "long_term_reputation_bonus": self.long_term_bonus(lifetime_points),
            "temporary_priority_bonus": temporary,
            "lifetime_points": lifetime_points,
            "active_boost": temporary > 0,
        }

    def spend_for_boost(self, creator_id: str, points: int, brief_id: Optional[str]) -> Dict[str, Any]:
        if points < MIN_BOOST_SPEND or points > MAX_BOOST_SPEND:
            raise ValueError(f"Spend between {MIN_BOOST_SPEND} and {MAX_BOOST_SPEND} points per boost.")

        # If scoped to a specific campaign brief, validate the brief exists on the server
        if brief_id:
            with get_db_connection() as conn:
                brief_row = conn.execute(
                    "SELECT id, status FROM campaign_briefs WHERE id = ?",
                    (brief_id,),
                ).fetchone()
                if not brief_row:
                    raise ValueError(f"Target campaign brief '{brief_id}' was not found.")

        now = _now()
        expires = now + timedelta(hours=BOOST_HOURS)
        boost_id = str(uuid4())
        with get_db_connection() as conn:
            conn.execute("BEGIN IMMEDIATE")
            account = conn.execute(
                "SELECT available_points FROM creator_achievement_accounts WHERE creator_id = ?",
                (creator_id,),
            ).fetchone()
            balance = int(account["available_points"]) if account else 0
            if balance < points:
                raise ValueError("Not enough available achievement points.")
            conn.execute(
                "UPDATE creator_achievement_accounts SET available_points = available_points - ?, spent_points = spent_points + ?, updated_at = ? WHERE creator_id = ?",
                (points, points, now.isoformat(), creator_id),
            )
            conn.execute(
                """INSERT INTO creator_priority_boosts
                   (id, creator_id, brief_id, points_spent, starts_at, expires_at, status, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)""",
                (boost_id, creator_id, brief_id, points, now.isoformat(), expires.isoformat(), now.isoformat()),
            )
        return {
            "id": boost_id,
            "creator_id": creator_id,
            "brief_id": brief_id,
            "points_spent": points,
            "starts_at": now.isoformat(),
            "expires_at": expires.isoformat(),
            "status": "ACTIVE",
        }

    def record_verified_completion(
        self,
        *,
        creator_id: str,
        engagement_id: str,
        verified_by: str,
        completed_at: str,
        deadline_at: Optional[str],
        quality_score: float,
        brief_compliance_score: float,
        collaboration_score: float,
        accepted: bool,
    ) -> Dict[str, Any]:
        """Award once per accepted engagement; call only from a trusted server workflow."""
        if not accepted:
            raise ValueError("Only accepted deliverables can earn achievement points.")
        if not verified_by.strip():
            raise ValueError("A verification actor is required.")
        scores = {
            "quality": quality_score,
            "brief_compliance": brief_compliance_score,
            "collaboration": collaboration_score,
        }
        if any(not 0 <= score <= 100 for score in scores.values()):
            raise ValueError("Evidence scores must be between 0 and 100.")
        completed = _parse_time(completed_at)
        deadline = _parse_time(deadline_at) if deadline_at else None
        scores["timeliness"] = 100.0 if deadline and completed <= deadline else 60.0 if deadline else 75.0
        achievement_score = round(sum(scores[k] * QUALITY_WEIGHTS[k] for k in QUALITY_WEIGHTS), 2)
        points = max(0, round(achievement_score * 2))
        now = _now().isoformat()
        evidence = {
            **scores,
            "weights": QUALITY_WEIGHTS,
            "deadline_at": deadline.isoformat() if deadline else None,
            "completed_at": completed.isoformat(),
            "accepted": True,
        }
        event_id = str(uuid4())
        with get_db_connection() as conn:
            conn.execute("BEGIN IMMEDIATE")
            existing = conn.execute(
                "SELECT id, points_awarded, achievement_score FROM creator_achievement_events WHERE source_engagement_id = ?",
                (engagement_id,),
            ).fetchone()
            if existing:
                return {
                    "id": existing["id"],
                    "points_awarded": existing["points_awarded"],
                    "achievement_score": existing["achievement_score"],
                    "duplicate": True,
                }
            conn.execute(
                """INSERT INTO creator_achievement_accounts
                   (creator_id, lifetime_points, available_points, spent_points, updated_at)
                   VALUES (?, 0, 0, 0, ?)
                   ON CONFLICT(creator_id) DO NOTHING""",
                (creator_id, now),
            )
            conn.execute(
                """INSERT INTO creator_achievement_events
                   (id, creator_id, source_engagement_id, achievement_score, points_awarded,
                    evidence_json, verified_by, completed_at, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (event_id, creator_id, engagement_id, achievement_score, points,
                 json.dumps(evidence), verified_by, completed.isoformat(), now),
            )
            conn.execute(
                """UPDATE creator_achievement_accounts
                   SET lifetime_points = lifetime_points + ?, available_points = available_points + ?, updated_at = ?
                   WHERE creator_id = ?""",
                (points, points, now, creator_id),
            )
        return {
            "id": event_id,
            "points_awarded": points,
            "achievement_score": achievement_score,
            "duplicate": False,
        }


achievement_service = AchievementService()
