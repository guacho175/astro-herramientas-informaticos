# Tutorial Generation Guidelines

**CRITICAL RULES FOR AI AGENTS & DEVELOPERS:**

Los tutoriales de este proyecto **ya no se manejan como archivos estáticos** en `src/content/tutorials`. Ahora todos los tutoriales viven en la tabla `tutorials` de **Supabase**.

Cuando la IA genere un tutorial (ej. a través de `AIGeneratorService`), debe proveer el contenido en formato JSON con la siguiente estructura:

## Required Fields:
- `title` (string): The title of the tutorial.
- `description` (string): A short SEO description (max 160 characters). **STRICTLY MANDATORY.**
- `category` (string): The category of the tutorial (e.g., Backend, DevOps, React, Redes, Ciberseguridad). **CRITICAL** for rendering the correct SVG icon inline.
- `content_markdown` (string): The actual markdown content.

## Note on Images:
We no longer use static images in `public/images/`. The frontend uses a `TutorialIcon.astro` component that dynamically renders an SVG icon based on the `category` field. You do not need to provide an `image` field unless specifically requested.

## Database Insertion
All new tutorials must be inserted directly into Supabase via the Admin API (`/api/admin/generate.json`) or a secure seed script using the `SERVICE_ROLE_KEY`. Do not create `.md` files in the repository.
