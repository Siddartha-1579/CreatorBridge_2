"""AI analysis and assessment provider interface."""

from abc import abstractmethod
from app.integrations.ai.base import (
    BaseAIProvider,
    AnalysisRequest,
    AnalysisResult,
)


class AnalysisProvider(BaseAIProvider):
    """Abstract interface for AI evaluation, portfolio assessment, and brief intelligence."""

    @abstractmethod
    async def analyze(self, request: AnalysisRequest) -> AnalysisResult:
        """Performs structured analytical inference over portfolio items or briefs."""
        pass
