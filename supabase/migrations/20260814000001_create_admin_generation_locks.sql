-- Exclusión mutua durable para los lotes iniciados desde el panel admin.
-- Evita una cola de generaciones incluso si Vercel atiende solicitudes en
-- instancias distintas. Los locks vencidos se pueden recuperar.

CREATE TABLE IF NOT EXISTS public.admin_generation_locks (
  lock_key TEXT PRIMARY KEY CHECK (lock_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  claim_token UUID NOT NULL,
  lease_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_generation_locks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.claim_admin_generation_lock(
  p_lock_key TEXT,
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
  IF p_lock_key IS NULL
     OR p_lock_key !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     OR length(p_lock_key) > 80 THEN
    RAISE EXCEPTION 'Invalid admin generation lock key' USING ERRCODE = '22023';
  END IF;

  IF p_lease_seconds IS NULL OR p_lease_seconds < 60 OR p_lease_seconds > 900 THEN
    RAISE EXCEPTION 'Invalid admin generation lock lease' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.admin_generation_locks (lock_key, claim_token, lease_until)
  VALUES (
    btrim(p_lock_key),
    new_claim_token,
    now() + make_interval(secs => p_lease_seconds)
  )
  ON CONFLICT (lock_key) DO UPDATE
    SET claim_token = new_claim_token,
        lease_until = now() + make_interval(secs => p_lease_seconds),
        updated_at = now()
    WHERE admin_generation_locks.lease_until <= now()
  RETURNING claim_token INTO acquired_claim_token;

  RETURN acquired_claim_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_admin_generation_lock(
  p_lock_key TEXT,
  p_claim_token UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected INTEGER;
BEGIN
  IF p_lock_key IS NULL
     OR p_lock_key !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     OR length(p_lock_key) > 80 THEN
    RAISE EXCEPTION 'Invalid admin generation lock key' USING ERRCODE = '22023';
  END IF;

  IF p_claim_token IS NULL THEN
    RAISE EXCEPTION 'Invalid admin generation lock token' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.admin_generation_locks
  WHERE lock_key = btrim(p_lock_key)
    AND claim_token = p_claim_token;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected = 1;
END;
$$;

REVOKE ALL ON TABLE public.admin_generation_locks FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_admin_generation_lock(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_admin_generation_lock(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_generation_lock(TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_admin_generation_lock(TEXT, UUID) TO service_role;
