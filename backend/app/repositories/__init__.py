"""Repositories package exports and singleton providers."""

from app.repositories.base import BaseRepository
from app.repositories.creator_repository import CreatorRepository
from app.repositories.brand_repository import BrandRepository
from app.repositories.portfolio_repository import PortfolioRepository
from app.repositories.brief_repository import BriefRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.generation_repository import GenerationJobRepository
from app.repositories.verification_repository import VerificationRepository
from app.repositories.brand_preferences_repository import BrandPreferencesRepository
from app.repositories.brand_survey_repository import BrandSurveyRepository
from app.repositories.brand_verification_repository import BrandVerificationRepository
from app.repositories.engagement_repository import EngagementRepository

creator_repository = CreatorRepository()
brand_repository = BrandRepository()
portfolio_repository = PortfolioRepository()
brief_repository = BriefRepository()
project_repository = ProjectRepository()
generation_repository = GenerationJobRepository()
verification_repository = VerificationRepository()
brand_preferences_repository = BrandPreferencesRepository()
brand_survey_repository = BrandSurveyRepository()
brand_verification_repository = BrandVerificationRepository()
engagement_repository = EngagementRepository()

__all__ = [
    "BaseRepository",
    "CreatorRepository",
    "BrandRepository",
    "PortfolioRepository",
    "BriefRepository",
    "ProjectRepository",
    "GenerationJobRepository",
    "VerificationRepository",
    "BrandPreferencesRepository",
    "BrandSurveyRepository",
    "BrandVerificationRepository",
    "EngagementRepository",
    "creator_repository",
    "brand_repository",
    "portfolio_repository",
    "brief_repository",
    "project_repository",
    "generation_repository",
    "verification_repository",
    "brand_preferences_repository",
    "brand_survey_repository",
    "brand_verification_repository",
    "engagement_repository",
]

