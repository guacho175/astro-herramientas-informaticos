# Creación de tutoriales

> **Fuente de verdad:** este documento es canónico para el proceso de creación e integración de tutoriales.
> **Última verificación:** 2026-08-14

Reemplaza a los antiguos `GUIDE_FOR_AGENTS.md` y `TUTORIAL_GUIDELINES.md`, que fueron eliminados por duplicación.

---

## 1. Dónde vive el contenido

Los tutoriales **no son archivos**. Viven exclusivamente en la tabla `tutorials` de Supabase.

El directorio `src/content/tutorials/` y las colecciones de contenido de Astro fueron eliminados y **no volverán**. La decisión está registrada en [ADR 0002](adr/0002-supabase-como-cms-de-tutoriales.md).

No crees archivos `.md` de tutoriales en el repositorio bajo ninguna circunstancia.

## 2. Cómo se inserta un tutorial

El panel proporciona login y existen dos vías permanentes de generación, además de una vía promocional temporal:

| Vía | Cuándo usarla | Autenticación |
| :--- | :--- | :--- |
| `POST /api/admin/login.json` | iniciar sesión en el panel `/admin` | contraseña verificada contra `admin_keys` |
| `POST /api/admin/generate.json` | generación asistida por IA desde el panel | sesión administrativa y origen del mismo sitio |
| `POST /api/admin/generate-emerging.json` | crear manualmente un lote independiente de hasta dos tutoriales con AI Gateway | sesión administrativa y origen del mismo sitio |
| `GET /api/cron/generate-tutorials.json` | una invocación diaria a las 09:00 UTC; genera secuencialmente los dos slots | `CRON_SECRET` enviado por Vercel Cron |
| `POST /api/admin/generate-promotion.json` | lotes temporales, máximo dos por llamada | `CRON_SECRET` y `PROMOTION_BATCH_ENABLED=true` |

El panel está disponible en `/admin`; la URL histórica `/admin/tutorial-generator` redirige a ella. El login usa la misma contraseña administrativa existente y crea una cookie de sesión firmada, `HttpOnly`, `SameSite=Strict`, temporal y `Secure` en producción. Después del login, el flujo manual continúa usando Gemini mediante la clave de Google AI Studio y no vuelve a pedir ni reenvía la contraseña. La generación automática del panel usa Vercel AI Gateway y el mismo pipeline editorial que el cron, sin invocar su ruta ni revelar `CRON_SECRET`. Cada pulsación aceptada crea un lote propio de hasta dos tutoriales secuenciales y distintos; no comparte slots con el cron, que mantiene su límite diario. El servidor rechaza lotes simultáneos en vez de encolarlos. El modelo se define con `VERCEL_AI_MODEL`; producción usa exclusivamente `google/gemini-2.5-flash`, habilitado para los créditos mensuales del nivel gratuito, y no configura un modelo alternativo en `VERCEL_AI_FALLBACK_MODELS`. El endpoint promocional temporal queda deshabilitado en producción.

Solo existe un cron programado: Vercel puede iniciarlo entre las 09:00 y las 09:59 UTC por la precisión horaria del plan Hobby; procesa primero el slot `1` y después el slot `2`. En Chile continental la ventana es 05:00–05:59 mientras rija UTC-4 y 06:00–06:59 mientras rija UTC-3; Vercel no cambia la expresión UTC cuando cambia el horario local.

La generación editorial deshabilita el razonamiento interno del modelo para reservar el presupuesto de salida al tutorial completo. El servicio admite como máximo un fallback opcional, pero producción no lo configura, y nunca repite automáticamente una cadena fallida. El contrato acota la salida con un objetivo de 1550 a 1750 palabras, un rango editorial de 1500 a 1800 y presupuestos por sección cuyos mínimos suman 1550 antes de las fuentes, además de secciones H2/H3 y uno o dos bloques de código breves. Una secuencia final detiene la generación y se retira si el proveedor la conserva; toda respuesta que termine por límite se rechaza. Antes de validar, el servicio normaliza encabezados ATX, Setext y HTML comunes, convierte H1 a la jerarquía admitida y, cuando falta estructura, añade secciones determinísticas de introducción e implementación alrededor del texto existente. También canoniza los nombres habituales de la sección de fuentes sin alterar sus URL. Las validaciones de mínimo 1200 palabras, encabezados H2/H3, bloques de código y cita de todas las fuentes siguen siendo obligatorias.

La selección automática prioriza entradas recientes de feeds oficiales de Vercel, Cloudflare, Astro, AI SDK y Supabase. Para los primeros candidatos descarga de forma acotada hasta dos documentos primarios: solo HTTPS, hosts públicos, redirecciones validadas, timeout, tamaño máximo y texto sanitizado. Si no hay candidatos utilizables, rota un catálogo curado. Las rutas automática y de cron omiten temas ya cubiertos en vez de rellenar el lote con una repetición. La salida debe citar todas las fuentes entregadas, superar 1200 palabras e incluir H2/H3 y código.

La única invocación diaria procesa los dos slots de forma secuencial para evitar ráfagas. Cada slot reserva primero un job de tema con token y lease de seis minutos; ese job evita que cron y panel publiquen el mismo tema al mismo tiempo. Solo el propietario vigente puede publicar o fallar; un lease vencido se puede recuperar. La inserción del tutorial y el cierre del job son atómicos. El cron deduplica por fecha y slot; los lotes del panel usan un `batchId` nuevo por cada ejecución y un lock independiente evita ejecuciones simultáneas.

El contrato completo del endpoint está en [API.md](API.md).

Para una inserción manual puntual, escribe directamente en la tabla desde el panel de Supabase respetando los campos de la sección 3.

> **`scripts/seed-tutorials.mjs` y `scripts/migrate-to-supabase.js` ya no funcionan.** Eran utilidades de un solo uso para la migración de 2026-07-24: leen archivos de `src/content/tutorials/`, directorio que fue eliminado. No los ejecutes ni los tomes como referencia.

> Los scripts de `scripts/` escriben en la base de datos real con permisos de servicio. Un agente no debe ejecutarlos sin autorización explícita del mantenedor.

## 3. Campos del registro

| Campo | Tipo | Obligatorio | Notas |
| :--- | :--- | :--- | :--- |
| `slug` | `text` | sí | único; es la URL del artículo (`/blog/guias/<slug>`) |
| `title` | `text` | sí | título visible; objetivo ≤ 60 caracteres por SEO |
| `description` | `text` | sí | meta descripción; objetivo ≤ 150 caracteres |
| `content_markdown` | `text` | sí | cuerpo completo en Markdown |
| `category` | `text` | no (`'Guía'`) | **crítico**: determina el icono SVG que renderiza `TutorialIcon.astro` |
| `image` | `text` | no | con valor por defecto; el frontend hace fallback al icono por categoría |
| `views` | `bigint` | no (`0`) | lo incrementa el RPC `increment_tutorial_views`, no se escribe a mano |
| `is_premium` | `boolean` | no (`false`) | sin efecto en el frontend actual |

La definición autoritativa es la migración `supabase/migrations/20260724000001_create_tutorials_table.sql`. El tipo TypeScript que la refleja es `src/lib/domain/models/Tutorial.ts`.

### Categorías

`category` no está restringida por la base de datos, pero `TutorialIcon.astro` compara **por coincidencia exacta y sensible a mayúsculas**. Cualquier otro valor cae en el icono genérico. Valores con icono propio:

`Backend` · `DevOps` · `Frontend` · `Desarrollo Web` · `React` · `Desarrollo de Software` · `Control de Versiones` · `Redes` · `Ciberseguridad` · `Sistemas Operativos` · `Bases de Datos` · `Programación` · `Cloud`

Si añades un icono nuevo en `src/components/TutorialIcon.astro`, actualiza esta lista en el mismo cambio.

## 4. Estructura recomendada del cuerpo

Para mantener una estética homogénea entre artículos:

```markdown
## Introducción
Explicación concisa del propósito de la herramienta o tecnología.

## Requisitos Previos
- Lista de requisitos o herramientas necesarias.

## Paso 1: Configuración Inicial
Explicación y bloques de código con resaltado de sintaxis.

> 💡 **Tip / Nota:** usa notas destacadas para puntos clave o advertencias.

## Conclusión
Resumen de lo aprendido y siguientes pasos recomendados.
```

El Markdown se convierte a HTML en tiempo de request con `marked` y se estiliza con `@tailwindcss/typography`.

## 5. Verificación

El sitio se sirve en **SSR**, no se pregenera. Verificar un artículo en `dist/` es imposible: ese HTML no existe.

1. `npm run dev` y abrir `http://localhost:4321/blog/guias/<slug>`. Comprobar título, descripción, icono de categoría y formato del cuerpo.
2. Comprobar que el artículo aparece en el listado `http://localhost:4321/blog/guias`.
3. `npm run build` debe completar sin errores.

> El índice `/api/search.json` es dinámico y usa caché compartida de cinco minutos. Un tutorial nuevo puede tardar hasta ese intervalo en aparecer en el buscador.
