-- ==============================================================================
-- HACXLERATE 2026: AI CONTENT CREATOR MARKETPLACE
-- MIGRATION 001: Initial Foundation Schema
-- Engine: PostgreSQL / Supabase
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM (
    'CREATOR',
    'BRAND',
    'AGENCY',
    'ADMIN'
);

CREATE TYPE creator_level AS ENUM (
    'EXPLORER',
    'PRO_CREATOR',
    'AI_MASTER',
    'STUDIO_PARTNER'
);

CREATE TYPE asset_type AS ENUM (
    'IMAGE',
    'VIDEO',
    'AUDIO',
    'TEXT',
    'STORYBOARD',
    'WORKFLOW'
);

CREATE TYPE brief_status AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'MATCHING',
    'IN_PROGRESS',
    'COMPLETED',
    'ARCHIVED'
);

CREATE TYPE project_status AS ENUM (
    'INITIATED',
    'IN_PRODUCTION',
    'REVIEW',
    'REVISION_REQUESTED',
    'APPROVED',
    'DELIVERED',
    'CANCELLED'
);

CREATE TYPE generation_job_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);

-- 3. CORE USERS & PROFILES TABLE (Supabase auth integration foundation)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'CREATOR',
    avatar_url TEXT,
    bio TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CREATOR PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.creator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    handle TEXT NOT NULL UNIQUE,
    level creator_level NOT NULL DEFAULT 'EXPLORER',
    primary_specialization TEXT,
    skills TEXT[] DEFAULT '{}',
    ai_tools TEXT[] DEFAULT '{}',
    hourly_rate_cents INTEGER,
    reputation_score NUMERIC(4, 2) DEFAULT 0.00,
    assessment_completed BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. BRAND PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.brand_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    company_name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    company_size TEXT,
    billing_email TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PORTFOLIO ITEMS (Storage references & metadata)
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    asset_type asset_type NOT NULL,
    storage_path TEXT NOT NULL, -- Reference to Supabase Storage object
    storage_bucket TEXT NOT NULL DEFAULT 'portfolios',
    thumbnail_path TEXT,
    ai_tools_used TEXT[] DEFAULT '{}',
    prompt_metadata JSONB DEFAULT '{}'::jsonb,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CAMPAIGN BRIEFS TABLE
CREATE TABLE IF NOT EXISTS public.campaign_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_audience TEXT,
    deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
    budget_cents INTEGER,
    deadline TIMESTAMPTZ,
    required_tools TEXT[] DEFAULT '{}',
    status brief_status NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PROJECT WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS public.project_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id UUID REFERENCES public.campaign_briefs(id) ON DELETE SET NULL,
    brand_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status project_status NOT NULL DEFAULT 'INITIATED',
    milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
    agreed_budget_cents INTEGER NOT NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. GENERATION JOBS TABLE (AI Orchestration tracking)
CREATE TABLE IF NOT EXISTS public.generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.project_workspaces(id) ON DELETE SET NULL,
    provider_name TEXT NOT NULL,
    modality asset_type NOT NULL,
    status generation_job_status NOT NULL DEFAULT 'PENDING',
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    result_asset_path TEXT, -- Reference to Supabase Storage
    result_metadata JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_level ON public.creator_profiles(level);
CREATE INDEX IF NOT EXISTS idx_portfolio_creator ON public.portfolio_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_briefs_brand ON public.campaign_briefs(brand_id);
CREATE INDEX IF NOT EXISTS idx_briefs_status ON public.campaign_briefs(status);
CREATE INDEX IF NOT EXISTS idx_projects_brand ON public.project_workspaces(brand_id);
CREATE INDEX IF NOT EXISTS idx_projects_creator ON public.project_workspaces(creator_id);
CREATE INDEX IF NOT EXISTS idx_gen_jobs_user ON public.generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_gen_jobs_status ON public.generation_jobs(status);

-- 11. AUTOMATIC UPDATED_AT TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON public.creator_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_profiles_updated_at BEFORE UPDATE ON public.brand_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at BEFORE UPDATE ON public.portfolio_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_briefs_updated_at BEFORE UPDATE ON public.campaign_briefs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_workspaces_updated_at BEFORE UPDATE ON public.project_workspaces
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_jobs_updated_at BEFORE UPDATE ON public.generation_jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. ROW LEVEL SECURITY (RLS) POLICIES FOUNDATION
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;

-- Read policies: public reads for profiles and portfolios
CREATE POLICY "Public profiles are viewable by all authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Public portfolios are viewable by everyone"
ON public.portfolio_items FOR SELECT USING (true);

-- Users can edit their own profiles
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Creators can edit their own creator profile
CREATE POLICY "Creators can update own creator profile"
ON public.creator_profiles FOR UPDATE USING (auth.uid() = user_id);
