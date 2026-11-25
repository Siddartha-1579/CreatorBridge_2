"""Schemas for public platform statistics."""

from datetime import datetime, timezone
from pydantic import BaseModel, Field


class PublicStatsResponse(BaseModel):
    """Aggregated, privacy-preserving public platform metrics from live database records."""
    total_creators: int = Field(description="Total registered creators on the platform")
    total_brands: int = Field(description="Total registered brands and agencies")
    total_users: int = Field(description="Total registered unique users")
    total_published_campaigns: int = Field(description="Total publicly published active campaigns")
    total_completed_engagements: int = Field(default=0, description="Total completed or accepted creator-brand engagements")
    total_portfolio_items: int = Field(description="Total published creative portfolio assets")
    total_submissions: int = Field(description="Total verified creative submissions")
    timestamp: str = Field(description="UTC timestamp of the aggregated counts")
