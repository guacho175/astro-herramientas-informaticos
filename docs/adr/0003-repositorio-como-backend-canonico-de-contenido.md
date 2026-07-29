# ADR 0003 — Este repositorio es el backend canónico de contenido

- **Estado:** aceptado
- **Fecha:** 2026-07-28

## Contexto

El proyecto se lee, a primera vista, como un portal web con un panel de administración. No es su rol real.

El objetivo es que este repositorio sea el **motor de creación de tutoriales**: genera el contenido con IA, lo valida y lo persiste. El portal `herramientastic.orbynexdigital.cl` es su primer consumidor. Está previsto que en el futuro otros sitios muestren esos mismos tutoriales, o que se descarguen desde un endpoint.

Sin este registro, la lectura equivocada tiene consecuencias concretas: se trata el esquema de datos como detalle interno, y los contratos se cambian sin considerar consumidores externos.

## Decisión

Este repositorio es el backend canónico del contenido. En consecuencia:

1. **La tabla `tutorials` y los endpoints de `src/pages/api/` son superficie pública potencial.** Cambiarlos obliga a actualizar [API.md](../API.md) en el mismo cambio.
2. El contenido se distribuye **por API o por lectura directa de Supabase**, nunca copiando archivos entre repositorios.
3. Ningún consumidor externo replica la lógica de acceso: si necesita algo que no existe, se añade un endpoint aquí.
4. El portal público es un consumidor más y no puede acaparar decisiones de modelo de datos.

## Consecuencias

- Los cambios de esquema pasan a ser potencialmente rompedores y requieren migración explícita en `supabase/migrations/`.
- La higiene de seguridad del endpoint admin deja de ser opcional: la limitación 1 de [PROJECT_STATE.md](../PROJECT_STATE.md) (logging de diagnóstico que filtra detalle de errores y estado de entorno en las respuestas) **debe resolverse antes de exponer cualquier endpoint público de lectura**.
- El repositorio se mantiene **privado por ahora**, porque opera con claves de API. La documentación se escribe igualmente asumiendo publicación futura: sin credenciales, URLs de proyecto ni datos personales.

## Pendiente

No existe todavía un endpoint público de lectura de tutoriales. Cuando se implemente, se documenta en `docs/API.md` antes de anunciarse.
