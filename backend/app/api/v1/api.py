"""API v1 router aggregator."""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    creators,
    brands,
    portfolios,
    briefs,
    matches,
    projects,
    generation,
    search,
    onboarding,
    ai,
    surveys,
    trust,
    ai_intelligence,
)

api_v1_router = APIRouter()

api_v1_router.include_router(health.router, tags=["Health"])
api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(onboarding.router, prefix="/onboarding", tags=["Creator Onboarding"])
api_v1_router.include_router(surveys.router, prefix="/surveys", tags=["Adaptive Surveys"])
api_v1_router.include_router(trust.router, prefix="/trust", tags=["Trust & Reliability"])
api_v1_router.include_router(search.router, prefix="/search", tags=["Search"])
api_v1_router.include_router(creators.router, prefix="/creators", tags=["Creators"])
api_v1_router.include_router(brands.router, prefix="/brands", tags=["Brands"])
api_v1_router.include_router(portfolios.router, prefix="/portfolios", tags=["Portfolios"])
api_v1_router.include_router(briefs.router, prefix="/briefs", tags=["Briefs"])
api_v1_router.include_router(matches.router, prefix="/matches", tags=["Matching"])
api_v1_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_v1_router.include_router(generation.router, prefix="/generation", tags=["AI Generation"])
api_v1_router.include_router(ai.router, prefix="/ai", tags=["AI Infrastructure"])
api_v1_router.include_router(ai_intelligence.router, prefix="/ai", tags=["AI Intelligence"])


