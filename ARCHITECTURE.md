# HACXLERATE 2026 — AI CONTENT CREATOR MARKETPLACE
## SYSTEM ARCHITECTURE & ENGINEERING FOUNDATION

This document defines the architectural blueprint, structural boundaries, and interface contracts for the **HacXLerate 2026 AI Content Creator Marketplace** (Challenge 02).

---

### 1. Conceptual Architecture & Separation of Concerns

The platform adheres to a strict separation of concerns across 5 architectural tiers:

```
[ PRESENTATION TIER ]
React 19 + TypeScript + Vite + Tailwind CSS (Replaceable UI)
        ↓
[ APPLICATION / CLIENT SERVICE TIER ]
apiClient.ts (Unified Error Interception, Bearer Tokens) & Domain Services
        ↓
[ HTTP ROUTING & CONTRACT VALIDATION ]
FastAPI APIRouter (/api/v1/...) & Pydantic Validation Schemas
        ↓
[ DOMAIN SERVICES & APPLICATION LOGIC ]
AuthService, CreatorService, BriefService, MatchingService, GenerationService
        ↓
[ PERSISTENCE & INTEGRATIONS ]
├── Repositories (PostgreSQL / Supabase RLS)
├── Supabase Object Storage (Portfolios, Generated Media)
└── AI Provider Gateway (Multi-Vendor AI Abstraction)
```

**Core Invariants:**
- **Replaceable UI**: The presentation components contain no direct database queries, no secret API keys, and no vendor SDK calls. Future prompts will integrate updated visual systems without touching business logic.
- **Provider-Agnostic AI**: UI and domain services communicate with the `AIProviderGateway` via typed requests, never directly with vendor endpoints.

---

### 2. Frontend Architecture

The frontend is located in `/frontend/src`:

```
frontend/src/
├── types/          # Strict TypeScript contracts (User, Creator, Brief, Match, Asset)
├── lib/            # Infrastructure clients (apiClient.ts, supabase.ts, utils.ts)
├── services/       # Centralized API service layer (auth, creators, brands, briefs, etc.)
├── hooks/          # Reusable behavior (useAuth, useAsync)
├── components/     # UI primitives (Button, Card, Badge, Input, Alert) & common layouts
├── layouts/        # RootLayout, AuthLayout, DashboardLayout
├── pages/          # Route screens (HomePage, Creator & Brand portals, Auth, 404)
├── features/       # Feature domain modules ready for subsequent expansion
├── App.tsx         # Route tree wrapped with AuthProvider
└── main.tsx        # Entry point mounting root
```

**Key Frontend Conventions:**
- **Strict Typing**: Standard interfaces defined in `types/`. No `any` escapes.
- **Replaceable Visual System**: Components consume standard domain models and custom hooks; visual design tokens are abstracted via Tailwind CSS.

---

### 3. Backend Architecture

The backend is built with Python, FastAPI, and Pydantic in `/backend/app`:

```
backend/app/
├── core/           # Centralized BaseSettings, logging, security, and errors
│   ├── config.py       # Pydantic BaseSettings loading from environment
│   ├── logging.py      # Structured redaction logging (masks tokens and keys)
│   ├── errors.py       # Structured error hierarchy & FastAPI exception handlers
│   ├── security.py     # JWT & Supabase auth verification + RBAC dependencies
│   └── database.py     # Connection management
├── models/         # Base domain models (UUID identifiers, UTC timestamps)
├── schemas/        # Pydantic request/response schemas (ApiResponse[T], etc.)
├── repositories/   # Persistence layer abstraction (BaseRepository and domain repos)
├── services/       # Domain business logic (creator, brand, brief, match, generation)
├── integrations/
│   ├── storage/    # StorageProvider abstraction & Supabase Storage adapter
│   └── ai/         # AIProviderGateway & multi-modal provider ABCs
├── api/            # Versioned API routes
│   └── v1/
│       ├── api.py          # Aggregated APIRouter for /api/v1
│       └── endpoints/      # Thin route handlers (health, auth, creators, briefs, etc.)
└── tests/          # Pytest suite validating health, errors, and AI Gateway
```

**Thin Route Handler Pattern:**
```
HTTP Request → Route Handler → Validation Schema → Domain Service → Repository/Gateway → ApiResponse Envelope
```

---

### 4. Database Architecture & Conventions

- **Engine**: PostgreSQL through Supabase.
- **Migration Strategy**: Sequential SQL migration scripts (`backend/migrations/001_initial_schema.sql`).
- **Identifier Strategy**: `UUID` using `gen_random_uuid()` for all primary keys.
- **Timestamps**: All tables include `created_at TIMESTAMPTZ DEFAULT NOW()` and `updated_at TIMESTAMPTZ DEFAULT NOW()` with an automated PostgreSQL trigger.
- **Relational Integrity**: Foreign key constraints with explicit `ON DELETE CASCADE` or `ON DELETE SET NULL`.
- **Row-Level Security (RLS)**: Enabled across all domain tables (`profiles`, `creator_profiles`, `portfolio_items`, `campaign_briefs`, `project_workspaces`, `generation_jobs`).
- **Binary Assets**: Large binary files (images, audio, video) are **never** stored directly in PostgreSQL; records store object storage paths and bucket references.

---

### 5. Storage Architecture

Storage operations are abstracted via `StorageProvider`:

```python
class StorageProvider(ABC):
    async def upload_file(bucket: str, path: str, content: bytes, content_type: str) -> str
    async def get_public_url(bucket: str, path: str) -> str
    async def create_signed_url(bucket: str, path: str, expires_in_seconds: int) -> str
    async def delete_file(bucket: str, path: str) -> bool
```

**Bucket Conventions:**
- `portfolios`: Creator portfolio showcase media.
- `generated-assets`: Outputs produced via the AI Provider Gateway.
- `project-files`: Deliverables and revisions within collaborative workspaces.
- `avatars`: Profile pictures.

---

### 6. AI Provider Gateway

The `AIProviderGateway` decouples application services from external vendor SDKs:

```
AIProviderGateway
├── TextProvider       (e.g., OpenAI, Anthropic, Gemini)
├── ImageProvider      (e.g., Midjourney, Stable Diffusion, FLUX)
├── VideoProvider      (e.g., Runway Gen-3, Luma, Kling, Sora)
├── VoiceProvider      (e.g., ElevenLabs, OpenAI Voice)
├── AudioProvider      (e.g., Suno, Udio)
├── AnalysisProvider   (e.g., Automated Capability & Brief Analysis)
└── EmbeddingProvider  (e.g., Dense vector embeddings for creator matching)
```

**Gateway Responsibilities:**
1. Dynamic provider registration with primary and fallback designation.
2. Standardized typed request and response contracts (`TextGenerationRequest`, `ImageGenerationRequest`, etc.).
3. Explicit error raising via `IntegrationException` when unconfigured.
4. Protection against vendor lock-in.

---

### 7. Authentication & Authorization

- **Authentication Foundation**: Supabase Auth (JWT session tokens).
- **Separation of Concerns**:
  - *Authentication*: "Who is this user?" (verified in `get_current_user`).
  - *Authorization*: "What is this user allowed to do?" (enforced via `require_role([UserRole.CREATOR, ...])`).
- **Roles Supported**: `CREATOR`, `BRAND`, `AGENCY`, `ADMIN`.
- **Client Route Protection**: `ProtectedRoute` on frontend enforces UX routing without substituting for backend authorization.

---

### 8. API Conventions & Error Handling

- **Namespace**: `/api/v1/...`
- **Standard Success Response**:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Operation successful",
    "meta": null
  }
  ```
- **Standard Error Response**:
  ```json
  {
    "success": false,
    "error": {
      "code": "NOT_FOUND",
      "message": "Creator '001' not found",
      "details": {}
    }
  }
  ```
- **Health Check**:
  `GET /api/v1/health`
  ```json
  {
    "status": "ok",
    "version": "1.0.0",
    "environment": "development"
  }
  ```

---

### 9. Environment Variables & Security

- **Strict Secret Segregation**:
  - `frontend/.env`: Only public keys (`VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
  - `backend/.env`: Secret keys (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, AI API keys).
- **Redacting Logger**: Automated regex mask filters tokens, passwords, and API keys before logging.
- **Git Hygiene**: `.env` and secret files are committed to `.gitignore`. `.env.example` templates provided.

---

### 10. Local Development & Validation

#### Prerequisites
- Node.js >= 18
- Python >= 3.11

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Run tests:
```bash
cd backend
python -m pytest app/tests
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Build test:
```bash
cd frontend
npm run build
```

---

### 11. Future Module Integration Strategy

The foundation establishes extension hooks for upcoming master prompts:
1. **Creator Onboarding & Assessment**: Implement domain evaluation algorithms in `creator_service.py` using `AnalysisProvider`.
2. **Brand Brief Builder**: Add AI prompt refinement in `brief_service.py` via `TextProvider`.
3. **Creator Matching Engine**: Expand `matching_service.py` with dense vector similarity via `EmbeddingProvider`.
4. **AI Generation Studio**: Implement background async workers orchestrating `ai_gateway.generate_video`, `generate_image`, etc.
5. **UI/UX Template Integration**: Replace visual components in `/frontend/src/pages/` and `/components/` with zero backend changes.
