-- Ejecuta este comando en el SQL Editor de tu Dashboard de Supabase

-- 1. Crear tabla admin_keys
CREATE TABLE IF NOT EXISTS public.admin_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Asegurar que solo el Service Role (Backend) pueda leer esta tabla por defecto
ALTER TABLE public.admin_keys ENABLE ROW LEVEL SECURITY;

-- 3. Crear política para permitir que el Service Role y peticiones anon/authenticated NO puedan leerla
-- (Por defecto RLS bloquea todo acceso público a menos que haya política,
-- pero el service_role bypasses RLS, así que el backend podrá acceder sin problemas)

-- Opcional: Insertar un comentario descriptivo
COMMENT ON TABLE public.admin_keys IS 'Tabla para almacenar hashes de contraseñas de administradores.';
