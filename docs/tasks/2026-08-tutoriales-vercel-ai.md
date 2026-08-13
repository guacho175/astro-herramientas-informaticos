# Automatización de tutoriales con Vercel AI Gateway

## Objetivo

Implementar una vía automática y desacoplada que genere hasta dos tutoriales diarios sobre tecnología emergente mediante invocaciones separadas de Vercel AI Gateway, sin eliminar ni acoplar el panel manual existente basado en Gemini.

**Estado:** implementación y validación local completadas el 2026-08-13. La primera migración y despliegue alcanzaron AI Gateway, pero devolvieron `HTTP 429`; la migración incremental de leases debe aplicarse antes del siguiente despliegue.

## Alcance

- Conservar y endurecer el flujo manual `POST /api/admin/generate.json` con Gemini.
- Añadir un proveedor Vercel AI Gateway independiente y configurable.
- Añadir selección reproducible de temas emergentes desde un catálogo controlado, con deduplicación.
- Añadir una ruta protegida que genere un tutorial por invocación y admita dos slots diarios.
- Configurar Vercel Cron con secreto y comportamiento idempotente.
- Evitar que fallos parciales dupliquen tutoriales o oculten el resultado real.
- Actualizar contratos, estado del proyecto y proceso de contenido.
- No modificar calculadoras.

## Decisiones de implementación

- Rama de trabajo original: `codex/tutoriales-vercel-ai`, creada desde `chore/gobernanza-agentes` (`17b27ff`). Todo quedó integrado en `main` y las ramas locales de trabajo fueron eliminadas.
- El panel Gemini y el generador automático conservan servicios, autenticación y selección de proveedor independientes; ambos publican el mismo contrato `Tutorial`.
- El modelo es configurable mediante `VERCEL_AI_MODEL`; producción usa temporalmente `inclusionai/ling-3.0-flash` porque Tiny Free no está disponible actualmente. `VERCEL_AI_FALLBACK_MODELS` permite cambiar alternativas sin desplegar código.
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
- Migración inicial remota aplicada y verificada en `herramientastic-db`; la migración incremental de leases y publicación atómica requiere aplicación y verificación antes de desplegar el código dependiente.
- Variables de producción configuradas y despliegue `Ready` con alias del dominio final.
- Pruebas HTTP de portada, buscador, cron sin credenciales y panel Gemini sin credenciales.
- Pruebas reales del cron autenticado: persistencia de jobs operativa y proveedor alcanzado; Vercel respondió `HTTP 429` para Ling y también para un modelo alternativo. No se crearon tutoriales.

## Riesgos y límites

- Ling 3.0 Tiny Free no está disponible actualmente; Ling 3.0 Flash Free es la alternativa temporal y también puede cambiar sin aviso.
- Vercel Cron no reintenta automáticamente y en Hobby ejecuta una vez al día con precisión horaria.
- Los feeds oficiales pueden fallar, cambiar de formato o no contener candidatos relevantes; en ese caso la ejecución degrada a un catálogo curado y rotativo.
- La generación masiva no debe insistir ante `HTTP 429`. El cron diario conserva el reintento idempotente; la ventana promocional expira automáticamente mediante `PROMOTION_END_AT`.
