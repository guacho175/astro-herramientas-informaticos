# Automatización de tutoriales con Vercel AI Gateway

## Objetivo

Implementar una vía automática y desacoplada que genere dos tutoriales diarios sobre tecnología emergente mediante Vercel AI Gateway, priorizando `inclusionai/ling-3.0-tiny-free` mientras esté disponible, sin eliminar ni acoplar el panel manual existente basado en Gemini.

**Estado:** implementación local completada y validada; despliegue, migración remota y consumo real pendientes de autorización.

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

- Rama de trabajo: `codex/tutoriales-vercel-ai`, creada desde `chore/gobernanza-agentes` (`17b27ff`), la base local más reciente.
- El panel Gemini y el generador automático conservan servicios, autenticación y selección de proveedor independientes; ambos publican el mismo contrato `Tutorial`.
- El modelo promocional será configurable mediante `VERCEL_AI_MODEL`; el valor por defecto inicial será `inclusionai/ling-3.0-tiny-free`.
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
- Prueba local de rutas sin invocar scripts con permisos de servicio ni escribir en la base real.

## Riesgos y límites

- La promoción de Ling 3.0 Tiny expira o cambia sin aviso; debe existir una alternativa configurable.
- Vercel Cron no reintenta automáticamente y en Hobby ejecuta una vez al día con precisión horaria.
- Los feeds oficiales pueden fallar, cambiar de formato o no contener candidatos relevantes; en ese caso la ejecución degrada a un catálogo curado y rotativo.
- No se ejecutará generación masiva contra producción ni se consumirán cuotas reales sin autorización explícita y credenciales/configuración disponibles en Vercel.
