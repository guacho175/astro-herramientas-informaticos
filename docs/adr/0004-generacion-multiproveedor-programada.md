# ADR 0004: Generación multiproveedor programada

- Estado: aceptado
- Fecha: 2026-08-13

## Contexto

El proyecto tenía un único generador manual acoplado a Gemini. Se necesita publicar contenido técnico de forma diaria y aprovechar modelos promocionales o económicos sin reescribir el panel administrativo cada vez que cambia su disponibilidad.

Los tutoriales se sirven desde Supabase en SSR. Las calculadoras continúan siendo código Astro pregenerado y quedan fuera de esta decisión.

## Decisión

Se mantienen dos flujos independientes:

1. El panel manual conserva `AIGeneratorService` y su cascada Gemini.
2. La automatización usa `VercelAIGeneratorService`, AI SDK y Vercel AI Gateway con un modelo configurable mediante `VERCEL_AI_MODEL`.

Vercel Cron dispara dos generaciones diarias protegidas por `CRON_SECRET`. La investigación prioriza feeds y documentación oficiales. Un catálogo curado permite degradación cuando esas fuentes no responden.

Las escrituras automáticas pasan por `TutorialAdminRepository`, exclusivo de servidor. La tabla `tutorial_generation_jobs` y el RPC `claim_tutorial_generation_job` coordinan concurrencia e idempotencia sin ampliar las políticas públicas de `tutorials`.

## Consecuencias

- Cambiar de modelo Gateway no requiere modificar el pipeline ni el panel Gemini.
- Un modelo gratuito o promocional nunca se considera permanente; disponibilidad y precio siguen siendo estado externo.
- La generación automática puede publicar sin revisión humana, por lo que se aplican esquema, validaciones semánticas, fuentes obligatorias e idempotencia.
- La ejecución depende de Vercel Cron, AI Gateway y Supabase. Los fallos parciales quedan explícitos y los jobs fallidos pueden reintentarse.
- El buscador debe ser dinámico para reflejar contenido creado después del build.
