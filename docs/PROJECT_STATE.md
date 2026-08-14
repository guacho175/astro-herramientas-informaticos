# Estado actual del sistema

> **Fuente de verdad:** este documento es canónico para el estado actual (stack, arquitectura, entornos y limitaciones).
> **Última verificación:** 2026-08-14

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

- **Manual:** `POST /api/admin/login.json` → contraseña contra `admin_keys` → cookie de sesión firmada; después `POST /api/admin/generate.json` → `AIGeneratorService` → cascada Gemini → validación → inserción con cliente de servicio.
- **Diario:** un Vercel Cron a las 09:00 UTC → `generate-tutorials.json` → dos slots secuenciales → investigación primaria segura y catálogo curado → `VercelAIGeneratorService` → Vercel AI Gateway con `google/gemini-2.5-flash` → validación → publicación atómica en `TutorialAdminRepository`. El panel autenticado puede crear lotes independientes de dos tutoriales mediante `POST /api/admin/generate-emerging.json`; no invoca la ruta cron ni expone su secreto. El panel admite un único lote en curso mediante un lock de Supabase, por lo que rechaza solicitudes simultáneas sin crear una cola.
- **Promocional temporal:** `POST /api/admin/generate-promotion.json` conserva el contrato para diagnósticos controlados, pero está deshabilitado en producción.

La única invocación diaria genera hasta dos tutoriales, uno por vez; los slots `1` y `2` mantienen separados los cupos y sus resultados. Por la precisión horaria del plan Hobby, Vercel puede iniciarla entre las 09:00 y las 09:59 UTC: en Chile continental la ventana es 05:00–05:59 durante UTC-4 y 06:00–06:59 durante UTC-3. `claim_tutorial_generation_job` entrega un token con lease de seis minutos: un lease vencido se recupera y solo su propietario vigente puede publicar o fallar. La inserción y el cierre `completed` comparten transacción.

## 4. Datos

Cuatro tablas en Supabase:

- **`tutorials`** — migración `supabase/migrations/20260724000001_create_tutorials_table.sql`. RLS activo: lectura pública; `INSERT`/`UPDATE` permitidos a cualquier rol `authenticated`; sin política de `DELETE`. Incluye el RPC `increment_tutorial_views` (`SECURITY DEFINER`).
- **`admin_keys`** — migración `supabase/migrations/20260728000001_create_admin_keys.sql`. Guarda hashes `scrypt` en formato `salt:key`. RLS activo sin políticas: solo accesible con `service_role`.
- **`tutorial_generation_jobs`** — migraciones `20260813000001_create_tutorial_generation_jobs.sql` y `20260813000002_harden_tutorial_generation_jobs.sql`. Coordina idempotencia, intentos, leases y propiedad; RLS activo sin políticas y RPC limitados a `service_role`.
- **`admin_generation_locks`** — migración `20260814000001_create_admin_generation_locks.sql`. Coordina exclusión mutua durable de los lotes iniciados desde el panel; RLS activo sin políticas y RPC limitados a `service_role`.

Las migraciones son la fuente autoritativa del esquema. Este documento solo las resume.

## 5. Entornos y configuración

Variables requeridas (**nombres únicamente; nunca escribas valores en documentación ni en commits**):

| Variable | Ámbito | Uso |
| :--- | :--- | :--- |
| `PUBLIC_SUPABASE_URL` | cliente y servidor | endpoint del proyecto Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | cliente y servidor | lectura pública sujeta a RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo servidor** | omite RLS; usado por el endpoint admin y los scripts |
| `ADMIN_SESSION_SECRET` | **solo servidor** | firma de las cookies de sesión administrativa; independiente de secretos de cron, IA y Supabase |
| `GEMINI_API_KEY` | solo servidor | generación de contenido |
| `AI_GATEWAY_API_KEY` | solo servidor, alternativa a OIDC | autenticación manual en Vercel AI Gateway |
| `VERCEL_AI_MODEL` | solo servidor, opcional | modelo Gateway; producción usa `google/gemini-2.5-flash` |
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
4. **Modelo externo variable** — producción usa exclusivamente `google/gemini-2.5-flash` mediante Vercel AI Gateway porque está habilitado para los créditos mensuales del nivel gratuito. La disponibilidad y el precio pueden cambiar; antes de sustituirlo debe comprobarse el filtro Free Tier del catálogo de Vercel.
5. **Fuentes emergentes con degradación** — la investigación primaria aplica restricciones SSRF, timeout y tamaño; si los feeds o documentos oficiales no responden, usa metadatos del feed o un catálogo curado. Puede producir una actualización de un tema conocido en vez de una noticia del día.
6. **Scripts de migración obsoletos** — `scripts/seed-tutorials.mjs` y `scripts/migrate-to-supabase.js` leen de `src/content/tutorials/`, directorio eliminado el 2026-07-28. No funcionan. Se conservan por valor histórico; candidatos a eliminación.
7. **Dependencias con avisos de seguridad** — al 2026-08-13, `npm audit --omit=dev` reporta 18 vulnerabilidades (15 altas, 2 moderadas y 1 baja), principalmente en Astro, el adaptador de Vercel y dependencias transitivas. La corrección completa requiere evaluar actualizaciones mayores fuera del alcance de la automatización de contenido; el reporte no atribuye avisos a AI SDK.
8. **Cuota externa de AI Gateway** — la automatización necesita cuota o créditos disponibles en la cuenta Vercel. Un `HTTP 429` deja el job fallido y reintentable; no se publica contenido parcial ni se duplica el cupo diario.
