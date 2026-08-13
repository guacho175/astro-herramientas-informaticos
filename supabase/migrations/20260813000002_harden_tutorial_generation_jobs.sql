-- Leases con token de propiedad y publicación atómica para las generaciones automáticas.

ALTER TABLE public.tutorial_generation_jobs
  ADD COLUMN IF NOT EXISTS claim_token UUID,
  ADD COLUMN IF NOT EXISTS lease_until TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS tutorial_generation_jobs_running_lease_idx
  ON public.tutorial_generation_jobs (lease_until)
  WHERE status = 'running';

-- Repara el estado histórico en el que el INSERT del tutorial pudo completarse
-- antes de fallar el UPDATE separado del job.
UPDATE public.tutorial_generation_jobs AS generation_job
SET status = 'completed',
    tutorial_slug = (
      SELECT tutorial.slug
      FROM public.tutorials AS tutorial
      WHERE tutorial.slug LIKE generation_job.job_key || '-%'
      ORDER BY tutorial.created_at ASC
      LIMIT 1
    ),
    error_code = NULL,
    claim_token = NULL,
    lease_until = NULL,
    updated_at = now()
WHERE generation_job.status <> 'completed'
  AND generation_job.job_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  AND EXISTS (
    SELECT 1
    FROM public.tutorials AS tutorial
    WHERE tutorial.slug LIKE generation_job.job_key || '-%'
  );

-- Desde esta versión los lotes promocionales no incluyen fecha en la clave.
-- Conserva como alias completed los lotes históricos para impedir que el mismo
-- batchId vuelva a publicarse tras el cambio de formato o de día UTC.
INSERT INTO public.tutorial_generation_jobs (
  job_key,
  status,
  attempts,
  tutorial_slug,
  error_code,
  created_at,
  updated_at
)
SELECT DISTINCT ON (stable_job_key)
  stable_job_key,
  'completed',
  historical_job.attempts,
  historical_job.tutorial_slug,
  NULL,
  historical_job.created_at,
  now()
FROM (
  SELECT
    regexp_replace(
      job_key,
      '-[0-9]{4}-[0-9]{2}-[0-9]{2}(-[0-9]{2})$',
      '\1'
    ) AS stable_job_key,
    attempts,
    tutorial_slug,
    created_at,
    updated_at
  FROM public.tutorial_generation_jobs
  WHERE status = 'completed'
    AND job_key ~ '^promocion-ling-[a-z0-9]+(-[a-z0-9]+)*-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2}$'
) AS historical_job
ORDER BY stable_job_key, historical_job.updated_at DESC
ON CONFLICT (job_key) DO UPDATE
SET status = 'completed',
    attempts = GREATEST(tutorial_generation_jobs.attempts, EXCLUDED.attempts),
    tutorial_slug = COALESCE(tutorial_generation_jobs.tutorial_slug, EXCLUDED.tutorial_slug),
    error_code = NULL,
    claim_token = NULL,
    lease_until = NULL,
    updated_at = now();

-- La versión anterior devolvía BOOLEAN y no podía distinguir al propietario del job.
DROP FUNCTION IF EXISTS public.claim_tutorial_generation_job(TEXT);

CREATE FUNCTION public.claim_tutorial_generation_job(
  p_job_key TEXT,
  p_lease_seconds INTEGER DEFAULT 360
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_claim_token UUID := gen_random_uuid();
  acquired_claim_token UUID;
BEGIN
  IF p_job_key IS NULL
     OR p_job_key !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     OR length(p_job_key) > 120 THEN
    RAISE EXCEPTION 'Invalid tutorial generation job key' USING ERRCODE = '22023';
  END IF;

  IF p_lease_seconds IS NULL OR p_lease_seconds < 60 OR p_lease_seconds > 900 THEN
    RAISE EXCEPTION 'Invalid tutorial generation lease duration' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.tutorial_generation_jobs (
    job_key,
    status,
    claim_token,
    lease_until
  )
  VALUES (
    btrim(p_job_key),
    'running',
    new_claim_token,
    now() + make_interval(secs => p_lease_seconds)
  )
  ON CONFLICT (job_key) DO UPDATE
    SET status = 'running',
        attempts = tutorial_generation_jobs.attempts + 1,
        tutorial_slug = NULL,
        error_code = NULL,
        claim_token = new_claim_token,
        lease_until = now() + make_interval(secs => p_lease_seconds),
        updated_at = now()
    WHERE tutorial_generation_jobs.status = 'failed'
       OR (
         tutorial_generation_jobs.status = 'running'
         AND (
           tutorial_generation_jobs.lease_until IS NULL
           OR tutorial_generation_jobs.lease_until <= now()
         )
       )
  RETURNING claim_token INTO acquired_claim_token;

  RETURN acquired_claim_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_tutorial_generation_job(
  p_job_key TEXT,
  p_claim_token UUID,
  p_error_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected INTEGER;
BEGIN
  IF p_job_key IS NULL
     OR p_job_key !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     OR length(p_job_key) > 120 THEN
    RAISE EXCEPTION 'Invalid tutorial generation job key' USING ERRCODE = '22023';
  END IF;

  IF p_claim_token IS NULL THEN
    RAISE EXCEPTION 'Invalid tutorial generation claim token' USING ERRCODE = '22023';
  END IF;

  UPDATE public.tutorial_generation_jobs
  SET status = 'failed',
      error_code = left(COALESCE(NULLIF(btrim(p_error_code), ''), 'GenerationError'), 100),
      claim_token = NULL,
      lease_until = NULL,
      updated_at = now()
  WHERE job_key = btrim(p_job_key)
    AND status = 'running'
    AND claim_token = p_claim_token
    AND lease_until > now();

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_tutorial_generation_job(
  p_job_key TEXT,
  p_claim_token UUID,
  p_tutorial JSONB
)
RETURNS SETOF public.tutorials
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  generated_tutorial public.tutorials%ROWTYPE;
BEGIN
  IF p_job_key IS NULL
     OR p_job_key !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     OR length(p_job_key) > 120 THEN
    RAISE EXCEPTION 'Invalid tutorial generation job key' USING ERRCODE = '22023';
  END IF;

  IF p_claim_token IS NULL THEN
    RAISE EXCEPTION 'Invalid tutorial generation claim token' USING ERRCODE = '22023';
  END IF;

  IF p_tutorial IS NULL OR jsonb_typeof(p_tutorial) <> 'object' THEN
    RAISE EXCEPTION 'Invalid generated tutorial payload' USING ERRCODE = '22023';
  END IF;

  IF NULLIF(btrim(p_tutorial->>'slug'), '') IS NULL
     OR NULLIF(btrim(p_tutorial->>'title'), '') IS NULL
     OR NULLIF(btrim(p_tutorial->>'description'), '') IS NULL
     OR NULLIF(btrim(p_tutorial->>'content_markdown'), '') IS NULL THEN
    RAISE EXCEPTION 'Generated tutorial is missing required fields' USING ERRCODE = '22023';
  END IF;

  -- Bloquea la fila y verifica propiedad antes de insertar. Si el lease fue
  -- reclamado, el token anterior ya no puede publicar ni completar el job.
  PERFORM 1
  FROM public.tutorial_generation_jobs
  WHERE job_key = btrim(p_job_key)
    AND status = 'running'
    AND claim_token = p_claim_token
    AND lease_until > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tutorial generation job is not owned by this claim'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.tutorials (
    slug,
    title,
    description,
    content_markdown,
    image,
    category,
    views,
    is_premium
  )
  VALUES (
    btrim(p_tutorial->>'slug'),
    btrim(p_tutorial->>'title'),
    btrim(p_tutorial->>'description'),
    btrim(p_tutorial->>'content_markdown'),
    COALESCE(
      NULLIF(btrim(p_tutorial->>'image'), ''),
      'https://cdn-icons-png.flaticon.com/512/732/732212.png'
    ),
    COALESCE(NULLIF(btrim(p_tutorial->>'category'), ''), 'Guía'),
    COALESCE((p_tutorial->>'views')::BIGINT, 0),
    COALESCE((p_tutorial->>'is_premium')::BOOLEAN, FALSE)
  )
  RETURNING * INTO generated_tutorial;

  UPDATE public.tutorial_generation_jobs
  SET status = 'completed',
      tutorial_slug = generated_tutorial.slug,
      error_code = NULL,
      claim_token = NULL,
      lease_until = NULL,
      updated_at = now()
  WHERE job_key = btrim(p_job_key)
    AND status = 'running'
    AND claim_token = p_claim_token
    AND lease_until > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tutorial generation job ownership changed during publication'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEXT generated_tutorial;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_tutorial_generation_job(TEXT, INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_tutorial_generation_job(TEXT, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.publish_tutorial_generation_job(TEXT, UUID, JSONB)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_tutorial_generation_job(TEXT, INTEGER)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_tutorial_generation_job(TEXT, UUID, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.publish_tutorial_generation_job(TEXT, UUID, JSONB)
  TO service_role;
