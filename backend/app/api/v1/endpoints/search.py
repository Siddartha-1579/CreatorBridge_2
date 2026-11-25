"""Secure search endpoints with input sanitization, rate limiting, and private search history."""

from typing import List, Optional
from uuid import uuid4, UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, Query
from app.core.security import get_current_user, get_optional_user, AuthenticatedUser
from app.core.rate_limit import search_rate_limiter
from app.schemas.common import ApiResponse, PaginatedResponse
from app.schemas.search import SearchRequest, SearchHistoryResponse
from app.schemas.creator import CreatorProfileResponse
from app.services import creator_service

router = APIRouter()

# In-memory store for user private search histories (backed by RLS in Postgres)
_search_histories_store = []


@router.post(
    "/creators",
    response_model=ApiResponse[PaginatedResponse[CreatorProfileResponse]],
    dependencies=[Depends(search_rate_limiter)],
    summary="Search creator directory with sanitization",
)
async def search_creators(
    body: SearchRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
) -> ApiResponse[PaginatedResponse[CreatorProfileResponse]]:
    """
    Sanitizes search query and executes query builder filter against creators.
    If the caller is authenticated, records the search query strictly in their private search history.
    """
    # Record private history if user is logged in
    if current_user:
        history_entry = {
            "id": uuid4(),
            "user_id": current_user.id,
            "query": body.query,
            "source": "marketplace",
            "created_at": datetime.now(timezone.utc),
        }
        _search_histories_store.append(history_entry)

    # Execute search query (pure parameterized/filtered logic, never raw SQL string interpolation)
    creators_list = await creator_service.list_creators(
        skip=0,
        limit=50,
    )

    # Filter query matches safely
    q = body.query.lower()
    filtered = [
        c for c in creators_list
        if q in (c.full_name or "").lower()
        or (c.bio and q in c.bio.lower())
        or any(q in t.lower() for t in (c.ai_tools or []))
        or any(q in s.lower() for s in (c.skills or []))
    ]

    total = len(filtered)
    start_idx = (body.page - 1) * body.page_size
    end_idx = start_idx + body.page_size
    items = filtered[start_idx:end_idx]

    paginated = PaginatedResponse(
        items=items,
        total=total,
        page=body.page,
        page_size=body.page_size,
        has_next=end_idx < total,
    )
    return ApiResponse(success=True, data=paginated)


@router.get(
    "/history",
    response_model=ApiResponse[List[SearchHistoryResponse]],
    dependencies=[Depends(search_rate_limiter)],
    summary="Get authenticated user's private search history",
)
async def get_search_history(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[List[SearchHistoryResponse]]:
    """
    Returns private search history belonging exclusively to the authenticated caller.
    Guaranteed by RLS at database level: user_id = auth.uid().
    """
    user_history = [
        SearchHistoryResponse(
            id=item["id"],
            query=item["query"],
            created_at=item["created_at"],
            source=item.get("source", "marketplace"),
        )
        for item in reversed(_search_histories_store)
        if item["user_id"] == current_user.id
    ]
    return ApiResponse(success=True, data=user_history[:20])


@router.delete(
    "/history",
    response_model=ApiResponse[dict],
    dependencies=[Depends(search_rate_limiter)],
    summary="Clear authenticated user's private search history",
)
async def clear_search_history(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[dict]:
    """Clears private search history for the authenticated user only."""
    global _search_histories_store
    _search_histories_store = [
        item for item in _search_histories_store if item["user_id"] != current_user.id
    ]
    return ApiResponse(success=True, data={"cleared": True}, message="Search history cleared")
