# Estado actual del sistema

> **Fuente de verdad:** este documento es canónico para el estado actual (stack, arquitectura, entornos y limitaciones).
> **Última verificación:** 2026-07-28

Describe **lo que el sistema es hoy**. No contiene planes futuros, historial ni instrucciones para agentes.
Decisiones → [`adr/`](adr/) · Historial → `git log` · Reglas para agentes → [`../AGENTS.md`](../AGENTS.md).

---

## 1. Rol del proyecto

Este repositorio es el **motor de generación y el backend canónico de tutoriales**. Genera contenido con IA, lo persiste en Supabase y lo sirve.

El portal público `herramientastic.orbynexdigital.cl` es hoy el primer consumidor de ese contenido, no la razón de ser del proyecto. Está previsto que otros frontends consuman los tutoriales en el futuro, vía API o directamente desde Supabase. Ver [ADR 0003](adr/0003-repositorio-como-backend-canonico-de-contenido.md).

Consecuencia práctica: el esquema de la tabla `tutorials` y el contrato de los endpoints son **superficie pública potencial**. Cambiarlos exige actualizar [API.md](API.md).

## 2. Stack

| Pieza | Versión | Notas |
| :--- | :--- | :--- |
| Astro | ^5.13 | `output: 'server'` — **SSR por defecto**, con dos excepciones pregeneradas (ver más abajo) |
| @astrojs/vercel | ^8 | adaptador de despliegue |
| Tailwind CSS | ^3.4 | vía `@astrojs/tailwind` + PostCSS; plugin `typography` |
| @supabase/supabase-js | ^2.109 | base de datos y almacén de contenido |
| marked | ^18 | Markdown → HTML en tiempo de request |
| ws | ^8.21 | transporte de realtime exigido por el cliente Supabase en Node |
| dotenv | ^17 | carga de entorno en los scripts de `scripts/` |

**No hay** TypeScript como dependencia declarada, linter, formateador ni framework de pruebas. La única validación ejecutable del código es `npm run build`.

## 3. Arquitectura

```
src/pages/                    rutas SSR y endpoints
src/lib/domain/               modelo Tutorial (interface)
src/lib/application/          TutorialService, AIGeneratorService
src/lib/infrastructure/       TutorialRepository — único punto de acceso a la tabla
src/lib/supabase/client.ts    cliente anónimo (solo lectura pública)
src/components/               UI y calculadoras (autónomas, sin backend)
src/data/*.js                 catálogos estáticos de herramientas y calculadoras
supabase/migrations/          esquema de base de datos (autoritativo)
scripts/                      utilidades operativas con permisos de servicio
```

Separación por capas: las páginas llaman al **servicio**, nunca al repositorio ni a Supabase directamente. `TutorialRepository` es el único archivo que consulta la tabla `tutorials`.

### Rutas pregeneradas

Todo se renderiza por request salvo dos rutas que declaran `export const prerender = true`:

- `/api/search.json` — índice del buscador, congelado en el build (limitación 2).
- `/blog/calculadoras/[slug]` — las seis calculadoras son componentes autónomos sin datos de servidor; se pregeneran desde `src/data/calculators.js` con `getStaticPaths()`.

Los tutoriales (`/blog/guias/**`) **nunca** se pregeneran: dependen de la base de datos.

### Flujo de lectura de una guía

`GET /blog/guias/<slug>` → `tutorialService.getTutorialContent()` → `TutorialRepository.getBySlug()` → Supabase → `marked.parse()` → HTML.
La página fija `Cache-Control: s-maxage=3600, stale-while-revalidate=86400` en el edge. Las vistas se incrementan en *fire and forget* vía el RPC `increment_tutorial_views`.

### Flujo de generación

`POST /api/admin/generate.json` → verificación de contraseña contra `admin_keys` → `AIGeneratorService` (Gemini, cascada de 7 modelos con fallback ante error o cuota 429) → derivación del slug desde el título → `INSERT` con cliente de servicio. Detalle en [API.md](API.md).

## 4. Datos

Dos tablas en Supabase:

- **`tutorials`** — migración `supabase/migrations/20260724000001_create_tutorials_table.sql`. RLS activo: lectura pública; `INSERT`/`UPDATE` permitidos a cualquier rol `authenticated`; sin política de `DELETE`. Incluye el RPC `increment_tutorial_views` (`SECURITY DEFINER`).
- **`admin_keys`** — migración `supabase/migrations/20260728000001_create_admin_keys.sql`. Guarda hashes `scrypt` en formato `salt:key`. RLS activo sin políticas: solo accesible con `service_role`.

Las migraciones son la fuente autoritativa del esquema. Este documento solo las resume.

## 5. Entornos y configuración

Variables requeridas (**nombres únicamente; nunca escribas valores en documentación ni en commits**):

| Variable | Ámbito | Uso |
| :--- | :--- | :--- |
| `PUBLIC_SUPABASE_URL` | cliente y servidor | endpoint del proyecto Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | cliente y servidor | lectura pública sujeta a RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo servidor** | omite RLS; usado por el endpoint admin y los scripts |
| `GEMINI_API_KEY` | solo servidor | generación de contenido |

En local se leen de `.env` (ignorado por Git). En producción se configuran en el proyecto de Vercel.

## 6. Comandos

| Comando | Efecto |
| :--- | :--- |
| `npm run dev` | servidor de desarrollo en `localhost:4321` |
| `npm run build` | compilación de producción — **única validación de código disponible** |
| `npm run preview` | previsualización local de la compilación |
| `node scripts/check-docs.mjs` | validación documental |
| `npx vercel` / `npx vercel --prod` | despliegue manual |

El despliegue habitual es automático: Vercel construye en cada push a `main`.

## 7. Limitaciones conocidas

1. **Logging de diagnóstico activo en el endpoint admin** — `src/pages/api/admin/generate.json.ts` registra en consola la presencia de variables de entorno, un prefijo de la URL de Supabase y un prefijo del hash almacenado; además devuelve `dbError` y banderas de entorno en el cuerpo de la respuesta 500. Introducido como diagnóstico temporal en el commit `ca5aef6`. **Debe retirarse antes de exponer cualquier endpoint público de lectura.**
2. **El buscador se congela en el build** — `/api/search.json` declara `prerender = true`, por lo que su índice refleja el contenido del último despliegue. Los tutoriales creados después no aparecen en el buscador hasta el siguiente build, aunque sí son accesibles por su URL y aparecen en el listado paginado.
3. **RLS permisiva en `tutorials`** — cualquier rol `authenticated` puede insertar y actualizar. Hoy no existe registro de usuarios, por lo que la superficie real es pequeña, pero la política no es la deseable a largo plazo.
4. **Sin pruebas automatizadas ni verificación de tipos** — no existe `npm test`, `npm run lint` ni `astro check`.
5. **No existe endpoint público de lectura de tutoriales** — el consumo externo previsto en el ADR 0003 todavía no tiene superficie implementada.
6. **Scripts de migración obsoletos** — `scripts/seed-tutorials.mjs` y `scripts/migrate-to-supabase.js` leen de `src/content/tutorials/`, directorio eliminado el 2026-07-28. No funcionan. Se conservan por valor histórico; candidatos a eliminación.
