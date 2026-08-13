# Automatización de tutoriales con Vercel AI Gateway

## Objetivo

Implementar una vía automática y desacoplada que genere dos tutoriales diarios sobre tecnología emergente mediante Vercel AI Gateway, priorizando `inclusionai/ling-3.0-tiny-free` mientras esté disponible, sin eliminar ni acoplar el panel manual existente basado en Gemini.

**Estado:** implementación, migración y despliegue completados el 2026-08-13. Las llamadas reales alcanzan AI Gateway, pero la cuenta devuelve `HTTP 429`; no se publicaron tutoriales durante la puesta en producción y el cron reintentará el 2026-08-14.

## Alcance

- Conservar y endurecer el flujo manual `POST /api/admin/generate.json` con Gemini.
- Añadir un proveedor Vercel AI Gateway independiente y configurable.
- Añadir selección reproducible de temas emergentes desde un catálogo controlado, con deduplicación.
- Añadir una ruta protegida para ejecución programada y dos generaciones por día.
- Configurar Vercel Cron con secreto y comportamiento idempotente.
- Evitar que fallos parciales dupliquen tutoriales o oculten el resultado real.
- Actualizar contratos, estado del proyecto y proceso de contenido.
- No modificar calculadoras.

## Decisiones de implementación

- Rama de trabajo original: `codex/tutoriales-vercel-ai`, creada desde `chore/gobernanza-agentes` (`17b27ff`). Todo quedó integrado en `main` y las ramas locales de trabajo fueron eliminadas.
- El panel Gemini y el generador automático conservan servicios, autenticación y selección de proveedor independientes; ambos publican el mismo contrato `Tutorial`.
- El modelo promocional es configurable mediante `VERCEL_AI_MODEL`; producción prioriza `inclusionai/ling-3.0-tiny-free`. `VERCEL_AI_FALLBACK_MODELS` permite configurar alternativas sin desplegar código nuevo.
- La ejecución programada se autenticará con `CRON_SECRET`, no con la contraseña administrativa.
- La selección diaria usará una clave idempotente por fecha y posición para evitar duplicados.
- La publicación seguirá usando la tabla `tutorials`; la primera versión no incorporará un CMS editorial completo.

## Trabajo y ownership

| ID | Responsable | Superficie | Resultado esperado |
| :--- | :--- | :--- | :--- |
| T1 | agente `gateway_provider` | `src/lib/application/services/` y dependencias AI | proveedor Vercel Gateway, salida estructurada, fallback/configuración |
| T2 | agente `daily_pipeline` | ruta cron, selección de temas, `vercel.json` | ejecución diaria protegida, dos tutoriales, deduplicación e idempotencia |
| T3 | agente `gemini_hardening` | generador Gemini y endpoint admin | mantener panel, retirar diagnóstico sensible y corregir cascada/validación |
| T4 | agente principal | integración, documentación, migraciones necesarias y verificación | arquitectura coherente, build y docs válidos |

## Validaciones

- `npm run build`
- `node scripts/check-docs.mjs`
- Revisión del diff completo.
- Comprobación del catálogo público de Vercel para el modelo configurado.
- Migración remota aplicada y verificada en `herramientastic-db`: tabla de jobs disponible, `service_role` autorizado y `anon` denegado.
- Variables de producción configuradas y despliegue `Ready` con alias del dominio final.
- Pruebas HTTP de portada, buscador, cron sin credenciales y panel Gemini sin credenciales.
- Pruebas reales del cron autenticado: persistencia de jobs operativa y proveedor alcanzado; Vercel respondió `HTTP 429` para Ling y también para un modelo alternativo. No se crearon tutoriales.

## Riesgos y límites

- La promoción de Ling 3.0 Tiny expira o cambia sin aviso; debe existir una alternativa configurable.
- Vercel Cron no reintenta automáticamente y en Hobby ejecuta una vez al día con precisión horaria.
- Los feeds oficiales pueden fallar, cambiar de formato o no contener candidatos relevantes; en ese caso la ejecución degrada a un catálogo curado y rotativo.
- La generación masiva no debe insistir ante `HTTP 429`. El cron diario conserva el reintento idempotente; la ventana promocional expira automáticamente mediante `PROMOTION_END_AT`.
