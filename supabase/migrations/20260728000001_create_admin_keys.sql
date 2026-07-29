-- Migration: Create admin_keys table
-- Date: 2026-07-28
--
-- Origen: este DDL vivía en `setup-admin.sql` en la raíz del repositorio y se
-- ejecutaba a mano desde el SQL Editor de Supabase. Se incorpora al sistema de
-- migraciones para que el esquema sea reconstruible desde el repositorio.
-- Es idempotente: la tabla ya existe en producción.

CREATE TABLE IF NOT EXISTS public.admin_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.admin_keys IS 'Hashes scrypt (formato salt:key) de contraseñas administrativas. Solo accesible con service_role.';

-- RLS activo y SIN políticas: bloquea todo acceso con las claves anon y
-- authenticated. El rol service_role omite RLS, que es como accede el endpoint
-- POST /api/admin/generate.json y los scripts de scripts/.
ALTER TABLE public.admin_keys ENABLE ROW LEVEL SECURITY;
