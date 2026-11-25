"""Abstract base classes and contracts for the AI Provider Gateway."""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class AIProviderMetadata(BaseModel):
    """Metadata describing a specific AI provider integration."""
    name: str
    version: str
    is_active: bool = True
    supported_models: List[str] = Field(default_factory=list)
    rate_limit_rpm: Optional[int] = None


# --- Modality Specific Request / Result Contracts ---

class TextGenerationRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    max_tokens: int = 1024
    temperature: float = 0.7
    model: Optional[str] = None
    extra_params: Dict[str, Any] = Field(default_factory=dict)


class TextGenerationResult(BaseModel):
    content: str
    tokens_used: int = 0
    model: str
    provider: str
    raw_response: Dict[str, Any] = Field(default_factory=dict)


class ImageGenerationRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    width: int = 1024
    height: int = 1024
    aspect_ratio: Optional[str] = "1:1"
    model: Optional[str] = None
    num_images: int = 1
    extra_params: Dict[str, Any] = Field(default_factory=dict)


class ImageGenerationResult(BaseModel):
    image_urls: List[str]
    model: str
    provider: str
    parameters_used: Dict[str, Any] = Field(default_factory=dict)


class VideoGenerationRequest(BaseModel):
    prompt: str
    source_image_url: Optional[str] = None
    duration_seconds: int = 5
    aspect_ratio: str = "16:9"
    fps: int = 24
    model: Optional[str] = None
    extra_params: Dict[str, Any] = Field(default_factory=dict)


class VideoGenerationResult(BaseModel):
    video_url: str
    duration_seconds: int
    model: str
    provider: str
    parameters_used: Dict[str, Any] = Field(default_factory=dict)


class VoiceGenerationRequest(BaseModel):
    text: str
    voice_id: str
    language: str = "en"
    stability: float = 0.5
    similarity_boost: float = 0.75
    model: Optional[str] = None
    extra_params: Dict[str, Any] = Field(default_factory=dict)


class VoiceGenerationResult(BaseModel):
    audio_url: str
    duration_seconds: Optional[float] = None
    voice_id: str
    provider: str


class AudioGenerationRequest(BaseModel):
    prompt: str
    duration_seconds: int = 15
    model: Optional[str] = None
    extra_params: Dict[str, Any] = Field(default_factory=dict)


class AudioGenerationResult(BaseModel):
    audio_url: str
    duration_seconds: int
    model: str
    provider: str


class AnalysisRequest(BaseModel):
    input_data: Dict[str, Any]
    analysis_type: str
    parameters: Dict[str, Any] = Field(default_factory=dict)


class AnalysisResult(BaseModel):
    analysis_type: str
    score: Optional[float] = None
    insights: List[str] = Field(default_factory=list)
    raw_metrics: Dict[str, Any] = Field(default_factory=dict)
    provider: str


class EmbeddingRequest(BaseModel):
    texts: List[str]
    model: Optional[str] = None


class EmbeddingResult(BaseModel):
    embeddings: List[List[float]]
    dimension: int
    model: str
    provider: str


# --- Base Provider Abstract Class ---

class BaseAIProvider(ABC):
    """Abstract parent class for all AI provider adapters."""

    def __init__(self, metadata: AIProviderMetadata):
        self.metadata = metadata

    @property
    def name(self) -> str:
        return self.metadata.name

    @abstractmethod
    async def is_available(self) -> bool:
        """Verifies if the provider has valid credentials and is reachable."""
        pass
