-- ==============================================================================
-- MIGRATION 008: INTELLIGENT SURVEYS & TRANSPARENT TRUST ENGINE
-- HacXLerate 2026: CreatorBridge AI Creator Marketplace
-- ==============================================================================
-- Additive schema for:
-- 1. Declarative Survey Definitions & Dynamic Questions
-- 2. User Survey Drafts & Completed Responses
-- 3. Structured Creator & Brand/Agency Professional Profiles
-- 4. Authoritative Trust & Demerit Incident Ledger
-- 5. Trust Dispute Cases & Review Workflow
-- 6. Deterministic Trust Scores & Audit History
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SURVEY DEFINITIONS & DECLARATIVE QUESTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS surveys (
    id VARCHAR(64) PRIMARY KEY,                  -- 'creator_v1', 'brand_v1'
    survey_type VARCHAR(32) NOT NULL,            -- 'CREATOR', 'BRAND'
    version VARCHAR(16) NOT NULL DEFAULT '1.0.0',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_questions (
    id VARCHAR(128) PRIMARY KEY,                 -- e.g. 'cr_id_display_name'
    survey_id VARCHAR(64) NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    survey_type VARCHAR(32) NOT NULL,            -- 'CREATOR', 'BRAND'
    section_key VARCHAR(64) NOT NULL,            -- e.g. 'identity', 'specializations'
    question_text TEXT NOT NULL,
    help_text TEXT,
    input_type VARCHAR(32) NOT NULL,             -- 'text', 'textarea', 'single_choice', 'multi_select', 'number', 'range', 'url', 'date', 'tool_catalog', 'deliverable_specs'
    is_required BOOLEAN NOT NULL DEFAULT false,
    display_order INT NOT NULL DEFAULT 0,
    options JSONB DEFAULT '[]'::jsonb,           -- [{label, value, description}]
    validation_rules JSONB DEFAULT '{}'::jsonb,  -- {min, max, pattern, min_items, max_items}
    conditional_rules JSONB DEFAULT '{}'::jsonb, -- {depends_on, operator, value, show_if}
    matching_relevance VARCHAR(32) DEFAULT 'STANDARD', -- 'HIGH', 'STANDARD', 'LOW', 'NONE'
    data_sensitivity VARCHAR(32) DEFAULT 'PUBLIC',     -- 'PUBLIC', 'INTERNAL_MATCHING', 'CONFIDENTIAL_ADMIN'
    requires_verification BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_id ON survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_section ON survey_questions(survey_type, section_key, display_order);

-- ------------------------------------------------------------------------------
-- 2. SURVEY RESPONSES & DRAFTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    survey_type VARCHAR(32) NOT NULL,            -- 'CREATOR', 'BRAND'
    survey_version VARCHAR(16) NOT NULL DEFAULT '1.0.0',
    current_section_index INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Raw key-value responses
    ai_assisted_fields JSONB DEFAULT '[]'::jsonb,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_survey_type UNIQUE (user_id, survey_type)
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_user ON survey_responses(user_id);

-- ------------------------------------------------------------------------------
-- 3. STRUCTURED PROFESSIONAL PROFILES (Populated by Surveys)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS creator_professional_profiles (
    user_id UUID PRIMARY KEY,
    display_name VARCHAR(120) NOT NULL,
    headline VARCHAR(255),
    bio TEXT,
    country VARCHAR(64),
    languages JSONB DEFAULT '["English"]'::jsonb,
    years_experience NUMERIC(4, 1) DEFAULT 1.0,
    creator_type VARCHAR(32) DEFAULT 'INDIVIDUAL', -- 'INDIVIDUAL', 'STUDIO', 'AGENCY', 'TEAM'
    website_url VARCHAR(512),
    social_links JSONB DEFAULT '{}'::jsonb,
    working_arrangements JSONB DEFAULT '[]'::jsonb,
    specializations JSONB DEFAULT '[]'::jsonb,
    technical_skills JSONB DEFAULT '[]'::jsonb,
    ai_tools_experience JSONB DEFAULT '[]'::jsonb,
    platforms_audience JSONB DEFAULT '[]'::jsonb,
    services_pricing JSONB DEFAULT '{}'::jsonb,
    availability_preferences JSONB DEFAULT '{}'::jsonb,
    conduct_acknowledgments JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand_campaign_profiles (
    user_id UUID PRIMARY KEY,
    organization_name VARCHAR(150) NOT NULL,
    organization_type VARCHAR(64) DEFAULT 'DIRECT_BRAND',
    industry VARCHAR(64) DEFAULT 'E-commerce',
    website_url VARCHAR(512),
    public_links JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    contact_role VARCHAR(100),
    country VARCHAR(64),
    collaboration_method VARCHAR(64) DEFAULT 'HYBRID',
    campaign_objectives JSONB DEFAULT '{}'::jsonb,
    creator_requirements JSONB DEFAULT '{}'::jsonb,
    deliverables_specs JSONB DEFAULT '{}'::jsonb,
    budget_timeline JSONB DEFAULT '{}'::jsonb,
    licensing_rights JSONB DEFAULT '{}'::jsonb,
    verification_info JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. AUTHORITATIVE TRUST & DEMERIT INCIDENT LEDGER
-- ------------------------------------------------------------------------------
-- Each confirmed incident is recorded immutably in this ledger.
-- Scores are deterministically calculated from this ledger.
CREATE TABLE IF NOT EXISTS trust_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    case_id UUID,
    incident_category VARCHAR(64) NOT NULL,      -- 'MISREPRESENTATION', 'METRIC_FALSIFICATION', 'PAYMENT_FRAUD', 'ASSET_MISUSE', 'COMMITMENT_BREACH', 'POLICY_VIOLATION'
    severity VARCHAR(32) NOT NULL,               -- 'MINOR', 'MODERATE', 'MAJOR', 'CRITICAL'
    base_penalty INT NOT NULL,                   -- 5, 15, 30, 50
    recurrence_count INT NOT NULL DEFAULT 1,     -- 1 for first incident in category, 2 for second, etc.
    recurrence_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00, -- 1.00, 1.25, 1.50
    calculated_penalty INT NOT NULL,             -- min(50, round(base_penalty * recurrence_multiplier))
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',-- 'ACTIVE', 'RECOVERED', 'OVERTURNED'
    rationale TEXT NOT NULL,
    evidence_refs JSONB DEFAULT '[]'::jsonb,
    confirmed_by UUID,                           -- Reviewer/Admin ID
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    overturned_at TIMESTAMPTZ,
    overturned_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_incidents_account ON trust_incidents(account_id, status);

-- ------------------------------------------------------------------------------
-- 5. TRUST CASES & REVIEW WORKFLOW
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trust_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(32) UNIQUE NOT NULL,     -- e.g. 'CASE-2026-0012'
    reporting_account_id UUID,
    reported_account_id UUID NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    evidence_urls JSONB DEFAULT '[]'::jsonb,
    reference_id VARCHAR(128),                   -- e.g. brief_id or project_id
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED', -- 'SUBMITTED', 'AWAITING_EVIDENCE', 'UNDER_REVIEW', 'CONFIRMED', 'DISMISSED', 'APPEALED', 'OVERTURNED'
    assigned_reviewer_id UUID,
    decision_rationale TEXT,
    severity_assessed VARCHAR(32),
    penalty_applied INT DEFAULT 0,
    incident_id UUID REFERENCES trust_incidents(id) ON DELETE SET NULL,
    appeal_text TEXT,
    appeal_submitted_at TIMESTAMPTZ,
    appeal_reviewer_id UUID,
    appeal_rationale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_cases_reported ON trust_cases(reported_account_id, status);

-- ------------------------------------------------------------------------------
-- 6. TRUST SCORES & AUDIT HISTORY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trust_scores (
    account_id UUID PRIMARY KEY,
    score INT NOT NULL DEFAULT 100,              -- 0 to 100
    status_label VARCHAR(64) NOT NULL DEFAULT 'New — insufficient history',
    total_active_demerits INT NOT NULL DEFAULT 0,
    eligible_recovery_points INT NOT NULL DEFAULT 0,
    confirmed_incidents_count INT NOT NULL DEFAULT 0,
    overturned_incidents_count INT NOT NULL DEFAULT 0,
    verified_badges JSONB DEFAULT '[]'::jsonb,   -- ['EMAIL_VERIFIED', 'DOMAIN_VERIFIED', 'COMMERCIAL_LICENSE_AWARE']
    last_violation_at TIMESTAMPTZ,
    last_recalculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trust_score_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    previous_score INT NOT NULL,
    new_score INT NOT NULL,
    change_reason VARCHAR(128) NOT NULL,        -- 'INITIALIZATION', 'INCIDENT_CONFIRMED', 'RECOVERY_APPLIED', 'APPEAL_OVERTURNED'
    incident_id UUID REFERENCES trust_incidents(id) ON DELETE SET NULL,
    active_demerits INT NOT NULL,
    recovery_points INT NOT NULL,
    recalculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_score_audits_account ON trust_score_audits(account_id);

-- ------------------------------------------------------------------------------
-- 7. ROW-LEVEL SECURITY POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_campaign_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score_audits ENABLE ROW LEVEL SECURITY;

-- Surveys & Questions: Public Read
CREATE POLICY "Public surveys read" ON surveys FOR SELECT USING (true);
CREATE POLICY "Public questions read" ON survey_questions FOR SELECT USING (true);

-- User Responses: Users own their drafts and submissions
CREATE POLICY "Users access own survey responses" ON survey_responses
    FOR ALL USING (auth.uid() = user_id);

-- Profiles: Public read for professional matching; User write
CREATE POLICY "Public read creator profiles" ON creator_professional_profiles FOR SELECT USING (true);
CREATE POLICY "Creators manage own profile" ON creator_professional_profiles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read brand profiles" ON brand_campaign_profiles FOR SELECT USING (true);
CREATE POLICY "Brands manage own profile" ON brand_campaign_profiles FOR ALL USING (auth.uid() = user_id);

-- Trust Scores: Public read score and badges, private audit
CREATE POLICY "Public read trust scores" ON trust_scores FOR SELECT USING (true);
CREATE POLICY "Users view own cases" ON trust_cases FOR SELECT USING (auth.uid() = reported_account_id OR auth.uid() = reporting_account_id);
