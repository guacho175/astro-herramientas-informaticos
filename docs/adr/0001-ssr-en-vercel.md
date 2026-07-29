# ADR 0001 — Renderizado en servidor (SSR) sobre Vercel

- **Estado:** aceptado
- **Fecha:** registrado retroactivamente el 2026-07-28
- **Contexto de origen:** decisión ya implementada; este ADR documenta el estado vigente

## Contexto

El proyecto nació como sitio estático (SSG) con tutoriales en archivos Markdown. Al migrar el contenido a Supabase ([ADR 0002](0002-supabase-como-cms-de-tutoriales.md)), un sitio estático habría exigido un rebuild y un redespliegue por cada tutorial creado, lo que es incompatible con un generador de contenido bajo demanda.

Además, el endpoint de generación necesita ejecutarse en servidor: usa `SUPABASE_SERVICE_ROLE_KEY` y la API de Gemini, secretos que no pueden viajar al cliente.

## Decisión

`astro.config.mjs` usa `output: 'server'` con el adaptador `@astrojs/vercel`. Todas las páginas se renderizan por request; el rendimiento se sostiene con cabeceras `Cache-Control` en el edge (`s-maxage` + `stale-while-revalidate`) fijadas por cada página.

## Consecuencias

- El contenido nuevo aparece sin necesidad de redesplegar.
- Es posible alojar endpoints con secretos de servidor.
- **No existe `dist/**/index.html` por artículo.** Cualquier procedimiento de verificación que inspeccione la carpeta `dist` buscando un tutorial es inválido.
- Cada request no cacheado consume una lectura de Supabase y una invocación de función; de ahí la importancia de las cabeceras de caché.
- Excepciones deliberadas con `prerender = true`, por no depender de la base de datos:
  - `/api/search.json`, que congela el índice de búsqueda al momento del build (limitación 2 de [PROJECT_STATE.md](../PROJECT_STATE.md));
  - `/blog/calculadoras/[slug]`, cuyas seis páginas se generan desde `src/data/calculators.js`.

## Alternativas descartadas

- **Mantener SSG con rebuild por webhook:** latencia de minutos entre creación y publicación, y consumo de minutos de build por cada artículo.
- **Renderizado en cliente:** penaliza el SEO, que es el objetivo principal de los tutoriales.
