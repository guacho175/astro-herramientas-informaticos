# Estado actual del sistema

> **Fuente de verdad:** este documento es canónico para el estado actual (stack, arquitectura, entornos y limitaciones).
> **Última verificación:** 2026-08-13

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
| Astro | ^5.13 | `output: 'server'` — **SSR por defecto**, con las calculadoras pregeneradas (ver más abajo) |
| @astrojs/vercel | ^8 | adaptador de despliegue |
| Tailwind CSS | ^3.4 | vía `@astrojs/tailwind` + PostCSS; plugin `typography` |
| @supabase/supabase-js | ^2.109 | base de datos y almacén de contenido |
| marked | ^18 | Markdown → HTML en tiempo de request |
| ws | ^8.21 | transporte de realtime exigido por el cliente Supabase en Node |
| dotenv | ^17 | carga de entorno en los scripts de `scripts/` |
| AI SDK | ^7 | salida estructurada y acceso desacoplado a Vercel AI Gateway |

**No hay** TypeScript como dependencia declarada, linter, formateador ni framework de pruebas. La única validación ejecutable del código es `npm run build`.

## 3. Arquitectura

```
src/pages/                    rutas SSR y endpoints
src/lib/domain/               modelo Tutorial (interface)
src/lib/application/          TutorialService, AIGeneratorService
src/lib/infrastructure/       repositorios de lectura pública y escritura administrativa
src/lib/supabase/client.ts    cliente anónimo (solo lectura pública)
src/components/               UI y calculadoras (autónomas, sin backend)
src/data/*.js                 catálogos estáticos de herramientas y calculadoras
supabase/migrations/          esquema de base de datos (autoritativo)
scripts/                      utilidades operativas con permisos de servicio
```

Separación por capas: las páginas llaman al **servicio**, nunca al repositorio ni a Supabase directamente. `TutorialRepository` cubre la lectura pública y `TutorialAdminRepository` la escritura privilegiada.

La escritura automática usa `TutorialAdminRepository`, un repositorio separado y exclusivo de servidor que crea su cliente con `service_role`. El cliente público continúa siendo de solo lectura.

### Rutas pregeneradas

Todo se renderiza por request salvo las calculadoras:

- `/blog/calculadoras/[slug]` — las seis calculadoras son componentes autónomos sin datos de servidor; se pregeneran desde `src/data/calculators.js` con `getStaticPaths()`.

`/api/search.json` consulta Supabase en cada regeneración de caché y usa `s-maxage=300, stale-while-revalidate=3600`, por lo que incorpora tutoriales creados después del despliegue.

Los tutoriales (`/blog/guias/**`) **nunca** se pregeneran: dependen de la base de datos.

### Flujo de lectura de una guía

`GET /blog/guias/<slug>` → `tutorialService.getTutorialContent()` → `TutorialRepository.getBySlug()` → Supabase → `marked.parse()` → HTML.
La página fija `Cache-Control: s-maxage=3600, stale-while-revalidate=86400` en el edge. Las vistas se incrementan en *fire and forget* vía el RPC `increment_tutorial_views`.

### Flujos de generación

- **Manual:** `POST /api/admin/generate.json` → contraseña contra `admin_keys` → `AIGeneratorService` → cascada Gemini → validación → inserción con cliente de servicio.
- **Diario:** Vercel Cron → `GET /api/cron/generate-tutorials.json` → fuentes oficiales y catálogo curado → `VercelAIGeneratorService` → Vercel AI Gateway → validación estructural → `TutorialAdminRepository`.
- **Promocional temporal:** `POST /api/admin/generate-promotion.json` ejecuta lotes protegidos de hasta dos tutoriales mientras la ventana esté habilitada.

La ejecución diaria es secuencial, genera dos tutoriales y reserva una clave por fecha y posición mediante `claim_tutorial_generation_job`; los jobs fallidos pueden reintentarse y los completados se omiten.

## 4. Datos

Tres tablas en Supabase:

- **`tutorials`** — migración `supabase/migrations/20260724000001_create_tutorials_table.sql`. RLS activo: lectura pública; `INSERT`/`UPDATE` permitidos a cualquier rol `authenticated`; sin política de `DELETE`. Incluye el RPC `increment_tutorial_views` (`SECURITY DEFINER`).
- **`admin_keys`** — migración `supabase/migrations/20260728000001_create_admin_keys.sql`. Guarda hashes `scrypt` en formato `salt:key`. RLS activo sin políticas: solo accesible con `service_role`.
- **`tutorial_generation_jobs`** — migración `supabase/migrations/20260813000001_create_tutorial_generation_jobs.sql`. Coordina idempotencia, intentos y resultado de las generaciones automáticas; RLS activo sin políticas y RPC de reserva limitado a `service_role`.

Las migraciones son la fuente autoritativa del esquema. Este documento solo las resume.

## 5. Entornos y configuración

Variables requeridas (**nombres únicamente; nunca escribas valores en documentación ni en commits**):

| Variable | Ámbito | Uso |
| :--- | :--- | :--- |
| `PUBLIC_SUPABASE_URL` | cliente y servidor | endpoint del proyecto Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | cliente y servidor | lectura pública sujeta a RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo servidor** | omite RLS; usado por el endpoint admin y los scripts |
| `GEMINI_API_KEY` | solo servidor | generación de contenido |
| `AI_GATEWAY_API_KEY` | solo servidor, alternativa a OIDC | autenticación manual en Vercel AI Gateway |
| `VERCEL_AI_MODEL` | solo servidor, opcional | modelo Gateway; por defecto `inclusionai/ling-3.0-tiny-free` |
| `VERCEL_AI_FALLBACK_MODELS` | solo servidor, opcional | modelos Gateway alternativos, separados por coma y probados en orden |
| `CRON_SECRET` | solo servidor | autenticación del cron y del lote promocional |
| `PROMOTION_BATCH_ENABLED` | solo servidor | habilita explícitamente el endpoint promocional temporal |
| `PROMOTION_END_AT` | solo servidor, opcional | fin ISO-8601 de la ventana promocional |

En despliegues Vercel, AI Gateway puede autenticarse con OIDC administrado por la plataforma. `AI_GATEWAY_API_KEY` queda como alternativa para entornos sin OIDC.

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

1. **RLS permisiva en `tutorials`** — cualquier rol `authenticated` puede insertar y actualizar. Hoy no existe registro de usuarios, por lo que la superficie real es pequeña, pero la política no es la deseable a largo plazo.
2. **Sin pruebas automatizadas ni verificación de tipos** — no existe `npm test`, `npm run lint` ni `astro check`.
3. **No existe endpoint público de lectura de tutoriales** — el consumo externo previsto en el ADR 0003 todavía no tiene superficie implementada.
4. **Promoción de modelo temporal** — `inclusionai/ling-3.0-tiny-free` puede dejar de estar disponible o ser gratuito. `VERCEL_AI_MODEL` y `VERCEL_AI_FALLBACK_MODELS` deben apuntar a modelos vigentes; el código no garantiza gratuidad.
5. **Fuentes emergentes con degradación** — si los feeds oficiales no responden, el cron usa un catálogo curado. Esto mantiene continuidad, pero puede producir una actualización de un tema conocido en vez de una noticia del día.
6. **Scripts de migración obsoletos** — `scripts/seed-tutorials.mjs` y `scripts/migrate-to-supabase.js` leen de `src/content/tutorials/`, directorio eliminado el 2026-07-28. No funcionan. Se conservan por valor histórico; candidatos a eliminación.
7. **Dependencias con avisos de seguridad** — al 2026-08-13, `npm audit --omit=dev` reporta 18 vulnerabilidades (15 altas, 2 moderadas y 1 baja), principalmente en Astro, el adaptador de Vercel y dependencias transitivas. La corrección completa requiere evaluar actualizaciones mayores fuera del alcance de la automatización de contenido; el reporte no atribuye avisos a AI SDK.
8. **Cuota externa de AI Gateway** — la automatización necesita cuota o créditos disponibles en la cuenta Vercel. Un `HTTP 429` deja el job fallido y reintentable; no se publica contenido parcial ni se duplica el cupo diario.
