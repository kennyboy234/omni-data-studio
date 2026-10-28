-- ====================================================================
-- OMNIDATA STUDIO: SUPABASE MIGRATIONS WITH ENTERPRISE ROW-LEVEL SECURITY
-- Fulfilling Section 9 Phase A4 & Section 11 Supabase Architecture
-- ====================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Senior Quantitative Analyst',
  organization TEXT NOT NULL DEFAULT 'Autonomous Data Labs',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. DATASETS TABLE
CREATE TABLE IF NOT EXISTS public.datasets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_immutable_source BOOLEAN NOT NULL DEFAULT true,
  parent_dataset_id TEXT,
  source_type TEXT NOT NULL DEFAULT 'upload',
  sha256_hash TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  profile_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "datasets_isolation" ON public.datasets
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. PIPELINE RUNS TABLE
CREATE TABLE IF NOT EXISTS public.pipeline_runs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  nodes_executed INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  trigger TEXT NOT NULL CHECK (trigger IN ('manual', 'schedule', 'api')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pipeline_runs_isolation" ON public.pipeline_runs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. OUTPUTS TABLE (STRICTLY APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.outputs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dataset_id TEXT REFERENCES public.datasets(id) ON DELETE SET NULL,
  domain TEXT NOT NULL,
  target_output_name TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 0,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  audit_verdict TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outputs_select_own" ON public.outputs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "outputs_insert_own" ON public.outputs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. CORRECTIONS TABLE (STRICTLY APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.corrections (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  output_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  rule_applied TEXT NOT NULL,
  critique_notes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corrections_select_own" ON public.corrections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "corrections_insert_own" ON public.corrections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. MEMORY LESSONS TABLE (STRICTLY APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  rule_statement TEXT NOT NULL,
  trigger_condition TEXT NOT NULL,
  times_applied INTEGER NOT NULL DEFAULT 1,
  source_mistake TEXT NOT NULL,
  severity_prevented TEXT NOT NULL CHECK (severity_prevented IN ('critical', 'high', 'medium')),
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.95,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_select_own" ON public.lessons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "lessons_insert_own" ON public.lessons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. AUDIT EVENTS LOG (STRICTLY APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_own" ON public.events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "events_insert_own" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- APPEND-ONLY DATABASE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.enforce_append_only()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'OmniData Governance Violation: Table % is strictly append-only. Modification (UPDATE) and Deletion (DELETE) are prohibited.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_outputs_append_only
BEFORE UPDATE OR DELETE ON public.outputs
FOR EACH ROW EXECUTE FUNCTION public.enforce_append_only();

CREATE TRIGGER trg_corrections_append_only
BEFORE UPDATE OR DELETE ON public.corrections
FOR EACH ROW EXECUTE FUNCTION public.enforce_append_only();

CREATE TRIGGER trg_lessons_append_only
BEFORE UPDATE OR DELETE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.enforce_append_only();

CREATE TRIGGER trg_events_append_only
BEFORE UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.enforce_append_only();

-- ====================================================================
-- 8. INDUSTRIAL DATA FABRIC TABLES (ISA-95 & UNS)
-- ====================================================================

-- 8A. ASSET HIERARCHY
CREATE TABLE IF NOT EXISTS public.assets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES public.assets(id) ON DELETE SET NULL,
  hierarchy_level TEXT NOT NULL CHECK (hierarchy_level IN ('enterprise', 'site', 'area', 'line', 'cell', 'machine', 'component')),
  name TEXT NOT NULL,
  make TEXT,
  model TEXT,
  commissioning_date DATE,
  status TEXT NOT NULL DEFAULT 'OPERATIONAL',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_isolation" ON public.assets
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8B. TAG REGISTRY
CREATE TABLE IF NOT EXISTS public.tags (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('float', 'integer', 'boolean', 'string')),
  sampling_rate_hz NUMERIC(8,2) NOT NULL DEFAULT 1.0,
  range_min NUMERIC,
  range_max NUMERIC,
  uns_topic TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_isolation" ON public.tags
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8C. SENSOR READINGS (TIME-SERIES)
CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id TEXT NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  timestamp_utc TIMESTAMPTZ NOT NULL,
  value_numeric NUMERIC,
  value_text TEXT,
  quality_flag TEXT NOT NULL CHECK (quality_flag IN ('PASS', 'WARNING', 'FAIL')),
  is_simulated BOOLEAN NOT NULL DEFAULT false,
  sim_seed INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- Reading access through tag ownership
CREATE POLICY "sensor_readings_select" ON public.sensor_readings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tags WHERE public.tags.id = sensor_readings.tag_id AND public.tags.user_id = auth.uid())
  );

CREATE POLICY "sensor_readings_insert" ON public.sensor_readings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tags WHERE public.tags.id = sensor_readings.tag_id AND public.tags.user_id = auth.uid())
  );

-- 8D. INDUSTRIAL ANALYSIS RESULTS (AUDITED & REVIEWED)
CREATE TABLE IF NOT EXISTS public.industrial_results (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id TEXT REFERENCES public.assets(id) ON DELETE SET NULL,
  analysis_type TEXT NOT NULL,
  inputs_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  results_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  judge_verdict TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.industrial_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "industrial_results_isolation" ON public.industrial_results
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
