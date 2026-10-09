-- ==============================================================================
-- HACXLERATE 2026: AI CONTENT CREATOR MARKETPLACE
-- MIGRATION 004: Creator Profile, AI Portfolio, Workflow & Verification System
-- Engine: PostgreSQL / Supabase
-- ==============================================================================

-- 1. ENUMS FOR PORTFOLIO & VERIFICATION
DO $$ BEGIN
    CREATE TYPE project_visibility AS ENUM ('PUBLIC', 'PRIVATE', 'UNPUBLISHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE commercial_status AS ENUM (
        'COMMERCIAL_READY',
        'COMMERCIAL_USE_WITH_PERMISSION',
        'PERSONAL_PROJECT',
        'UNKNOWN'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ai_disclosure_type AS ENUM ('AI_GENERATED', 'AI_ASSISTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_type AS ENUM (
        'EMAIL_VERIFIED',
        'TOOL_VERIFIED',
        'PORTFOLIO_VERIFIED',
        'WORKFLOW_VERIFIED',
        'IDENTITY_VERIFIED',
        'EXPERIENCE_VERIFIED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_claim_status AS ENUM (
        'NOT_STARTED',
        'PENDING',
        'VERIFIED',
        'REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ENHANCE CREATOR PROFILES TABLE
ALTER TABLE public.creator_profiles
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS secondary_specializations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_niches TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_formats TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN IF NOT EXISTS profile_completeness_pct INTEGER NOT NULL DEFAULT 50;

-- 3. EXPANDED PORTFOLIO PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.portfolio_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'AI Video',
    content_type TEXT NOT NULL DEFAULT 'Short-form Video',
    media_type asset_type NOT NULL DEFAULT 'VIDEO',
    thumbnail_url TEXT,
    media_url TEXT NOT NULL,
    tools TEXT[] DEFAULT '{}',
    models TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    workflow_summary TEXT,
    workflow_stages JSONB DEFAULT '[]'::jsonb,
    aspect_ratio TEXT DEFAULT '16:9',
    resolution TEXT DEFAULT '1080p',
    duration_seconds INTEGER,
    commercial_use_status commercial_status NOT NULL DEFAULT 'COMMERCIAL_READY',
    ai_generation_type ai_disclosure_type NOT NULL DEFAULT 'AI_GENERATED',
    visibility project_visibility NOT NULL DEFAULT 'PUBLIC',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status verification_claim_status NOT NULL DEFAULT 'NOT_STARTED',
    external_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_projects_creator ON public.portfolio_projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_visibility ON public.portfolio_projects(visibility);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_category ON public.portfolio_projects(category);

-- 4. VERIFICATION RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    verification_type verification_type NOT NULL,
    target_id TEXT, -- Tool name, project ID, or generic claim
    status verification_claim_status NOT NULL DEFAULT 'PENDING',
    evidence_reference TEXT, -- Private URL or reference to proof
    notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_creator_verification_claim UNIQUE (creator_id, verification_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_verification_records_creator ON public.verification_records(creator_id);
CREATE INDEX IF NOT EXISTS idx_verification_records_type ON public.verification_records(verification_type);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;

-- portfolio_projects: Publicly readable if PUBLIC; creators can manage their own
DROP POLICY IF EXISTS "Public portfolio projects are viewable by all" ON public.portfolio_projects;
CREATE POLICY "Public portfolio projects are viewable by all"
    ON public.portfolio_projects FOR SELECT
    USING (visibility = 'PUBLIC' OR creator_id IN (
        SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Creators can insert their own portfolio projects" ON public.portfolio_projects;
CREATE POLICY "Creators can insert their own portfolio projects"
    ON public.portfolio_projects FOR INSERT
    WITH CHECK (creator_id IN (
        SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Creators can update their own portfolio projects" ON public.portfolio_projects;
CREATE POLICY "Creators can update their own portfolio projects"
    ON public.portfolio_projects FOR UPDATE
    USING (creator_id IN (
        SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()
    ))
    WITH CHECK (creator_id IN (
        SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Creators can delete their own portfolio projects" ON public.portfolio_projects;
CREATE POLICY "Creators can delete their own portfolio projects"
    ON public.portfolio_projects FOR DELETE
    USING (creator_id IN (
        SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()
    ));

-- verification_records: Creators can view their own claims and submit new requests
DROP POLICY IF EXISTS "Creators can view their own verification records" ON public.verification_records;
CREATE POLICY "Creators can view their own verification records"
    ON public.verification_records FOR SELECT
    USING (creator_id IN (
        SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Creators can request verifications" ON public.verification_records;
CREATE POLICY "Creators can request verifications"
    ON public.verification_records FOR INSERT
    WITH CHECK (creator_id IN (
        SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()
    ));

-- Service role or admin can update verification status
DROP POLICY IF EXISTS "Service role manages verification status" ON public.verification_records;
CREATE POLICY "Service role manages verification status"
    ON public.verification_records FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');
