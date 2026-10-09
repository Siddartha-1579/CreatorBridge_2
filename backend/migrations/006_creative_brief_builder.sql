-- ============================================================================
-- HACXLERATE 2026 — MIGRATION 006: CREATIVE BRIEF BUILDER & AI GENERATION
-- ============================================================================

-- 1. ADD READY_TO_PUBLISH TO BRIEF_STATUS ENUM IF NOT PRESENT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type
        JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid
        WHERE pg_type.typname = 'brief_status' AND pg_enum.enumlabel = 'READY_TO_PUBLISH'
    ) THEN
        ALTER TYPE public.brief_status ADD VALUE 'READY_TO_PUBLISH' AFTER 'DRAFT';
    END IF;
END$$;

-- 2. EXTEND CAMPAIGN_BRIEFS TABLE WITH STRUCTURED CREATIVE SPECIFICATIONS
ALTER TABLE public.campaign_briefs
    ADD COLUMN IF NOT EXISTS campaign_idea TEXT,
    ADD COLUMN IF NOT EXISTS executive_summary TEXT,
    ADD COLUMN IF NOT EXISTS objectives TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS product_or_service TEXT,
    ADD COLUMN IF NOT EXISTS primary_message TEXT,
    ADD COLUMN IF NOT EXISTS desired_cta TEXT,
    ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS creative_direction JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS creator_capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS commercial_terms JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. INDEXES FOR HIGH-PERFORMANCE DISCOVERY
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_status ON public.campaign_briefs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_brand_id ON public.campaign_briefs(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_platforms ON public.campaign_briefs USING GIN (platforms);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_objectives ON public.campaign_briefs USING GIN (objectives);

-- 4. RLS POLICIES FOR SECURE BRIEF CREATION AND DISCOVERY
-- Drop existing policies to ensure clean idempotent update
DROP POLICY IF EXISTS "Published briefs viewable by authenticated users" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Brands manage own briefs" ON public.campaign_briefs;

-- Published and public briefs are viewable by all authenticated users (creators/brands)
CREATE POLICY "Published briefs viewable by authenticated users"
ON public.campaign_briefs FOR SELECT TO authenticated
USING (
    (status = 'PUBLISHED' AND is_public = TRUE)
    OR EXISTS (
        SELECT 1 FROM public.brand_profiles
        WHERE brand_profiles.id = campaign_briefs.brand_id
        AND brand_profiles.user_id = auth.uid()
    )
);

-- Brands can create and edit their own organization briefs exclusively
CREATE POLICY "Brands manage own briefs"
ON public.campaign_briefs FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.brand_profiles
        WHERE brand_profiles.id = campaign_briefs.brand_id
        AND brand_profiles.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.brand_profiles
        WHERE brand_profiles.id = campaign_briefs.brand_id
        AND brand_profiles.user_id = auth.uid()
    )
);
