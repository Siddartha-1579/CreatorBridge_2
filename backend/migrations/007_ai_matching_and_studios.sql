-- ==============================================================================
-- HACXLERATE 2026: MIGRATION 007 - AI MATCHING ENGINE & CREATOR STUDIOS
-- ==============================================================================

-- 1. Create table for cached and explainable brief-creator matches
CREATE TABLE IF NOT EXISTS public.brief_creator_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id UUID NOT NULL REFERENCES public.campaign_briefs(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score >= 0.0 AND overall_score <= 100.0),
    factor_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary_explanation TEXT NOT NULL,
    top_strengths TEXT[] DEFAULT '{}',
    potential_gaps TEXT[] DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_brief_creator_match UNIQUE (brief_id, creator_id)
);

-- Indexing for high-performance ranking queries
CREATE INDEX IF NOT EXISTS idx_brief_matches_ranking 
    ON public.brief_creator_matches (brief_id, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_brief_matches_creator 
    ON public.brief_creator_matches (creator_id, overall_score DESC);

-- 2. Create table for Creator AI Studio generated assets
CREATE TABLE IF NOT EXISTS public.ai_studio_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.generation_jobs(id) ON DELETE SET NULL,
    studio_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'voice', 'writing', 'repurpose', 'portfolio'
    prompt TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    asset_url TEXT,
    result_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    saved_to_portfolio BOOLEAN NOT NULL DEFAULT false,
    portfolio_item_id UUID REFERENCES public.portfolio_items(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_studio_assets_creator 
    ON public.ai_studio_assets (creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_studio_assets_type 
    ON public.ai_studio_assets (studio_type);

-- 3. Row Level Security (RLS) Configuration
ALTER TABLE public.brief_creator_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_studio_assets ENABLE ROW LEVEL SECURITY;

-- Matches: Brand owners can view matches for their campaign briefs
DROP POLICY IF EXISTS brand_view_brief_matches ON public.brief_creator_matches;
CREATE POLICY brand_view_brief_matches ON public.brief_creator_matches
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.campaign_briefs cb
            JOIN public.brand_profiles bp ON cb.brand_id = bp.id
            WHERE cb.id = brief_creator_matches.brief_id
            AND bp.user_id = auth.uid()
        )
    );

-- Matches: Creators can view matches where they are ranked
DROP POLICY IF EXISTS creator_view_own_matches ON public.brief_creator_matches;
CREATE POLICY creator_view_own_matches ON public.brief_creator_matches
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.creator_profiles cp
            WHERE cp.id = brief_creator_matches.creator_id
            AND cp.user_id = auth.uid()
        )
    );

-- Studio Assets: Creators can manage their own studio outputs
DROP POLICY IF EXISTS creator_manage_studio_assets ON public.ai_studio_assets;
CREATE POLICY creator_manage_studio_assets ON public.ai_studio_assets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.creator_profiles cp
            WHERE cp.id = ai_studio_assets.creator_id
            AND cp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.creator_profiles cp
            WHERE cp.id = ai_studio_assets.creator_id
            AND cp.user_id = auth.uid()
        )
    );

COMMENT ON TABLE public.brief_creator_matches IS 'Stores ranked 7-factor explainable creator match calculations for campaign briefs';
COMMENT ON TABLE public.ai_studio_assets IS 'Tracks generative artifacts created in Creator Studio modules with portfolio export links';
