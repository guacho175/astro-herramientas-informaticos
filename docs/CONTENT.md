# Creación de tutoriales

> **Fuente de verdad:** este documento es canónico para el proceso de creación e integración de tutoriales.
> **Última verificación:** 2026-08-13

Reemplaza a los antiguos `GUIDE_FOR_AGENTS.md` y `TUTORIAL_GUIDELINES.md`, que fueron eliminados por duplicación.

---

## 1. Dónde vive el contenido

Los tutoriales **no son archivos**. Viven exclusivamente en la tabla `tutorials` de Supabase.

El directorio `src/content/tutorials/` y las colecciones de contenido de Astro fueron eliminados y **no volverán**. La decisión está registrada en [ADR 0002](adr/0002-supabase-como-cms-de-tutoriales.md).

No crees archivos `.md` de tutoriales en el repositorio bajo ninguna circunstancia.

## 2. Cómo se inserta un tutorial

Existen dos vías permanentes y una vía promocional temporal:

| Vía | Cuándo usarla | Autenticación |
| :--- | :--- | :--- |
| `POST /api/admin/generate.json` | generación asistida por IA desde el panel `/admin/tutorial-generator` | contraseña verificada contra `admin_keys` |
| `GET /api/cron/generate-tutorial-slot-{1,2}.json` | un tutorial por invocación; slots diarios independientes a las 09:00 y 11:00 UTC | `CRON_SECRET` enviado por Vercel Cron |
| `POST /api/admin/generate-promotion.json` | lotes temporales, máximo dos por llamada | `CRON_SECRET` y `PROMOTION_BATCH_ENABLED=true` |

El panel manual continúa usando Gemini. Las ejecuciones automática y promocional usan Vercel AI Gateway y están desacopladas del panel. El modelo primario se define con `VERCEL_AI_MODEL`; en producción se usa temporalmente `inclusionai/ling-3.0-flash` porque `inclusionai/ling-3.0-tiny-free` no está disponible actualmente. `VERCEL_AI_FALLBACK_MODELS` acepta alternativas separadas por comas.

La selección automática prioriza entradas recientes de feeds oficiales de Vercel, Cloudflare, Astro, AI SDK y Supabase. Para los primeros candidatos descarga de forma acotada hasta dos documentos primarios: solo HTTPS, hosts públicos, redirecciones validadas, timeout, tamaño máximo y texto sanitizado. Si no hay candidatos utilizables, rota un catálogo curado. La salida debe citar todas las fuentes entregadas, superar 1200 palabras e incluir H2/H3 y código.

Cada slot reserva primero un job con token y lease de seis minutos. Solo el propietario vigente puede publicar o fallar; un lease vencido se puede recuperar. La inserción del tutorial y el cierre del job son atómicos. El cron deduplica por fecha y slot; un `batchId` promocional conserva idempotencia entre días UTC.

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
