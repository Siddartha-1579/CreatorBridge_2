-- Migration: 005_brand_onboarding_and_preferences.sql
-- Description: Extends brand profiles with organization details, structured preferences, adaptive survey sessions, and verification records.

-- 1. EXTEND BRAND PROFILES TABLE
ALTER TABLE public.brand_profiles
    ADD COLUMN IF NOT EXISTS organization_type TEXT NOT NULL DEFAULT 'Consumer Brand',
    ADD COLUMN IF NOT EXISTS primary_industry TEXT,
    ADD COLUMN IF NOT EXISTS secondary_industries TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS contact_name TEXT,
    ADD COLUMN IF NOT EXISTS business_email TEXT,
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS team_size TEXT,
    ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS brand_guidelines_url TEXT,
    ADD COLUMN IF NOT EXISTS preferred_communication TEXT DEFAULT 'EMAIL',
    ADD COLUMN IF NOT EXISTS is_agency BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS profile_completeness_pct INTEGER NOT NULL DEFAULT 25;

-- 2. BRAND STRUCTURED PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.brand_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE UNIQUE,
    intended_uses TEXT[] DEFAULT '{}',
    content_requirements TEXT[] DEFAULT '{}',
    target_niches TEXT[] DEFAULT '{}',
    preferred_formats TEXT[] DEFAULT '{}',
    creative_styles TEXT[] DEFAULT '{}',
    style_description TEXT,
    intended_usage_channels TEXT[] DEFAULT '{}',
    project_timeline TEXT,
    commercial_rights_required BOOLEAN DEFAULT true,
    exclusive_usage_required BOOLEAN DEFAULT false,
    source_files_required BOOLEAN DEFAULT false,
    budget_range TEXT,
    engagement_type TEXT,
    adaptive_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BRAND ADAPTIVE SURVEY SESSIONS (Save & Resume Support)
CREATE TABLE IF NOT EXISTS public.brand_survey_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
    current_step INTEGER NOT NULL DEFAULT 0,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. BRAND VERIFICATION RECORDS (Truthful trust signals)
CREATE TABLE IF NOT EXISTS public.brand_verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL, -- EMAIL_VERIFIED, ORGANIZATION_IDENTITY, DOMAIN_VERIFIED, BUSINESS_REGISTRATION
    target_identifier TEXT,
    status TEXT NOT NULL DEFAULT 'NOT_STARTED', -- NOT_STARTED, PENDING, VERIFIED, REJECTED
    evidence_reference TEXT, -- Private proof URL/note
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.brand_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_survey_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_verification_records ENABLE ROW LEVEL SECURITY;

-- Preferences: Only the brand owner can read and update their preferences
CREATE POLICY "Brand owners can manage their own preferences"
    ON public.brand_preferences
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.brand_profiles
            WHERE brand_profiles.id = brand_preferences.brand_id
            AND brand_profiles.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.brand_profiles
            WHERE brand_profiles.id = brand_preferences.brand_id
            AND brand_profiles.user_id = auth.uid()
        )
    );

-- Survey Sessions: Only the brand owner can view and resume survey sessions
CREATE POLICY "Brand owners can manage their own survey sessions"
    ON public.brand_survey_sessions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.brand_profiles
            WHERE brand_profiles.id = brand_survey_sessions.brand_id
            AND brand_profiles.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.brand_profiles
            WHERE brand_profiles.id = brand_survey_sessions.brand_id
            AND brand_profiles.user_id = auth.uid()
        )
    );

-- Verification: Brand owners can view their claims; evidence remains strictly private
CREATE POLICY "Brand owners can view their verification records"
    ON public.brand_verification_records
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.brand_profiles
            WHERE brand_profiles.id = brand_verification_records.brand_id
            AND brand_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Brand owners can submit verification claims"
    ON public.brand_verification_records
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.brand_profiles
            WHERE brand_profiles.id = brand_verification_records.brand_id
            AND brand_profiles.user_id = auth.uid()
        )
    );
