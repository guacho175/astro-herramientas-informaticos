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

## Sesión administrativa

El panel canónico es `GET /admin`. Sin una sesión válida muestra el login; tras iniciarla muestra las dos operaciones de generación. La URL histórica `GET /admin/tutorial-generator` redirige temporalmente a `/admin`.

Las rutas administrativas no aceptan la contraseña ni secretos de proveedor fuera del login. Usan la cookie firmada `admin_session`, de 30 minutos, con `HttpOnly`, `SameSite=Strict`, `Path=/` y `Secure` en producción. La firma usa `ADMIN_SESSION_SECRET`, una variable exclusiva de servidor. Todas las solicitudes `POST` del panel validan el `Origin` contra el origen de la petición para reducir CSRF.

### `POST /api/admin/login.json`

Valida la misma contraseña administrativa contra `admin_keys` y abre la sesión. La contraseña se usa solamente en esta solicitud y nunca se guarda en cookies ni en almacenamiento del navegador.

```json
{ "password": "string" }
```

| Código | Causa |
| :--- | :--- |
| `200` | credenciales válidas; devuelve `Set-Cookie` con la sesión |
| `400` | cuerpo JSON inválido |
| `401` | credenciales ausentes o inválidas |
| `403` | origen no válido |
| `500` | configuración administrativa no disponible |

### `POST /api/admin/logout.json`

Requiere un origen válido y cierra la sesión del navegador al expirar la cookie con los mismos atributos de ruta y seguridad. Responde `204`; la operación es idempotente.

---

## `POST /api/admin/generate.json`

Genera un tutorial con IA a partir de un tema y lo inserta en la base de datos. Ejecuta con `service_role`, por lo que **omite RLS**.

**Autenticación:** sesión administrativa válida más `Origin` del mismo sitio. El servidor validó previamente la contraseña con `scrypt` contra la fila `primary_admin` de `admin_keys` durante el login.

### Petición

```json
{ "topic": "string" }
```

### Respuestas

| Código | Cuerpo | Causa |
| :--- | :--- | :--- |
| `200` | `{ success: true, message, data: Tutorial }` | tutorial generado e insertado |
| `400` | `{ error }` | falta `topic` |
| `401` | `{ error }` | sesión ausente, inválida o expirada |
| `403` | `{ error }` | origen no válido |
| `500` | `{ error }` | fallo de proveedor, validación o inserción |

### Comportamiento

- El `slug` se **deriva del título generado** (minúsculas, sin acentos, guiones). No se acepta un slug del cliente. Un título que produzca un slug ya existente hace fallar la inserción por la restricción de unicidad y devuelve `500`.
- `AIGeneratorService` recorre una cascada Gemini. Solo hace fallback ante errores recuperables, cuota `429`, timeout, modelo no disponible o salida inválida; los demás `4xx` detienen la cascada.
- Cada modelo tiene timeout y la salida se valida por esquema, longitudes, mínimo de palabras, encabezados y código.
- `image` se fija a `/images/tutorials/<slug>.png`, un marcador que normalmente no existe; el frontend hace fallback al icono por categoría.
- La operación no es idempotente: dos llamadas con el mismo `topic` producen dos tutoriales distintos.

---

## `POST /api/admin/generate-emerging.json`

Ejecuta manualmente desde el panel el mismo pipeline del cron: investigación de fuentes, `VercelAIGeneratorService` mediante Vercel AI Gateway y publicación transaccional. No invoca la ruta cron ni expone `CRON_SECRET` al navegador.

**Autenticación:** sesión administrativa válida más `Origin` del mismo sitio.

```json
{}
```

Siempre solicita `count=2`, slots `1` y `2` secuenciales y namespace `tutorial-emergente`. Por eso comparte las claves diarias UTC con el cron: si esta ruta publica antes, el cron omite esos slots; si el cron ya los atendió, la ruta informa cada omisión. Nunca crea cuatro tutoriales por día.

| Código | Causa |
| :--- | :--- |
| `200` | ambos slots fueron creados u omitidos correctamente |
| `207` | resultado parcial |
| `400` | cuerpo JSON inválido |
| `401` | sesión ausente, inválida o expirada |
| `403` | origen no válido |
| `500` | fallo total o configuración inválida |

La respuesta contiene `date`, `requested`, `created`, `skipped`, `failed` y `results`. Cada elemento indica su `slot` y estado `created`, `skipped` o `failed`; los creados incluyen `title` y `slug`, y los omitidos incluyen el `slug` ya reservado o publicado. No expone errores internos del proveedor.

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

Vercel programa solo esta ruta, una vez al día durante la hora que comienza a las 09:00 UTC. La precisión horaria del plan Hobby permite que comience entre las 09:00 y las 09:59 UTC: en Chile continental corresponde a la ventana 05:00–05:59 durante UTC-4 y 06:00–06:59 durante UTC-3. Las rutas delgadas `/api/cron/generate-tutorial-slot-1.json` y `/api/cron/generate-tutorial-slot-2.json` se conservan sin programar para diagnósticos puntuales de un solo slot.

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
| `GET /admin` | panel protegido por sesión; sin sesión muestra login y con sesión muestra generación manual y automática |
| `GET /admin/tutorial-generator` | redirección temporal a `/admin` para conservar la URL existente |

---

## Consumo externo

No existe todavía un endpoint público de lectura de tutoriales. Un consumidor externo solo puede leer la tabla `tutorials` directamente desde Supabase con la clave anónima, sujeto a RLS (lectura pública permitida).

Si se implementa ese endpoint, debe documentarse aquí **antes** de anunciarse y conservar una política de acceso coherente con RLS.
