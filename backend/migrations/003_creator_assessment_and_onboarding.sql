-- ==============================================================================
-- HACXLERATE 2026: AI CONTENT CREATOR MARKETPLACE
-- MIGRATION 003: Creator Onboarding, Adaptive Survey & Capability Assessment
-- Engine: PostgreSQL / Supabase
-- ==============================================================================

-- 1. EXTEND CREATOR LEVEL ENUM IF NEEDED
DO $$ BEGIN
    ALTER TYPE creator_level ADD VALUE IF NOT EXISTS 'PRACTITIONER';
    ALTER TYPE creator_level ADD VALUE IF NOT EXISTS 'SKILLED';
    ALTER TYPE creator_level ADD VALUE IF NOT EXISTS 'ADVANCED';
    ALTER TYPE creator_level ADD VALUE IF NOT EXISTS 'PROFESSIONAL';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

-- 2. ASSESSMENT STATUS ENUM
DO $$ BEGIN
    CREATE TYPE assessment_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. CREATOR ASSESSMENTS SESSION TABLE
CREATE TABLE IF NOT EXISTS public.creator_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status assessment_status NOT NULL DEFAULT 'IN_PROGRESS',
    primary_specialization TEXT,
    secondary_specializations TEXT[] DEFAULT '{}',
    current_step_index INTEGER NOT NULL DEFAULT 0,
    total_steps INTEGER NOT NULL DEFAULT 18,
    assessment_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    integrity_signals JSONB NOT NULL DEFAULT '{"tab_switches": 0, "copy_attempts": 0}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_assessments_user ON public.creator_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_assessments_status ON public.creator_assessments(status);

-- 4. SURVEY RAW RESPONSES TABLE (Private to the creator)
CREATE TABLE IF NOT EXISTS public.survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.creator_assessments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    niche TEXT NOT NULL,
    question_type TEXT NOT NULL,
    skill_dimension TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    response_value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_assessment_question UNIQUE (assessment_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_assessment ON public.survey_responses(assessment_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user ON public.survey_responses(user_id);

-- 5. ASSESSMENT RESULTS TABLE (Authoritative server-side calculation)
CREATE TABLE IF NOT EXISTS public.assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.creator_assessments(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    overall_score NUMERIC(5, 2) NOT NULL,
    calculated_level TEXT NOT NULL,
    level_name TEXT NOT NULL,
    technical_score NUMERIC(5, 2) NOT NULL,
    creative_score NUMERIC(5, 2) NOT NULL,
    workflow_score NUMERIC(5, 2) NOT NULL,
    problem_solving_score NUMERIC(5, 2) NOT NULL,
    commercial_readiness_score NUMERIC(5, 2) NOT NULL,
    dimension_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    strengths TEXT[] DEFAULT '{}',
    growth_areas TEXT[] DEFAULT '{}',
    recommended_paths TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_results_user ON public.assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_level ON public.assessment_results(calculated_level);

-- 6. CREATOR CAPABILITIES TABLE (Marketplace Matching Preparation)
CREATE TABLE IF NOT EXISTS public.creator_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dimension TEXT NOT NULL,
    score NUMERIC(5, 2) NOT NULL,
    evidence_count INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_creator_capability UNIQUE (creator_id, dimension)
);

CREATE INDEX IF NOT EXISTS idx_creator_capabilities_creator ON public.creator_capabilities(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_capabilities_dimension ON public.creator_capabilities(dimension);

-- 7. CREATOR TOOLS CATALOG TABLE (Extensible Tool Registry for Matching)
CREATE TABLE IF NOT EXISTS public.creator_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    category TEXT NOT NULL,
    experience_level TEXT NOT NULL,
    confidence_score NUMERIC(3, 1) DEFAULT 3.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_creator_tool UNIQUE (creator_id, tool_name)
);

CREATE INDEX IF NOT EXISTS idx_creator_tools_creator ON public.creator_tools(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_tools_name ON public.creator_tools(tool_name);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.creator_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_tools ENABLE ROW LEVEL SECURITY;

-- creator_assessments: Creators can read and update their own sessions
DROP POLICY IF EXISTS "Creators can view their own assessments" ON public.creator_assessments;
CREATE POLICY "Creators can view their own assessments"
    ON public.creator_assessments FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Creators can create their own assessments" ON public.creator_assessments;
CREATE POLICY "Creators can create their own assessments"
    ON public.creator_assessments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Creators can update their in-progress assessments" ON public.creator_assessments;
CREATE POLICY "Creators can update their in-progress assessments"
    ON public.creator_assessments FOR UPDATE
    USING (auth.uid() = user_id AND status != 'COMPLETED')
    WITH CHECK (auth.uid() = user_id);

-- survey_responses: Creators can read and manage their own responses
DROP POLICY IF EXISTS "Creators can view their own responses" ON public.survey_responses;
CREATE POLICY "Creators can view their own responses"
    ON public.survey_responses FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Creators can insert their own responses" ON public.survey_responses;
CREATE POLICY "Creators can insert their own responses"
    ON public.survey_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Creators can update their own responses" ON public.survey_responses;
CREATE POLICY "Creators can update their own responses"
    ON public.survey_responses FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- assessment_results: Read-only for owners; mutations blocked from client directly
DROP POLICY IF EXISTS "Creators can view their own results" ON public.assessment_results;
CREATE POLICY "Creators can view their own results"
    ON public.assessment_results FOR SELECT
    USING (auth.uid() = user_id);

-- creator_capabilities: Publicly readable for marketplace matching; owner or service role manages
DROP POLICY IF EXISTS "Capabilities are publicly viewable" ON public.creator_capabilities;
CREATE POLICY "Capabilities are publicly viewable"
    ON public.creator_capabilities FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Capabilities manageable by service role" ON public.creator_capabilities;
CREATE POLICY "Capabilities manageable by service role"
    ON public.creator_capabilities FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() = user_id);

-- creator_tools: Publicly viewable for creator discovery; owner or service role manages
DROP POLICY IF EXISTS "Tools are publicly viewable" ON public.creator_tools;
CREATE POLICY "Tools are publicly viewable"
    ON public.creator_tools FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Tools manageable by service role" ON public.creator_tools;
CREATE POLICY "Tools manageable by service role"
    ON public.creator_tools FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() = user_id);
