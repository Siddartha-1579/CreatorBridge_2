"""Support Chatbot Router.

Exposes isolated endpoints for answering CreatorBridge questions and fetching starter prompts.
Publicly accessible so prospective creators and brands can ask platform questions.
"""

from fastapi import APIRouter, Request, Depends, HTTPException, status
from app.schemas.chatbot import (
    ChatbotMessageRequest,
    ChatbotMessageResponse,
    ChatbotSuggestionsResponse,
)
from app.services.chatbot_service import chatbot_service
from app.core.rate_limit import RateLimiter
from app.core.logging import get_logger

logger = get_logger("endpoint.chatbot")

router = APIRouter()

# Rate limit: 20 messages per minute per client IP to prevent abuse while allowing interactive chat
chatbot_limiter = RateLimiter(requests_per_minute=20, prefix="chatbot")


@router.post(
    "/message",
    response_model=ChatbotMessageResponse,
    dependencies=[Depends(chatbot_limiter)],
    summary="Ask a support question about CreatorBridge",
    description="Returns a grounded answer based strictly on verified CreatorBridge documentation.",
)
async def send_chatbot_message(
    payload: ChatbotMessageRequest,
    request: Request,
) -> ChatbotMessageResponse:
    """Answers user inquiries regarding CreatorBridge features, portfolios, briefs, and troubleshooting."""
    try:
        response = await chatbot_service.answer_message(payload)
        return response
    except Exception as e:
        logger.error(f"Error handling chatbot message: {e}", exc_info=True)
        # Return graceful fallback rather than 500 error
        return ChatbotMessageResponse(
            answer=(
                "I apologize, but our platform assistant is currently experiencing high load. "
                "CreatorBridge connects verified AI creators with commercial brands. "
                "Please explore the Discover and Briefs pages or try your question again in a moment."
            ),
            in_scope=True,
            confidence=0.5,
            suggested_questions=[
                "How does creator matching work?",
                "How do I create a creator portfolio?",
                "How does a brand publish a campaign brief?",
            ],
            sources=[],
            fallback_used=True,
        )


@router.get(
    "/suggestions",
    response_model=ChatbotSuggestionsResponse,
    summary="Get starter questions and supported topics",
    description="Returns curated starter prompts and topic areas for the support chatbot widget.",
)
async def get_chatbot_suggestions() -> ChatbotSuggestionsResponse:
    """Returns suggested questions to guide user interactions."""
    return chatbot_service.get_suggestions()
