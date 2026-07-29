# ADR 0002 — Supabase como almacén único de tutoriales

- **Estado:** aceptado
- **Fecha:** registrado retroactivamente el 2026-07-28
- **Contexto de origen:** migración ejecutada el 2026-07-24 (`supabase/migrations/20260724000001_create_tutorials_table.sql`)

## Contexto

Los tutoriales vivían como archivos `.md` en `src/content/tutorials/`, validados por una colección de contenido de Astro con esquema Zod. Ese modelo impedía:

- crear contenido sin un commit y un redespliegue;
- que un generador automático publicara sin tocar el repositorio;
- llevar métricas por artículo (vistas);
- que otros frontends consumieran el mismo contenido.

## Decisión

Todos los tutoriales viven en la tabla `tutorials` de Supabase. El acceso pasa por una única capa: `TutorialRepository` → `TutorialService` → páginas.

Las colecciones de contenido de Astro y el directorio `src/content/` fueron **eliminados**. Existían dos archivos `content.config.ts` duplicados, ninguno con consumidores.

## Consecuencias

- Publicar es un `INSERT`, no un commit.
- Se pueden contar vistas de forma atómica (RPC `increment_tutorial_views`).
- El repositorio deja de ser la fuente del contenido: **una copia del repositorio ya no basta para reconstruir el sitio**, hace falta la base de datos.
- La disponibilidad del sitio depende de Supabase.
- Crear archivos `.md` de tutoriales queda prohibido; el procedimiento vigente está en [CONTENT.md](../CONTENT.md).

## Decisión firme

**No se volverá al contenido en archivos.** Cualquier propuesta de reintroducir colecciones de Astro para tutoriales debe considerarse contraria a esta decisión salvo que este ADR se sustituya explícitamente.
