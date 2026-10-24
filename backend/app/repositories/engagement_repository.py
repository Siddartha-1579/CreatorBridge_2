"""Persistent engagement repository using SQLite for durable multi-stage collaboration records."""

import json
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.schemas.engagement import (
    EngagementResponse,
    EngagementDetailResponse,
    EngagementStatus,
    ProductionProgressStatus,
    EngagementScopeTerms,
    EngagementDeliverableSubmissionResponse,
    EngagementProgressUpdateResponse,
    EngagementTimelineEventResponse,
    ShortlistCreatorItem,
)
from app.core.db import get_db_connection
from app.core.logging import get_logger

logger = get_logger("repositories.engagement")


def _parse_dt(val: Optional[str]) -> Optional[datetime]:
    if not val:
        return None
    try:
        dt = datetime.fromisoformat(val)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def _row_to_engagement(row: Any) -> EngagementResponse:
    keys = row.keys()
    prop_terms = json.loads(row["proposed_terms"]) if row["proposed_terms"] else {}
    conf_terms = json.loads(row["confirmed_terms"]) if row["confirmed_terms"] else {}

    return EngagementResponse(
        id=UUID(row["id"]),
        brief_id=row["brief_id"],
        brand_id=row["brand_id"],
        creator_id=row["creator_id"],
        status=EngagementStatus(row["status"]),
        production_status=ProductionProgressStatus(row["production_status"] or "NOT_STARTED"),
        proposed_terms=EngagementScopeTerms(**prop_terms) if prop_terms else EngagementScopeTerms(),
        confirmed_terms=EngagementScopeTerms(**conf_terms) if conf_terms else EngagementScopeTerms(),
        brand_confirmed_at=_parse_dt(row["brand_confirmed_at"]),
        brand_confirmed_by=row["brand_confirmed_by"],
        creator_confirmed_at=_parse_dt(row["creator_confirmed_at"]),
        creator_confirmed_by=row["creator_confirmed_by"],
        invitation_message=row["invitation_message"],
        decline_reason=row["decline_reason"],
        cancellation_reason=row["cancellation_reason"],
        cancelled_by=row["cancelled_by"],
        cancelled_at=_parse_dt(row["cancelled_at"]),
        completed_at=_parse_dt(row["completed_at"]),
        completed_by=row["completed_by"],
        brief_title=row["brief_title"] if "brief_title" in keys else None,
        brand_name=row["brand_name"] if "brand_name" in keys else None,
        creator_name=row["creator_name"] if "creator_name" in keys else None,
        creator_handle=row["creator_handle"] if "creator_handle" in keys else None,
        creator_avatar_url=row["creator_avatar_url"] if "creator_avatar_url" in keys else None,
        created_at=_parse_dt(row["created_at"]) or datetime.now(timezone.utc),
        updated_at=_parse_dt(row["updated_at"]) or datetime.now(timezone.utc),
    )


def _row_to_submission(row: Any) -> EngagementDeliverableSubmissionResponse:
    return EngagementDeliverableSubmissionResponse(
        id=UUID(row["id"]),
        engagement_id=UUID(row["engagement_id"]),
        creator_id=row["creator_id"],
        version_number=row["version_number"],
        title=row["title"],
        media_url=row["media_url"],
        thumbnail_url=row["thumbnail_url"],
        file_format=row["file_format"],
        submission_notes=row["submission_notes"],
        review_decision=row["review_decision"],
        review_notes=row["review_notes"],
        reviewed_by=row["reviewed_by"],
        reviewed_at=_parse_dt(row["reviewed_at"]),
        created_at=_parse_dt(row["created_at"]) or datetime.now(timezone.utc),
        updated_at=_parse_dt(row["updated_at"]) or datetime.now(timezone.utc),
    )


def _row_to_update(row: Any) -> EngagementProgressUpdateResponse:
    return EngagementProgressUpdateResponse(
        id=UUID(row["id"]),
        engagement_id=UUID(row["engagement_id"]),
        sender_id=row["sender_id"],
        sender_role=row["sender_role"],
        production_status=row["production_status"],
        content=row["content"],
        blocker_details=row["blocker_details"],
        created_at=_parse_dt(row["created_at"]) or datetime.now(timezone.utc),
    )


def _row_to_timeline(row: Any) -> EngagementTimelineEventResponse:
    return EngagementTimelineEventResponse(
        id=UUID(row["id"]),
        engagement_id=UUID(row["engagement_id"]),
        actor_id=row["actor_id"],
        actor_role=row["actor_role"],
        action=row["action"],
        from_status=row["from_status"],
        to_status=row["to_status"],
        details=row["details"],
        created_at=_parse_dt(row["created_at"]) or datetime.now(timezone.utc),
    )


class EngagementRepository(BaseRepository[EngagementResponse]):
    """Data access layer for creator engagements with relational SQLite backing."""

    async def get_by_id(self, id: UUID) -> Optional[EngagementResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT e.*,
                       b.title as brief_title,
                       b.brand_or_product_name as brand_name,
                       c.full_name as creator_name,
                       c.handle as creator_handle,
                       c.avatar_url as creator_avatar_url
                FROM creator_engagements e
                LEFT JOIN campaign_briefs b ON e.brief_id = b.id
                LEFT JOIN creator_profiles c ON (e.creator_id = c.id OR e.creator_id = c.user_id)
                WHERE e.id = ?
                """,
                (str(id),),
            )
            row = cursor.fetchone()
            if not row:
                return None
            return _row_to_engagement(row)

    async def get_by_brief_and_creator(self, brief_id: str, creator_id: str) -> Optional[EngagementResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT e.*,
                       b.title as brief_title,
                       b.brand_or_product_name as brand_name,
                       c.full_name as creator_name,
                       c.handle as creator_handle,
                       c.avatar_url as creator_avatar_url
                FROM creator_engagements e
                LEFT JOIN campaign_briefs b ON e.brief_id = b.id
                LEFT JOIN creator_profiles c ON (e.creator_id = c.id OR e.creator_id = c.user_id)
                WHERE e.brief_id = ? AND (e.creator_id = ? OR c.user_id = ? OR c.id = ?)
                """,
                (str(brief_id), str(creator_id), str(creator_id), str(creator_id)),
            )
            row = cursor.fetchone()
            if not row:
                return None
            return _row_to_engagement(row)

    async def list_by_brief(self, brief_id: str, status: Optional[EngagementStatus] = None) -> List[EngagementResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            if status:
                cursor.execute(
                    """
                    SELECT e.*,
                           b.title as brief_title,
                           b.brand_or_product_name as brand_name,
                           c.full_name as creator_name,
                           c.handle as creator_handle,
                           c.avatar_url as creator_avatar_url
                    FROM creator_engagements e
                    LEFT JOIN campaign_briefs b ON e.brief_id = b.id
                    LEFT JOIN creator_profiles c ON (e.creator_id = c.id OR e.creator_id = c.user_id)
                    WHERE e.brief_id = ? AND e.status = ?
                    ORDER BY e.created_at DESC
                    """,
                    (str(brief_id), status.value),
                )
            else:
                cursor.execute(
                    """
                    SELECT e.*,
                           b.title as brief_title,
                           b.brand_or_product_name as brand_name,
                           c.full_name as creator_name,
                           c.handle as creator_handle,
                           c.avatar_url as creator_avatar_url
                    FROM creator_engagements e
                    LEFT JOIN campaign_briefs b ON e.brief_id = b.id
                    LEFT JOIN creator_profiles c ON (e.creator_id = c.id OR e.creator_id = c.user_id)
                    WHERE e.brief_id = ?
                    ORDER BY e.created_at DESC
                    """,
                    (str(brief_id),),
                )
            return [_row_to_engagement(row) for row in cursor.fetchall()]

    async def list_by_brand(self, brand_id: str, brief_id: Optional[str] = None, status: Optional[EngagementStatus] = None) -> List[EngagementResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = """
                SELECT e.*,
                       b.title as brief_title,
                       b.brand_or_product_name as brand_name,
                       c.full_name as creator_name,
                       c.handle as creator_handle,
                       c.avatar_url as creator_avatar_url
                FROM creator_engagements e
                LEFT JOIN campaign_briefs b ON e.brief_id = b.id
                LEFT JOIN creator_profiles c ON (e.creator_id = c.id OR e.creator_id = c.user_id)
                WHERE (e.brand_id = ? OR b.brand_id = ?)
            """
            params: List[Any] = [str(brand_id), str(brand_id)]
            if brief_id:
                query += " AND e.brief_id = ?"
                params.append(str(brief_id))
            if status:
                query += " AND e.status = ?"
                params.append(status.value)
            query += " ORDER BY e.updated_at DESC"

            cursor.execute(query, tuple(params))
            return [_row_to_engagement(row) for row in cursor.fetchall()]

    async def list_by_creator(self, creator_id: str, status: Optional[EngagementStatus] = None) -> List[EngagementResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = """
                SELECT e.*,
                       b.title as brief_title,
                       b.brand_or_product_name as brand_name,
                       c.full_name as creator_name,
                       c.handle as creator_handle,
                       c.avatar_url as creator_avatar_url
                FROM creator_engagements e
                LEFT JOIN campaign_briefs b ON e.brief_id = b.id
                LEFT JOIN creator_profiles c ON (e.creator_id = c.id OR e.creator_id = c.user_id)
                WHERE (e.creator_id = ? OR c.user_id = ? OR c.id = ?)
            """
            params: List[Any] = [str(creator_id), str(creator_id), str(creator_id)]
            if status:
                query += " AND e.status = ?"
                params.append(status.value)
            query += " ORDER BY e.updated_at DESC"

            cursor.execute(query, tuple(params))
            return [_row_to_engagement(row) for row in cursor.fetchall()]

    async def create(self, entity: EngagementResponse) -> EngagementResponse:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO creator_engagements (
                    id, brief_id, brand_id, creator_id, status, production_status,
                    proposed_terms, confirmed_terms, brand_confirmed_at, brand_confirmed_by,
                    creator_confirmed_at, creator_confirmed_by, invitation_message,
                    decline_reason, cancellation_reason, cancelled_by, cancelled_at,
                    completed_at, completed_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(entity.id),
                    str(entity.brief_id),
                    str(entity.brand_id),
                    str(entity.creator_id),
                    entity.status.value,
                    entity.production_status.value,
                    json.dumps(entity.proposed_terms.model_dump(mode="json")),
                    json.dumps(entity.confirmed_terms.model_dump(mode="json")),
                    entity.brand_confirmed_at.isoformat() if entity.brand_confirmed_at else None,
                    entity.brand_confirmed_by,
                    entity.creator_confirmed_at.isoformat() if entity.creator_confirmed_at else None,
                    entity.creator_confirmed_by,
                    entity.invitation_message,
                    entity.decline_reason,
                    entity.cancellation_reason,
                    entity.cancelled_by,
                    entity.cancelled_at.isoformat() if entity.cancelled_at else None,
                    entity.completed_at.isoformat() if entity.completed_at else None,
                    entity.completed_by,
                    entity.created_at.isoformat(),
                    entity.updated_at.isoformat(),
                ),
            )
            conn.commit()
        return entity

    async def update(self, id: UUID, updates: Dict[str, Any]) -> Optional[EngagementResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            updates["updated_at"] = datetime.now(timezone.utc).isoformat()
            set_clauses = []
            params = []
            for k, v in updates.items():
                set_clauses.append(f"{k} = ?")
                if isinstance(v, (dict, list)):
                    params.append(json.dumps(v))
                elif isinstance(v, datetime):
                    params.append(v.isoformat())
                elif hasattr(v, "value"):
                    params.append(v.value)
                else:
                    params.append(v)
            params.append(str(id))

            cursor.execute(f"UPDATE creator_engagements SET {', '.join(set_clauses)} WHERE id = ?", tuple(params))
            conn.commit()
        return await self.get_by_id(id)

    async def delete(self, id: UUID) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM creator_engagements WHERE id = ?", (str(id),))
            cursor.execute("DELETE FROM engagement_deliverable_submissions WHERE engagement_id = ?", (str(id),))
            cursor.execute("DELETE FROM engagement_progress_updates WHERE engagement_id = ?", (str(id),))
            cursor.execute("DELETE FROM engagement_timeline_events WHERE engagement_id = ?", (str(id),))
            conn.commit()
        return True

    # -------------------------------------------------------------------------
    # Submissions
    # -------------------------------------------------------------------------
    async def create_submission(self, entity: EngagementDeliverableSubmissionResponse) -> EngagementDeliverableSubmissionResponse:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO engagement_deliverable_submissions (
                    id, engagement_id, creator_id, version_number, title,
                    media_url, thumbnail_url, file_format, submission_notes,
                    review_decision, review_notes, reviewed_by, reviewed_at,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(entity.id),
                    str(entity.engagement_id),
                    str(entity.creator_id),
                    entity.version_number,
                    entity.title,
                    entity.media_url,
                    entity.thumbnail_url,
                    entity.file_format,
                    entity.submission_notes,
                    entity.review_decision,
                    entity.review_notes,
                    entity.reviewed_by,
                    entity.reviewed_at.isoformat() if entity.reviewed_at else None,
                    entity.created_at.isoformat(),
                    entity.updated_at.isoformat(),
                ),
            )
            conn.commit()
        return entity

    async def get_submission_by_id(self, submission_id: UUID) -> Optional[EngagementDeliverableSubmissionResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM engagement_deliverable_submissions WHERE id = ?", (str(submission_id),))
            row = cursor.fetchone()
            if not row:
                return None
            return _row_to_submission(row)

    async def list_submissions(self, engagement_id: UUID) -> List[EngagementDeliverableSubmissionResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM engagement_deliverable_submissions WHERE engagement_id = ? ORDER BY version_number DESC, created_at DESC",
                (str(engagement_id),),
            )
            return [_row_to_submission(row) for row in cursor.fetchall()]

    async def update_submission(self, submission_id: UUID, updates: Dict[str, Any]) -> Optional[EngagementDeliverableSubmissionResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            updates["updated_at"] = datetime.now(timezone.utc).isoformat()
            set_clauses = []
            params = []
            for k, v in updates.items():
                set_clauses.append(f"{k} = ?")
                if isinstance(v, datetime):
                    params.append(v.isoformat())
                else:
                    params.append(v)
            params.append(str(submission_id))
            cursor.execute(f"UPDATE engagement_deliverable_submissions SET {', '.join(set_clauses)} WHERE id = ?", tuple(params))
            conn.commit()
        return await self.get_submission_by_id(submission_id)

    # -------------------------------------------------------------------------
    # Progress Updates & Timeline
    # -------------------------------------------------------------------------
    async def create_progress_update(self, entity: EngagementProgressUpdateResponse) -> EngagementProgressUpdateResponse:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO engagement_progress_updates (
                    id, engagement_id, sender_id, sender_role,
                    production_status, content, blocker_details, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(entity.id),
                    str(entity.engagement_id),
                    str(entity.sender_id),
                    str(entity.sender_role),
                    entity.production_status,
                    entity.content,
                    entity.blocker_details,
                    entity.created_at.isoformat(),
                ),
            )
            conn.commit()
        return entity

    async def list_progress_updates(self, engagement_id: UUID) -> List[EngagementProgressUpdateResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM engagement_progress_updates WHERE engagement_id = ? ORDER BY created_at ASC",
                (str(engagement_id),),
            )
            return [_row_to_update(row) for row in cursor.fetchall()]

    async def create_timeline_event(self, entity: EngagementTimelineEventResponse) -> EngagementTimelineEventResponse:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO engagement_timeline_events (
                    id, engagement_id, actor_id, actor_role, action,
                    from_status, to_status, details, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(entity.id),
                    str(entity.engagement_id),
                    str(entity.actor_id),
                    str(entity.actor_role),
                    entity.action,
                    entity.from_status,
                    entity.to_status,
                    entity.details,
                    entity.created_at.isoformat(),
                ),
            )
            conn.commit()
        return entity

    async def list_timeline_events(self, engagement_id: UUID) -> List[EngagementTimelineEventResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM engagement_timeline_events WHERE engagement_id = ? ORDER BY created_at ASC",
                (str(engagement_id),),
            )
            return [_row_to_timeline(row) for row in cursor.fetchall()]


engagement_repository = EngagementRepository()
