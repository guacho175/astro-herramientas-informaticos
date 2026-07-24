-- Migration: Create Tutorials Table and RLS Policies
-- Date: 2026-07-24

CREATE TABLE public.tutorials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    image TEXT DEFAULT 'https://cdn-icons-png.flaticon.com/512/732/732212.png',
    category TEXT DEFAULT 'Guía',
    views BIGINT DEFAULT 0,
    is_premium BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- Política 1: Todos los usuarios (anónimos y autenticados) pueden leer los tutoriales
CREATE POLICY "Public profiles are viewable by everyone."
ON public.tutorials FOR SELECT
USING ( true );

-- Política 2: Solo roles 'authenticated' (o super admins) pueden insertar o modificar.
-- Por seguridad, limitamos la inserción solo a Service Roles o usuarios admin si tienes una tabla de roles.
-- En este caso básico, permitiremos insert a roles autenticados (pensando en un CMS interno).
CREATE POLICY "Users can insert if authenticated"
ON public.tutorials FOR INSERT
TO authenticated
WITH CHECK ( true );

CREATE POLICY "Users can update if authenticated"
ON public.tutorials FOR UPDATE
TO authenticated
USING ( true )
WITH CHECK ( true );

-- RPC: Función de base de datos para incrementar vistas de manera atómica (evita condiciones de carrera)
CREATE OR REPLACE FUNCTION increment_tutorial_views(tutorial_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.tutorials
  SET views = views + 1
  WHERE slug = tutorial_slug;
END;
$$;
