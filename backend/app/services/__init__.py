"""Services package exports and singleton providers."""

from app.services.base import BaseService
from app.services.auth_service import AuthService
from app.services.creator_service import CreatorService
from app.services.brand_service import BrandService
from app.services.portfolio_service import PortfolioService
from app.services.brief_service import BriefService
from app.services.matching_service import MatchingService
from app.services.project_service import ProjectService
from app.services.generation_service import GenerationService

from app.services.turnstile_service import TurnstileService, turnstile_service
from app.services.audit_service import AuditService, audit_service
from app.services.question_bank import QuestionBankService, question_bank
from app.services.assessment_engine import AssessmentEngine, assessment_engine
from app.services.onboarding_service import OnboardingService, onboarding_service
from app.services.verification_service import VerificationService, verification_service
from app.services.brand_onboarding_service import BrandOnboardingService, brand_onboarding_service
from app.services.ai_brief_service import AIBriefService, ai_brief_service

auth_service = AuthService()
creator_service = CreatorService()
brand_service = BrandService()
portfolio_service = PortfolioService()
brief_service = BriefService()
matching_service = MatchingService()
project_service = ProjectService()
generation_service = GenerationService()

__all__ = [
    "BaseService",
    "AuthService",
    "TurnstileService",
    "AuditService",
    "QuestionBankService",
    "AssessmentEngine",
    "OnboardingService",
    "CreatorService",
    "BrandService",
    "PortfolioService",
    "BriefService",
    "MatchingService",
    "ProjectService",
    "GenerationService",
    "VerificationService",
    "BrandOnboardingService",
    "AIBriefService",
    "auth_service",
    "turnstile_service",
    "audit_service",
    "question_bank",
    "assessment_engine",
    "onboarding_service",
    "creator_service",
    "brand_service",
    "portfolio_service",
    "brief_service",
    "matching_service",
    "project_service",
    "generation_service",
    "verification_service",
    "brand_onboarding_service",
    "ai_brief_service",
]

