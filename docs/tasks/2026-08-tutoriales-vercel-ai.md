# Automatización de tutoriales con Vercel AI Gateway

## Objetivo

Implementar una vía automática y desacoplada que genere hasta dos tutoriales diarios sobre tecnología emergente mediante Vercel AI Gateway, sin eliminar ni acoplar el panel manual existente basado en Gemini.

**Estado:** cerrado por decisión del usuario el 2026-08-13. Producción tiene un solo cron diario a las 09:00 UTC, dos slots secuenciales y `google/gemini-2.5-flash` mediante Vercel AI Gateway. La primera ejecución automática queda pendiente para el 2026-08-14 a las 05:00 de Chile continental; no se demostró todavía una publicación real.

## Alcance

- Conservar y endurecer el flujo manual `POST /api/admin/generate.json` con Gemini.
- Añadir un proveedor Vercel AI Gateway independiente y configurable.
- Añadir selección reproducible de temas emergentes desde un catálogo controlado, con deduplicación.
- Añadir una ruta protegida que genere dos tutoriales secuenciales mediante slots diarios independientes.
- Configurar Vercel Cron con secreto y comportamiento idempotente.
- Evitar que fallos parciales dupliquen tutoriales o oculten el resultado real.
- Actualizar contratos, estado del proyecto y proceso de contenido.
- No modificar calculadoras.

## Decisiones de implementación

- Rama de trabajo original: `codex/tutoriales-vercel-ai`, creada desde `chore/gobernanza-agentes` (`17b27ff`). Todo quedó integrado en `main` y las ramas locales de trabajo fueron eliminadas.
- El panel Gemini y el generador automático conservan servicios, autenticación y selección de proveedor independientes; ambos publican el mismo contrato `Tutorial`.
- El modelo es configurable mediante `VERCEL_AI_MODEL`; producción usa `google/gemini-2.5-flash`, habilitado para los créditos mensuales del nivel gratuito. No hay fallback configurado.
- Vercel programa una sola ruta a las 09:00 UTC. Esa invocación procesa los slots `1` y `2` secuencialmente; en Chile continental se ejecuta a las 05:00 durante UTC-4 y a las 06:00 durante UTC-3.
- La ejecución programada se autenticará con `CRON_SECRET`, no con la contraseña administrativa.
- El cron usa clave por fecha y slot; promociones usan `batchId` y slot sin fecha para conservar idempotencia entre días UTC.
- Los jobs usan token y lease de seis minutos; la publicación y finalización son una transacción.
- La investigación descarga hasta dos fuentes primarias con controles SSRF, redirecciones, timeout, tamaño y sanitización.
- La publicación seguirá usando la tabla `tutorials`; la primera versión no incorporará un CMS editorial completo.

## Trabajo y ownership

| ID | Responsable | Superficie | Resultado esperado |
| :--- | :--- | :--- | :--- |
| T1 | agente `gateway_provider` | `src/lib/application/services/` y dependencias AI | proveedor Vercel Gateway, salida estructurada, fallback/configuración |
| T2 | agente `daily_pipeline` | ruta cron, selección de temas, `vercel.json` | invocaciones por slot, deduplicación e idempotencia |
| T3 | agente `gemini_hardening` | generador Gemini y endpoint admin | mantener panel, retirar diagnóstico sensible y corregir cascada/validación |
| T4 | agente principal | integración, documentación, migraciones necesarias y verificación | arquitectura coherente, build y docs válidos |

## Validaciones

- `npm run build`
- `node scripts/check-docs.mjs`
- Revisión del diff completo.
- Comprobación del catálogo público de Vercel para el modelo configurado.
- Migraciones de jobs, leases y publicación atómica aplicadas y verificadas en `herramientastic-db`.
- Variables de producción configuradas y despliegue `Ready` con alias del dominio final.
- Pruebas HTTP de portada, buscador, cron sin credenciales y panel Gemini sin credenciales.
- Pruebas promocionales reales: Ling devolvió contenido truncado o demasiado corto y Gemini 3.5 Flash Lite fue rechazado por el nivel gratuito con `HTTP 403`. No se crearon tutoriales. Por instrucción del usuario no se repitió la generación; el cierre deja `google/gemini-2.5-flash` para la primera ejecución automática.

## Riesgos y límites

- La primera publicación real del flujo automático sigue sin verificarse; debe comprobarse después de la ejecución del 2026-08-14.
- Vercel Cron no reintenta automáticamente y en Hobby ejecuta una vez al día con precisión horaria.
- Los feeds oficiales pueden fallar, cambiar de formato o no contener candidatos relevantes; en ese caso la ejecución degrada a un catálogo curado y rotativo.
- El endpoint promocional queda deshabilitado en producción. La disponibilidad del modelo y su acceso al nivel gratuito pueden cambiar sin aviso.
