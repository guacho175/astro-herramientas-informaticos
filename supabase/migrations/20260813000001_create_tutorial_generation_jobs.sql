-- Coordinación e idempotencia para las generaciones automáticas de tutoriales.

CREATE TABLE IF NOT EXISTS public.tutorial_generation_jobs (
    job_key TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 1 CHECK (attempts > 0),
    tutorial_slug TEXT,
    error_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.tutorial_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Sin políticas: solo service_role puede consultar o modificar esta tabla.

CREATE OR REPLACE FUNCTION public.claim_tutorial_generation_job(p_job_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER;
BEGIN
  INSERT INTO public.tutorial_generation_jobs (job_key, status)
  VALUES (p_job_key, 'running')
  ON CONFLICT (job_key) DO UPDATE
    SET status = 'running',
        attempts = tutorial_generation_jobs.attempts + 1,
        error_code = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE tutorial_generation_jobs.status = 'failed';

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_tutorial_generation_job(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_tutorial_generation_job(TEXT) TO service_role;
