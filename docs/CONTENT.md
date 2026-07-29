# Creación de tutoriales

> **Fuente de verdad:** este documento es canónico para el proceso de creación e integración de tutoriales.
> **Última verificación:** 2026-07-28

Reemplaza a los antiguos `GUIDE_FOR_AGENTS.md` y `TUTORIAL_GUIDELINES.md`, que fueron eliminados por duplicación.

---

## 1. Dónde vive el contenido

Los tutoriales **no son archivos**. Viven exclusivamente en la tabla `tutorials` de Supabase.

El directorio `src/content/tutorials/` y las colecciones de contenido de Astro fueron eliminados y **no volverán**. La decisión está registrada en [ADR 0002](adr/0002-supabase-como-cms-de-tutoriales.md).

No crees archivos `.md` de tutoriales en el repositorio bajo ninguna circunstancia.

## 2. Cómo se inserta un tutorial

La vía vigente es una sola:

| Vía | Cuándo usarla | Autenticación |
| :--- | :--- | :--- |
| `POST /api/admin/generate.json` | generación asistida por IA desde el panel `/admin/tutorial-generator` | contraseña verificada contra `admin_keys` |

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

> El índice de búsqueda `/api/search.json` se pregenera en tiempo de build (`prerender = true`). Un tutorial insertado después del último despliegue **no aparecerá en el buscador** hasta el siguiente build, aunque sí sea accesible por su URL. Es una limitación conocida, registrada en [PROJECT_STATE.md](PROJECT_STATE.md).
