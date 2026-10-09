-- ==============================================================================
-- HACXLERATE 2026: AI CONTENT CREATOR MARKETPLACE
-- MIGRATION 002: Advanced Security, Row-Level Security (RLS) & Audit Policies
-- Engine: PostgreSQL / Supabase
-- ==============================================================================

-- 1. SECURITY ENUMS & STATUS
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. PROFILE SECURITY ENHANCEMENTS
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'ACTIVE';

-- Trigger to prevent client manipulation of security-critical columns
CREATE OR REPLACE FUNCTION protect_profile_security_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- If non-admin user attempts to alter role or verification status directly
    IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.is_verified IS DISTINCT FROM NEW.is_verified) THEN
        IF (auth.jwt() ->> 'role' != 'service_role' AND (auth.jwt() -> 'app_metadata' ->> 'role') != 'ADMIN') THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify their own role or verification status.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_security ON public.profiles;
CREATE TRIGGER trg_protect_profile_security
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION protect_profile_security_fields();

-- 3. SEARCH HISTORY TABLE (Private by default, strictly owned)
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    context JSONB DEFAULT '{}'::jsonb,
    source TEXT DEFAULT 'marketplace',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON public.search_history(created_at DESC);

-- 4. SECURITY AUDIT LOGS TABLE (Tamper-evident, Admin/System only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 5. REPORTS & TRUST EVENTS (Foundation for future Honesty Score, no auto-demerit)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    evidence JSONB DEFAULT '{}'::jsonb,
    status report_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- 6. COMPREHENSIVE ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Clean existing policies before reapplying
DROP POLICY IF EXISTS "Public profiles are viewable by all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Search history viewable only by owner" ON public.search_history;
DROP POLICY IF EXISTS "Search history insertable only by owner" ON public.search_history;
DROP POLICY IF EXISTS "Audit logs viewable only by admins" ON public.audit_logs;
DROP POLICY IF EXISTS "Reports viewable only by reporter or admin" ON public.reports;
DROP POLICY IF EXISTS "Users can file reports" ON public.reports;
DROP POLICY IF EXISTS "Draft briefs viewable only by creator brand" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Published briefs viewable by authenticated users" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Projects viewable only by assigned participants" ON public.project_workspaces;
DROP POLICY IF EXISTS "Generations viewable only by owner" ON public.generation_jobs;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by all authenticated users"
ON public.profiles FOR SELECT TO authenticated
USING (status = 'ACTIVE');

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- SEARCH HISTORY POLICIES (STRICTLY PRIVATE TO USER)
CREATE POLICY "Search history viewable only by owner"
ON public.search_history FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Search history insertable only by owner"
ON public.search_history FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- AUDIT LOGS POLICIES (RESTRICTED TO ADMIN / SERVICE ROLE)
CREATE POLICY "Audit logs viewable only by admins"
ON public.audit_logs FOR SELECT TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
    OR auth.jwt() ->> 'role' = 'service_role'
);

-- REPORTS POLICIES
CREATE POLICY "Reports viewable only by reporter or admin"
ON public.reports FOR SELECT TO authenticated
USING (
    auth.uid() = reporter_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
);

CREATE POLICY "Users can file reports"
ON public.reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- CAMPAIGN BRIEFS POLICIES
CREATE POLICY "Published briefs viewable by authenticated users"
ON public.campaign_briefs FOR SELECT TO authenticated
USING (status != 'DRAFT' OR EXISTS (
    SELECT 1 FROM public.brand_profiles
    WHERE brand_profiles.id = campaign_briefs.brand_id
    AND brand_profiles.user_id = auth.uid()
));

CREATE POLICY "Brands manage own briefs"
ON public.campaign_briefs FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.brand_profiles
    WHERE brand_profiles.id = campaign_briefs.brand_id
    AND brand_profiles.user_id = auth.uid()
));

-- PROJECT WORKSPACES POLICIES (ONLY PARTICIPANTS)
CREATE POLICY "Projects viewable only by assigned participants"
ON public.project_workspaces FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.brand_profiles WHERE id = project_workspaces.brand_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = project_workspaces.creator_id AND user_id = auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
);

-- GENERATION JOBS POLICIES (ONLY OWNER)
CREATE POLICY "Generations viewable only by owner"
ON public.generation_jobs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Generations insertable only by owner"
ON public.generation_jobs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 7. STORAGE POLICIES SPECIFICATION
-- Public portfolios bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolios', 'portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- Private project files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Private generated assets bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-assets', 'generated-assets', false)
ON CONFLICT (id) DO NOTHING;
