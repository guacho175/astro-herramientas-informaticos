# Tutorial Generation Guidelines

**CRITICAL RULES FOR AI AGENTS & DEVELOPERS:**

Whenever you generate, create, or modify a markdown tutorial for this Astro project (inside `src/content/tutorials` or any API), you **MUST** ensure the YAML frontmatter strictly complies with the Astro Content Collection Schema defined in `src/content/config.ts`.

## Required Frontmatter Fields:
- `title` (string): The title of the tutorial.
- `slug` (string): The URL slug.
- `description` (string): A short SEO description (max 160 characters). **This field is STRICTLY MANDATORY. Omitting it will break the production build.**
- `category` (string): The category of the tutorial.
- `image` (string): Path to the cover image.

## Example of Valid Frontmatter:
```yaml
---
title: "Tu Título Atractivo"
slug: "tu-titulo-atractivo"
description: "Aprende todo lo necesario sobre X para mejorar Y. Guía paso a paso."
category: "Frontend"
image: "/images/tutorials/placeholder.png"
---
```

## Consequences of Non-Compliance:
Failing to include the `description` field will result in a fatal `[InvalidContentEntryDataError]` during the Vercel Build process, crashing the entire CI/CD pipeline.
