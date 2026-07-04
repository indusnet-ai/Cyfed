-- Supabase Schema for FedCore & FedSOC Federated Learning Platforms
-- Create tables for tracking nodes, training rounds, and global model versions.

-- 1. Nodes Table: Tracks connected clients and their heartbeats
CREATE TABLE IF NOT EXISTS public.nodes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'organization',
    status TEXT NOT NULL DEFAULT 'offline',
    "ipAddress" TEXT DEFAULT '127.0.0.1',
    "datasetSize" INTEGER DEFAULT 0,
    "lastActive" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS and create public read access policy
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on nodes" ON public.nodes FOR SELECT USING (true);
CREATE POLICY "Allow all write access on nodes" ON public.nodes FOR ALL USING (true);

-- 2. Training Rounds Table: Telemetry logs for each FL round
CREATE TABLE IF NOT EXISTS public.training_rounds (
    round INTEGER PRIMARY KEY,
    accuracy DOUBLE PRECISION NOT NULL,
    loss DOUBLE PRECISION NOT NULL,
    precision DOUBLE PRECISION DEFAULT 0.0,
    recall DOUBLE PRECISION DEFAULT 0.0,
    f1 DOUBLE PRECISION DEFAULT 0.0,
    "participatingNodes" TEXT[] DEFAULT '{}'::TEXT[],
    duration DOUBLE PRECISION DEFAULT 0.0,
    "aggregationTime" DOUBLE PRECISION DEFAULT 0.0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.training_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on training_rounds" ON public.training_rounds FOR SELECT USING (true);
CREATE POLICY "Allow all write access on training_rounds" ON public.training_rounds FOR ALL USING (true);

-- 3. Global Models Table: Tracks model version and checkpoint links
CREATE TABLE IF NOT EXISTS public.global_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL,
    "checkpointPath" TEXT NOT NULL,
    accuracy DOUBLE PRECISION,
    loss DOUBLE PRECISION,
    precision DOUBLE PRECISION,
    recall DOUBLE PRECISION,
    f1 DOUBLE PRECISION,
    "roundNumber" INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.global_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on global_models" ON public.global_models FOR SELECT USING (true);
CREATE POLICY "Allow all write access on global_models" ON public.global_models FOR ALL USING (true);

-- 4. Prompt Versions Table: Versioning of LLM system templates
CREATE TABLE IF NOT EXISTS public.prompt_versions (
    version TEXT PRIMARY KEY,
    template TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on prompt_versions" ON public.prompt_versions FOR SELECT USING (true);
CREATE POLICY "Allow all write access on prompt_versions" ON public.prompt_versions FOR ALL USING (true);

-- 5. Incident Reports Table: Persisted AI analyst output + governance
CREATE TABLE IF NOT EXISTS public.incident_reports (
    incident_id TEXT PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    organization TEXT NOT NULL,
    predicted_attack TEXT NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    severity TEXT NOT NULL,
    executive_summary TEXT NOT NULL,
    technical_summary TEXT NOT NULL,
    mitre_attack TEXT[] DEFAULT '{}'::TEXT[],
    kill_chain_phase TEXT NOT NULL,
    affected_assets TEXT[] DEFAULT '{}'::TEXT[],
    recommended_actions TEXT[] DEFAULT '{}'::TEXT[],
    containment_steps TEXT[] DEFAULT '{}'::TEXT[],
    confidence_reasoning TEXT NOT NULL,
    limitations TEXT NOT NULL,
    "references" TEXT[] DEFAULT '{}'::TEXT[],
    explainability JSONB NOT NULL DEFAULT '{}'::JSONB,
    federated_model_version TEXT NOT NULL,
    global_checkpoint_version TEXT NOT NULL,
    dataset_version TEXT NOT NULL,
    benchmark_version TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    llm_provider TEXT NOT NULL,
    llm_model TEXT NOT NULL
);

ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on incident_reports" ON public.incident_reports FOR SELECT USING (true);
CREATE POLICY "Allow all write access on incident_reports" ON public.incident_reports FOR ALL USING (true);

-- 6. AI Evaluations Table: Scoring results for dual-evaluation
CREATE TABLE IF NOT EXISTS public.ai_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    correctness INTEGER NOT NULL,
    completeness INTEGER NOT NULL,
    consistency INTEGER NOT NULL,
    safety INTEGER NOT NULL,
    json_validity INTEGER NOT NULL,
    total_score DOUBLE PRECISION NOT NULL,
    selected BOOLEAN DEFAULT false,
    response_content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ai_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on ai_evaluations" ON public.ai_evaluations FOR SELECT USING (true);
CREATE POLICY "Allow all write access on ai_evaluations" ON public.ai_evaluations FOR ALL USING (true);

-- 7. Audit Logs Table: Tracks user actions and compliance transactions
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow all write access on audit_logs" ON public.audit_logs FOR ALL USING (true);


