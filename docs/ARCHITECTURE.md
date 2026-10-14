# CreatorBridge — System Architecture & Technical Specifications

**Project Root**: `D:\Project-1579\CreatorBridge_2`  
**GitHub Repository**: `Siddartha-1579/CreatorBridge_2`  
**Live Frontend**: `https://creatorbridge2.vercel.app`  
**Live Backend**: `https://creatorbridge2-production.up.railway.app`

---

## 1. Architectural Overview & Tiers

CreatorBridge is engineered with a strict 4-tier modular architecture ensuring loose coupling, complete type safety, and rigorous security boundaries:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Presentation Tier (React 19 + TypeScript + Vite)        │
│    - Role-Guarded Portals (Creator Hub vs. Brand Hub)      │
│    - Centralized API Service Layer (apiClient.ts)           │
│    - Tailored UI Systems (Tailwind CSS, Lucide, Framer)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / REST (Bearer JWT)
┌──────────────────────────────▼──────────────────────────────┐
│ 2. API Routing & Security Boundary (FastAPI 0.115)          │
│    - Unified Response Envelope (ApiResponse[T])             │
│    - JWT Token Verification & RBAC Dependencies             │
│    - Broken Object-Level Authorization Engine (BOLA)        │
│    - Cloudflare Turnstile Bot Defense                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Typed Service Calls
┌──────────────────────────────▼──────────────────────────────┐
│ 3. Domain Logic & Application Services                     │
│    - Brief & Campaign Service (Lifecycle, Validation)       │
│    - CPM Reward Calculator & Pool Limiter                   │
│    - Creator Matching & Trust Calculation Engine            │
│    - Multi-Provider Generative AI Gateway                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Repositories & Adapters
┌──────────────────────────────▼──────────────────────────────┐
│ 4. Persistence & External Integrations                      │
│    - PostgreSQL (Supabase RLS) / SQLite (Local Dev & Test)  │
│    - Supabase Storage & Local Fallback Asset Serving        │
│    - External AI Models (Gemini 2.5, Claude 3.5, OpenAI)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. API Routes Matrix (`/api/v1`)

The FastAPI backend exposes structured endpoints wrapped in standard envelopes (`{"success": true, "data": ...}`):

### Authentication & Account (`/api/v1/auth`)
- `POST /auth/register`: Register new Creator or Brand/Agency account. Enforces that `ADMIN` role cannot be self-registered.
- `POST /auth/login`: Authenticate credentials, return JWT access token and user identity.
- `POST /auth/verify-turnstile`: Validate human verification token against Cloudflare Turnstile API.
- `GET /auth/me`: Retrieve currently authenticated user context and profile.

### Campaign Briefs & Content Rewards (`/api/v1/campaigns`)
- `GET /campaigns`: List public marketplace campaigns with filters (category, content type, budget).
- `POST /campaigns`: Create campaign brief in `DRAFT` status (Brand only).
- `GET /campaigns/{id}`: Retrieve campaign details. Drafts are restricted to owning brands.
- `PUT /campaigns/{id}`: Update campaign details and creative parameters (Brand owner only).
- `POST /campaigns/{id}/publish`: Pre-flight validate and transition campaign to `PUBLISHED` status.
- `POST /campaigns/{id}/pause` & `POST /campaigns/{id}/resume`: Pause/resume submission acceptance.
- `POST /campaigns/{id}/join`: Creator enrolls in active reward campaign.
- `GET /campaigns/{id}/participation`: Creator inspects their own enrollment status.
- `GET /campaigns/{id}/participants`: View campaign participants. Owning brand sees full roster; creators see strictly their own record; competing brands receive `403 Forbidden`.
- `POST /campaigns/{id}/submissions`: Creator submits short-form video clip, AI tools, and self-reported views.
- `GET /campaigns/{id}/submissions`: List submissions. Brand owner sees all; creators see strictly their own.
- `GET /campaigns/submissions/my`: Creator queries all their submitted clips across campaigns.
- `PATCH /campaigns/submissions/{id}/review`: Brand owner approves, rejects, or requests revisions on a clip. Calculates reward and caps payout against remaining campaign budget pool.
- `GET /campaigns/{id}/analytics`: Real-time CPM spend, views tracked, and creator leaderboard (Brand owner only).
- `GET /campaigns/community/posts`: Public / Creator list of brand updates and asset packs.
- `POST /campaigns/community/posts`: Brand publishes announcement or creative asset pack.
- `POST /campaigns/community/posts/{id}/like`: Toggle like on community post.
- `DELETE /campaigns/community/posts/{id}`: Brand deletes post (Authoring brand owner only).

### Creator Portfolios & Discovery (`/api/v1/creators`)
- `GET /creators`: List verified creators with filters (AI tools, specializations, trust tiers).
- `GET /creators/{id}`: Retrieve detailed public creator profile and portfolio showcase.
- `PUT /creators/profile`: Update creator bio, tools, rates, and specializations.
- `POST /creators/portfolio`: Add structured generative AI project with workflow steps and model checkpoints.

---

## 3. Database Schema & Models

Data models are persisted with SQLAlchemy / SQLModel:

1. **`users`**:
   - `id` (UUID / text PK), `email`, `hashed_password`, `role` (`CREATOR`, `BRAND`, `AGENCY`, `ADMIN`), `is_active`, `created_at`.
2. **`creator_profiles`**:
   - `id` (UUID PK), `user_id` (FK), `display_name`, `bio`, `specializations` (JSON array), `ai_tools` (JSON array), `trust_score` (int 0-100), `is_verified` (bool).
3. **`brand_profiles`**:
   - `id` (UUID PK), `user_id` (FK), `company_name`, `industry`, `website`, `logo_url`, `is_verified` (bool).
4. **`campaign_briefs`**:
   - `id` (UUID PK), `brand_id` (FK to brand profile or user), `title`, `description`, `category`, `status` (`DRAFT`, `PUBLISHED`, `PAUSED`, `COMPLETED`), `cpm_rate_cents`, `total_budget_cents`, `paid_pool_cents`, `views_count`, `creative_rules` (JSON), `ai_tools_required` (JSON).
5. **`campaign_participants`**:
   - `id` (UUID PK), `brief_id` (FK), `creator_id` (FK), `joined_at`, `status`.
6. **`clip_submissions`**:
   - `id` (UUID PK), `brief_id` (FK), `creator_id` (FK), `brand_id` (FK), `clip_url`, `platform` (`TIKTOK`, `INSTAGRAM`, `YOUTUBE_SHORTS`), `title`, `ai_tools` (JSON), `views_count`, `earned_cents`, `status` (`PENDING_REVIEW`, `APPROVED`, `REVISION_REQUESTED`, `REJECTED`), `feedback`.
7. **`brand_community_posts`**:
   - `id` (UUID PK), `brand_id` (FK), `title`, `content`, `category`, `media_url`, `likes_count`, `pinned`, `created_at`.

---

## 4. Security & Authorization Architecture

### Authentication & Token Flow
- Statistically sound JWT Bearer tokens signed with HMAC-SHA256.
- In local development and automated test runs, deterministic tokens (`Bearer dev-{user_id}`) enable instantaneous, isolated testing without external auth dependencies.

### Object-Level Authorization (BOLA Prevention)
In [`brief_service.py`](file:///D:/Project-1579/CreatorBridge_2/backend/app/services/brief_service.py), authorization is enforced through `_is_brand_owner(brief_brand_id, current_user_id)`:
- Competing brands attempting to read another brand's submissions, analytics, or draft campaigns receive `403 Forbidden`.
- Creators querying `/campaigns/{id}/submissions` or `/campaigns/{id}/participants` receive strictly records matching their own identity.
- Community posts can only be deleted by the authoring brand.

### CPM & Reward Integrity
- Creator-submitted initial views are labeled strictly as self-reported and never directly translated into financial payout.
- Approved payouts require explicit brand review with audited `verified_views`.
- Reward calculations are capped by remaining campaign budget (`total_budget_cents - paid_pool_cents`).
- Rejecting or requesting revisions on a clip resets `earned_cents = 0` and decrements the campaign's aggregated paid pool.
- Negative view counts or payouts are rejected by schema validation (`422 Unprocessable Content`).

---

## 5. Multi-Provider AI Gateway

The AI Gateway provides a unified interface across generative model providers:
- **Supported Providers**: Google Gemini (primary default), Anthropic Claude, OpenAI GPT-4o.
- **Failover & Resilience**: If an API key is not configured, the gateway gracefully falls back to deterministic rule synthesis so application workflows remain testable and interactive.
- **Prompt Engineering**: Structured prompts guide LLMs to return strict JSON matching Pydantic response schemas.

---

## 6. Deployment & Environment Strategy

- **Frontend**: Hosted on Vercel (`https://creatorbridge2.vercel.app`) with SPA fallback rewrites.
- **Backend**: Hosted on Railway (`https://creatorbridge2-production.up.railway.app`) running Uvicorn.
- **CORS**: Configured in FastAPI middleware to whitelist production Vercel origins, localhost ports (`5173`, `3000`), and Railway endpoints.
- **Secrets Management**: Excluded from Git tracking via `.gitignore`. Production configurations are injected via host environment variables.
