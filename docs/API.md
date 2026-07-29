# Contrato de API

> **Fuente de verdad:** este documento es canónico para los endpoints HTTP y la forma del recurso `Tutorial`.
> **Última verificación:** 2026-07-28

Todo cambio en `src/pages/api/`, en la forma de un recurso o en los códigos de respuesta debe reflejarse aquí en el mismo commit.

---

## Recurso `Tutorial`

Forma devuelta por Supabase y por los endpoints que exponen tutoriales. Definición en `src/lib/domain/models/Tutorial.ts`; esquema autoritativo en `supabase/migrations/`.

```jsonc
{
  "id": "uuid",
  "slug": "string",              // único, URL del artículo
  "title": "string",
  "description": "string",
  "content_markdown": "string",  // Markdown sin procesar
  "image": "string",
  "category": "string",          // ver docs/CONTENT.md
  "views": 0,
  "is_premium": false,
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

---

## `POST /api/admin/generate.json`

Genera un tutorial con IA a partir de un tema y lo inserta en la base de datos. Ejecuta con `service_role`, por lo que **omite RLS**.

**Autenticación:** contraseña en el cuerpo, verificada con `scrypt` contra la fila `primary_admin` de `admin_keys`. No usa cabecera `Authorization` ni cookies de sesión.

### Petición

```json
{ "topic": "string", "password": "string" }
```

### Respuestas

| Código | Cuerpo | Causa |
| :--- | :--- | :--- |
| `200` | `{ success: true, message, data: Tutorial }` | tutorial generado e insertado |
| `400` | `{ error }` | falta `topic` |
| `401` | `{ error }` | falta la contraseña o es incorrecta |
| `500` | `{ error, debug? }` | `admin_keys` inaccesible, fallo de inserción o error interno |

> El campo `debug` de la respuesta 500 expone el mensaje de error de base de datos y la presencia de variables de entorno. Es diagnóstico temporal, no forma parte del contrato y debe retirarse. Ver limitación 1 en [PROJECT_STATE.md](PROJECT_STATE.md).

### Comportamiento

- El `slug` se **deriva del título generado** (minúsculas, sin acentos, guiones). No se acepta un slug del cliente. Un título que produzca un slug ya existente hace fallar la inserción por la restricción de unicidad y devuelve `500`.
- `AIGeneratorService` recorre una cascada de modelos Gemini: ante error HTTP, cuota agotada (`429`), respuesta vacía o JSON inválido, salta al siguiente. Si todos fallan, lanza y el endpoint responde `500`.
- `image` se fija a `/images/tutorials/<slug>.png`, un marcador que normalmente no existe; el frontend hace fallback al icono por categoría.
- La operación no es idempotente: dos llamadas con el mismo `topic` producen dos tutoriales distintos.

---

## `GET /api/search.json`

Índice ligero de tutoriales para el buscador del sitio.

**Pregenerado en tiempo de build** (`prerender = true`): su contenido corresponde al último despliegue, no al estado actual de la base de datos. `Cache-Control: public, max-age=3600`.

```jsonc
[
  { "title": "string", "description": "string", "slug": "string",
    "category": "string", "image": "string", "updated": 2026 }  // año de created_at
]
```

---

## `GET /sitemap.xml`

Sitemap XML generado en cada request: páginas estáticas, calculadoras de `src/data/calculators.js` y tutoriales desde Supabase. Dominio fijado en `src/pages/sitemap.xml.ts`.

---

## Rutas de página relevantes

No son API, pero forman parte de la superficie observable:

| Ruta | Notas |
| :--- | :--- |
| `GET /blog/guias` | listado paginado; página vía query param `?page=N`, 9 por página |
| `GET /blog/guias/<slug>` | artículo; redirige a `/404` si no existe; incrementa `views` |
| `GET /admin/tutorial-generator` | panel que consume el endpoint admin; **sin protección propia**, la contraseña se valida en el servidor al enviar |

---

## Consumo externo

No existe todavía un endpoint público de lectura de tutoriales. Un consumidor externo solo puede leer la tabla `tutorials` directamente desde Supabase con la clave anónima, sujeto a RLS (lectura pública permitida).

Si se implementa ese endpoint, debe documentarse aquí **antes** de anunciarse, y la limitación 1 de [PROJECT_STATE.md](PROJECT_STATE.md) debe estar resuelta.
