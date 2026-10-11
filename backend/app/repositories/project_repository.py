"""Project workspace repository implementation with persistent SQLite storage."""

import json
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.schemas.project import ProjectWorkspaceResponse, ProjectStatus
from app.core.db import get_db_connection
from app.core.logging import get_logger

logger = get_logger("repositories.project")


def _row_to_project(row) -> ProjectWorkspaceResponse:
    created_at_dt = datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(timezone.utc)
    updated_at_dt = datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else datetime.now(timezone.utc)
    due_date_dt = datetime.fromisoformat(row["due_date"]) if row["due_date"] else None

    if created_at_dt.tzinfo is None:
        created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)
    if updated_at_dt.tzinfo is None:
        updated_at_dt = updated_at_dt.replace(tzinfo=timezone.utc)
    if due_date_dt and due_date_dt.tzinfo is None:
        due_date_dt = due_date_dt.replace(tzinfo=timezone.utc)

    status_val = row["status"]
    try:
        status = ProjectStatus(status_val)
    except ValueError:
        status = ProjectStatus.INITIATED

    milestones = json.loads(row["milestones"]) if row["milestones"] else []
    deliverables = json.loads(row["deliverables"]) if row["deliverables"] else []
    messages = json.loads(row["messages"]) if row["messages"] else []

    return ProjectWorkspaceResponse(
        id=UUID(row["id"]),
        brief_id=row["brief_id"],
        brand_id=row["brand_id"],
        creator_id=row["creator_id"],
        title=row["title"],
        status=status,
        milestones=milestones,
        deliverables=deliverables,
        messages=messages,
        agreed_budget_cents=row["agreed_budget_cents"],
        due_date=due_date_dt,
        created_at=created_at_dt,
        updated_at=updated_at_dt,
    )


class ProjectRepository(BaseRepository[ProjectWorkspaceResponse]):
    """Repository handling project workspaces database persistence."""

    async def get_by_id(self, id: UUID) -> Optional[ProjectWorkspaceResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM project_workspaces WHERE id = ?", (str(id),))
            row = cursor.fetchone()
            return _row_to_project(row) if row else None

    async def list_for_user(self, user_id: str, profile_id: Optional[str] = None) -> List[ProjectWorkspaceResponse]:
        u_str = str(user_id)
        p_str = str(profile_id) if profile_id else u_str
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM project_workspaces WHERE brand_id = ? OR creator_id = ? OR creator_id = ? ORDER BY updated_at DESC",
                (u_str, u_str, p_str),
            )
            rows = cursor.fetchall()
            return [_row_to_project(r) for r in rows]

    async def list_all(
        self, skip: int = 0, limit: int = 20, filters: Optional[Dict[str, Any]] = None
    ) -> List[ProjectWorkspaceResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM project_workspaces ORDER BY updated_at DESC LIMIT ? OFFSET ?",
                (limit, skip),
            )
            rows = cursor.fetchall()
            return [_row_to_project(r) for r in rows]

    async def create(self, entity: ProjectWorkspaceResponse) -> ProjectWorkspaceResponse:
        now_str = entity.created_at.isoformat()
        updated_str = entity.updated_at.isoformat()
        due_str = entity.due_date.isoformat() if entity.due_date else None

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO project_workspaces (
                    id, brief_id, brand_id, creator_id, title, status,
                    milestones, deliverables, messages, agreed_budget_cents,
                    due_date, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(entity.id),
                    entity.brief_id,
                    entity.brand_id,
                    entity.creator_id,
                    entity.title,
                    entity.status.value if hasattr(entity.status, "value") else str(entity.status),
                    json.dumps(entity.milestones),
                    json.dumps(entity.deliverables),
                    json.dumps(entity.messages),
                    entity.agreed_budget_cents,
                    due_str,
                    now_str,
                    updated_str,
                ),
            )
            conn.commit()
        return entity

    async def update(self, id: UUID, update_data: Dict[str, Any]) -> Optional[ProjectWorkspaceResponse]:
        existing = await self.get_by_id(id)
        if not existing:
            return None
        existing_dict = existing.model_dump()
        existing_dict.update(update_data)
        existing_dict["updated_at"] = datetime.now(timezone.utc)
        updated_entity = ProjectWorkspaceResponse(**existing_dict)
        return await self.create(updated_entity)

    async def delete(self, id: UUID) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM project_workspaces WHERE id = ?", (str(id),))
            conn.commit()
            return cursor.rowcount > 0
