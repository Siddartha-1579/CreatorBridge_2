# CreatorBridge — System Workflows & Architecture Diagrams

This document illustrates the end-to-end workflows, role-separated interactions, AI processing layers, and infrastructure architecture powering CreatorBridge.

---

## 1. Complete Campaign Lifecycle

The following sequence details how a brand launches a reward-backed campaign, creators enroll and submit content, and submissions undergo verification and reward credit.

```mermaid
flowchart TD
    subgraph BrandOperations["1. Brand Campaign Formulation"]
        B1["Brand Onboarding & Profile Verification"] --> B2["Create Campaign Brief (Draft)"]
        B2 --> B3["Define CPM Rate, Total Pool & Target Views"]
        B3 --> B4["Configure Creative Rules, AI Tools & Prohibited Elements"]
        B4 --> B5["Pre-Flight Validation Engine"]
        B5 -->|Pass| B6["Publish Campaign Brief"]
        B5 -->|Missing Requirements| B2
    end

    subgraph MarketplaceDiscovery["2. Marketplace & Creator Enrollment"]
        B6 --> M1["Campaign Appears in Public & Creator Discovery"]
        M1 --> C1["Creator Explores Requirements & Deliverables"]
        C1 --> C2["Creator Clicks 'Join Campaign'"]
        C2 --> C3["Creator Enrolled as Participant"]
    end

    subgraph ContentSubmission["3. Creative Production & Clip Submission"]
        C3 --> C4["Creator Produces Video Using Generative AI Tools"]
        C4 --> C5["Creator Publishes to Social Platform (TikTok / Reels / Shorts)"]
        C5 --> C6["Submit Clip URL, AI Tool Stack & Self-Reported Initial Views"]
        C6 --> C7["Status: PENDING_REVIEW (Reward = $0.00)"]
    end

    subgraph BrandReviewAudit["4. Brand Review & Reward Integrity"]
        C7 --> R1["Brand Inspects Clip in Submission Review Queue"]
        R1 --> R2{"Brand Review Decision"}
        R2 -->|Approve| R3["Input Audited Verified Views"]
        R3 --> R4["Calculate Reward: floor(verified_views / 1000 * CPM)"]
        R4 --> R5["Enforce Remaining Pool Cap: min(Reward, Remaining Pool)"]
        R5 --> R6["Status: APPROVED (Earned Reward Credited)"]
        R6 --> R7["Reconcile & Increment Campaign Paid Pool"]
        R2 -->|Revision Requested| R8["Provide Feedback Notes to Creator"]
        R8 --> R9["Status: REVISION_REQUESTED (Reward = $0.00)"]
        R9 --> C6
        R2 -->|Reject| R10["Status: REJECTED (Reward = $0.00)"]
    end

    subgraph AnalyticsSync["5. Real-Time Telemetry"]
        R6 --> A1["Update Campaign Total Views & Leaderboard Rank"]
        A1 --> A2["Reflect in Brand Analytics & Creator Balance"]
    end
```

---

## 2. Independent Creator Hub Workflow

Creators operate in a dedicated, isolated hub tailored for discovery, production management, and portfolio verification.

```mermaid
flowchart LR
    subgraph Auth["Authentication"]
        C_Auth["Creator Login / Register"] --> C_Dash["Creator Hub Dashboard"]
    end

    subgraph Exploration["Campaign Discovery"]
        C_Dash --> C_Browse["Browse Active Campaigns (/creator/campaigns)"]
        C_Browse --> C_Detail["Inspect Deliverables & Rules (/creator/campaigns/:id)"]
        C_Detail --> C_Join["Enroll in Campaign"]
    end

    subgraph Submissions["Submission Management"]
        C_Join --> C_Submit["Submit Video Clip Modal"]
        C_Submit --> C_Tracker["Submissions Tracker (/creator/submissions)"]
        C_Tracker --> C_Status["Track Status: Pending / Revision / Approved"]
    end

    subgraph StudioAndPortfolio["AI Studio & Portfolio"]
        C_Dash --> C_Port["Manage AI Portfolio (/creator/portfolio)"]
        C_Port --> C_Proj["Upload Deliverable Media & Workflow Steps"]
        C_Port --> C_Trust["Inspect Verified Trust Score & Badges"]
    end

    subgraph Community["Brand Communities"]
        C_Dash --> C_Comm["Explore Brand Updates (/creator/community)"]
        C_Comm --> C_Pack["Download Brand Creative Asset Packs"]
    end
```

---

## 3. Independent Brand Hub Workflow

Brands and agencies have dedicated workflows for campaign formulation, creator discovery, submission moderation, and campaign ROI tracking.

```mermaid
flowchart LR
    subgraph BrandAuth["Authentication"]
        B_Auth["Brand Login / Register"] --> B_Dash["Brand Hub Dashboard"]
    end

    subgraph CampaignManagement["Campaign Operations"]
        B_Dash --> B_Create["Create Brief with AI Assistance (/brand/briefs/new)"]
        B_Create --> B_List["Manage Campaigns (/brand/campaigns)"]
        B_List --> B_Pause["Pause / Resume Active Campaign"]
    end

    subgraph ReviewQueue["Clip Review Queue"]
        B_List --> B_Queue["Inspect Submissions (/brand/campaigns/:id/submissions)"]
        B_Queue --> B_Audit["Audit Verified Views & Approve Reward"]
    end

    subgraph Intelligence["Analytics & Discovery"]
        B_List --> B_Analytics["Inspect Campaign Analytics (/brand/campaigns/:id/analytics)"]
        B_Analytics --> B_Leader["Analyze Top Creator Leaderboard & CPM Spend"]
        B_Dash --> B_Discover["Discover AI Creators (/brand/discover)"]
    end

    subgraph BrandVoice["Community Publishing"]
        B_Dash --> B_Comm["Brand Community Board (/brand/community)"]
        B_Comm --> B_Post["Publish Updates, Guidelines & Asset Packs"]
    end
```

---

## 4. AI-Assisted Matching & Generation Pipeline

CreatorBridge combines multi-provider generative AI with deterministic filtering to prevent hallucinated scores and guarantee rule integrity.

```mermaid
flowchart TD
    subgraph UserInput["Unstructured Concept Input"]
        RawPrompt["Brand Prompt: Target Audience, Product Theme, Aesthetic Mood"]
    end

    subgraph AIGateway["AI Intelligence Layer (LLM Synthesis)"]
        RawPrompt --> PromptEng["System Prompt: Creative Brief Synthesizer"]
        PromptEng --> ModelCall["External AI Provider Call (Google Gemini / Anthropic / OpenAI)"]
        ModelCall --> JSONExtract["Strict JSON Schema Validation"]
        JSONExtract --> StructuredDraft["Structured Brief: Deliverables, Visual Angles, Prohibited Items"]
    end

    subgraph DeterministicEngine["Deterministic Validation & Database Engine"]
        StructuredDraft --> Preflight["Preflight Field Validator (Budget, Deliverables, Content Type)"]
        Preflight --> DBStore["PostgreSQL / SQLite Persistence"]
    end

    subgraph CreatorMatching["Hybrid Creator Matching Algorithm"]
        DBStore --> FilterPhase["1. Hard Filters (SQL): Active Status, Deliverable Match"]
        FilterPhase --> ScorePhase["2. Deterministic Scoring: Trust Score, Platform Delivery Record"]
        ScorePhase --> SemanticPhase["3. Semantic Vector Similarity: AI Tool Stack & Portfolio Style Matching"]
        SemanticPhase --> FinalRank["Final Creator Recommendation Rank"]
    end
```

---

## 5. End-to-End System Architecture

```mermaid
graph TB
    subgraph ClientTier["Client Tier (Frontend)"]
        WebUI["React 19 + TypeScript + Vite"]
        Tailwind["Tailwind CSS + Lucide Icons"]
        Router["React Router v7 (Role-Guarded Portals)"]
    end

    subgraph GatewayTier["API & Security Boundary"]
        FastAPI["FastAPI Application (/api/v1)"]
        AuthMid["JWT Auth Bearer & Role Verification"]
        BOLA["Object-Level Authorization Engine (_is_brand_owner)"]
        RateLimiter["Rate Limiting & Cloudflare Turnstile Bot Defense"]
    end

    subgraph ServiceTier["Backend Domain Services"]
        BriefSvc["Brief & Campaign Service"]
        RewardSvc["CPM Reward Calculation & Pool Limiter"]
        TrustSvc["Trust & Verification Engine"]
        AIGatewaySvc["Multi-Provider AI Gateway"]
    end

    subgraph PersistenceTier["Storage & AI Providers"]
        SQLDB["Relational Database (PostgreSQL / SQLite)"]
        MediaCDN["Media Storage (Supabase Storage / Local Fallbacks)"]
        AIProviders["AI Providers (Gemini 2.5, Claude 3.5, OpenAI GPT-4o)"]
    end

    WebUI --> Router
    Router --> FastAPI
    FastAPI --> AuthMid
    AuthMid --> BOLA
    BOLA --> BriefSvc
    BOLA --> RewardSvc
    BOLA --> TrustSvc
    BriefSvc --> SQLDB
    RewardSvc --> SQLDB
    TrustSvc --> SQLDB
    BriefSvc --> MediaCDN
    BriefSvc --> AIGatewaySvc
    AIGatewaySvc --> AIProviders
```
