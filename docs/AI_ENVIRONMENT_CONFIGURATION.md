# HacXLerate 2026: AI Infrastructure & Environment Configuration Guide

This document defines the central AI environment configuration system for the **HacXLerate AI Creator Marketplace**.

---

## 1. Architectural Principles

1. **Vendor Decoupling via Provider Gateway**:
   The application never binds directly to proprietary vendor SDKs inside business logic. All modalities route through `app.integrations.ai.gateway.AIProviderGateway`.
2. **Strict Server-Side Security**:
   AI provider keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `RUNWAY_API_KEY`, `ELEVENLABS_API_KEY`, etc.) are **server-side only**. They must never be prefixed with `VITE_` or bundled into client code.
3. **Independent Modality Resilience**:
   A failure, missing key, or rate limit in one modality (e.g., ElevenLabs Voice) does not compromise other modalities (e.g., OpenAI Text or Matching Engine).
4. **Deterministic Fallbacks**:
   When external API keys are not supplied in development or evaluation environments, the system automatically falls back to local high-fidelity simulation engines without throwing unhandled exceptions.

---

## 2. Configuration Reference

### 2.1 Text & Structured Reasoning
| Environment Variable | Default | Description | Fallback Behavior |
|---|---|---|---|
| `AI_PROVIDER` | `openai` | Selected provider (`openai`, `anthropic`, `fallback`) | Local heuristic generation |
| `OPENAI_API_KEY` | `""` | Primary OpenAI API Key (`sk-proj-...`) | Uses local brief synthesis engine |
| `OPENAI_MODEL` | `gpt-4o-mini` | Default OpenAI reasoning model | Simulated creative brief generation |
| `ANTHROPIC_API_KEY` | `""` | Anthropic Claude API Key (`sk-ant-...`) | Falls back to OpenAI if available |
| `ANTHROPIC_MODEL` | `claude-3-5-sonnet-20241022` | Claude 3.5 Sonnet model | N/A |
| `AI_REQUEST_TIMEOUT_SECONDS` | `30` | Timeout ceiling for external API calls | Prevents thread blocking |
| `AI_MAX_RETRIES` | `3` | Exponential backoff retry attempts for 429/5xx | Safe retry with jitter |
| `AI_MAX_INPUT_CHARS` | `12000` | Input character limit on user prompts | Returns HTTP 422 if exceeded |

### 2.2 Image Generation
| Environment Variable | Default | Description | Fallback Behavior |
|---|---|---|---|
| `IMAGE_PROVIDER` | `openai` | Provider (`openai`, `stability`, `fal`, `fallback`) | Local high-res SVG canvas generator |
| `IMAGE_API_KEY` | `""` | Dedicated Image generation key (defaults to `OPENAI_API_KEY`) | Synthetic artwork generation |
| `IMAGE_MODEL` | `dall-e-3` | Model identifier (e.g. `dall-e-3`, `flux-schnell`) | Local rendered asset |
| `STABILITY_API_KEY` | `""` | Stability AI API key | Falls back to OpenAI or local |
| `FAL_AI_API_KEY` | `""` | Fal.ai API key | Falls back to OpenAI or local |

### 2.3 Video Generation
| Environment Variable | Default | Description | Fallback Behavior |
|---|---|---|---|
| `VIDEO_PROVIDER` | `runway` | Provider (`runway`, `fallback`) | Local cinematic preview generator |
| `VIDEO_API_KEY` | `""` | Video generation API key (defaults to `RUNWAY_API_KEY`) | Synthetic video render pipeline |
| `VIDEO_MODEL` | `gen3a_turbo` | Runway Gen-3 Alpha model | Preview motion loop simulation |
| `RUNWAY_API_KEY` | `""` | RunwayML API key | Local async task simulator |

### 2.4 Voiceover & Audio
| Environment Variable | Default | Description | Fallback Behavior |
|---|---|---|---|
| `VOICE_PROVIDER` | `elevenlabs` | Voice provider (`elevenlabs`, `openai`, `fallback`) | Synthetic audio tone waveform |
| `VOICE_API_KEY` | `""` | Dedicated Voice key (defaults to `ELEVENLABS_API_KEY`) | Local audio synthesizer |
| `VOICE_MODEL` | `eleven_multilingual_v2` | ElevenLabs multilingual model | Synthetic MP3 generator |
| `ELEVENLABS_API_KEY` | `""` | ElevenLabs API key | Local audio generator |

### 2.5 Semantic Matching & Embeddings
| Environment Variable | Default | Description | Fallback Behavior |
|---|---|---|---|
| `EMBEDDING_PROVIDER` | `openai` | Embeddings provider (`openai`, `fallback`) | Local TF-IDF & Cosine Similarity |
| `EMBEDDING_API_KEY` | `""` | Embedding API Key (defaults to `OPENAI_API_KEY`) | Heuristic 7-factor matcher |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | OpenAI vector embedding model (1536 dims) | Multi-criteria token vectorizer |

---

## 3. Modality Readiness & Status API

The backend exposes a public/non-sensitive readiness inspection endpoint:

```http
GET /api/v1/ai/status
```

Response structure:
```json
{
  "success": true,
  "data": {
    "text": { "provider": "openai", "status": "READY", "model": "gpt-4o-mini" },
    "image": { "provider": "openai", "status": "UNCONFIGURED", "model": "dall-e-3" },
    "video": { "provider": "runway", "status": "UNCONFIGURED", "model": "gen3a_turbo" },
    "voice": { "provider": "elevenlabs", "status": "UNCONFIGURED", "model": "eleven_multilingual_v2" },
    "embedding": { "provider": "openai", "status": "READY", "model": "text-embedding-3-small" }
  }
}
```

**Status Values**:
- `READY`: Valid credentials configured and service operational.
- `UNCONFIGURED`: API keys not supplied; graceful local fallback engine active.
- `RATE_LIMITED`: Provider throttled or credit exhausted; falls back gracefully.
- `DEGRADED`: Provider intermittent.

---

## 4. Security & Safety Rules

1. **Never pass API keys in frontend headers or code**. All API requests go to `/api/v1/...` on the backend server.
2. **Sanitize Prompt Inputs**: Character ceiling `AI_MAX_INPUT_CHARS` protects against denial-of-wallet attacks.
3. **No Key Leakage in Logs**: Loggers mask keys to the first 4 characters and length (e.g. `sk-p...[32 chars]`).
