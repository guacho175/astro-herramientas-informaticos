# Contrato de API

> **Fuente de verdad:** este documento es canónico para los endpoints HTTP y la forma del recurso `Tutorial`.
> **Última verificación:** 2026-08-13

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
| `500` | `{ error }` | configuración inaccesible, fallo de proveedor, validación o inserción |

### Comportamiento

- El `slug` se **deriva del título generado** (minúsculas, sin acentos, guiones). No se acepta un slug del cliente. Un título que produzca un slug ya existente hace fallar la inserción por la restricción de unicidad y devuelve `500`.
- `AIGeneratorService` recorre una cascada Gemini. Solo hace fallback ante errores recuperables, cuota `429`, timeout, modelo no disponible o salida inválida; los demás `4xx` detienen la cascada.
- Cada modelo tiene timeout y la salida se valida por esquema, longitudes, mínimo de palabras, encabezados y código.
- `image` se fija a `/images/tutorials/<slug>.png`, un marcador que normalmente no existe; el frontend hace fallback al icono por categoría.
- La operación no es idempotente: dos llamadas con el mismo `topic` producen dos tutoriales distintos.

---

## `GET /api/search.json`

Índice ligero de tutoriales para el buscador del sitio.

**Dinámico con caché compartida:** consulta Supabase cuando la caché se regenera. `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600`.

```jsonc
[
  { "title": "string", "description": "string", "slug": "string",
    "category": "string", "image": "string", "updated": 2026 }  // año de created_at
]
```

---

## `GET /api/cron/generate-tutorials.json`

Genera los dos tutoriales diarios mediante Vercel AI Gateway. Una sola invocación procesa secuencialmente los slots `1` y `2`; cada uno conserva su reserva, resultado e idempotencia independientes. Selecciona novedades desde fuentes oficiales, descarga como máximo dos fuentes primarias con límites de tamaño y redirecciones, y cae a un catálogo curado. Repetir la ruta el mismo día omite los slots ya publicados o con una reserva vigente.

Vercel programa solo esta ruta, una vez al día a las 09:00 UTC. En Chile continental corresponde a las 05:00 durante UTC-4 y a las 06:00 durante UTC-3. Las rutas delgadas `/api/cron/generate-tutorial-slot-1.json` y `/api/cron/generate-tutorial-slot-2.json` se conservan sin programar para diagnósticos puntuales de un solo slot.

**Autenticación:** `Authorization: Bearer <CRON_SECRET>`. Vercel añade esta cabecera al invocar el cron cuando la variable está configurada.

| Código | Causa |
| :--- | :--- |
| `200` | los dos slots fueron creados u omitidos correctamente |
| `207` | un slot terminó correctamente y el otro falló |
| `401` | secreto ausente o incorrecto |
| `500` | configuración inválida o ambos slots fallaron |

La respuesta incluye `date`, `requested`, `created`, `skipped`, `failed` y un arreglo `results` sin secretos ni mensajes internos del proveedor.

Cada reserva usa un lease de seis minutos y un token de propiedad. Un proceso posterior puede recuperar un lease vencido; solo el token vigente puede registrar el fallo o publicar. La inserción del tutorial y el cambio del job a `completed` ocurren en una misma transacción.

---

## `POST /api/admin/generate-promotion.json`

Ejecución temporal por lotes pequeños para aprovechar una promoción de modelo sin modificar el cron permanente.

**Autenticación:** `Authorization: Bearer <CRON_SECRET>`. También exige `PROMOTION_BATCH_ENABLED=true` y rechaza llamadas posteriores a `PROMOTION_END_AT` (por defecto `2026-08-14T15:00:00Z`).

```json
{ "batchId": "lote-01", "count": 2 }
```

`batchId` debe ser único por lote y usar minúsculas, números y guiones; `count` admite 1 o 2. Repetir un `batchId` es idempotente incluso en otro día UTC.

| Código | Causa |
| :--- | :--- |
| `200` | lote creado u omitido correctamente |
| `207` | resultado parcial |
| `400` | cuerpo o parámetros inválidos |
| `401` | secreto incorrecto |
| `403` | lotes promocionales deshabilitados |
| `410` | ventana promocional terminada |
| `500` | fallo total o configuración inválida |

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

Si se implementa ese endpoint, debe documentarse aquí **antes** de anunciarse y conservar una política de acceso coherente con RLS.
