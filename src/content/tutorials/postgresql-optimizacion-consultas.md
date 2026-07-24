---
title: "PostgreSQL: Optimización de Consultas e Índices"
description: "Técnicas de tuning de bases de datos relacionales, análisis de planes de ejecución EXPLAIN ANALYZE e índices B-Tree/GIN."
slug: "postgresql-optimizacion-consultas"
image: "https://www.postgresql.org/media/img/about/press/elephant.png"
updated: "Jul 2026"
---

## Estrategias de Rendimiento en PostgreSQL

A medida que el volumen de datos en **PostgreSQL** crece, las consultas no optimizadas pueden degradar severamente el tiempo de respuesta.

---

## 1. Análisis de Consultas con `EXPLAIN ANALYZE`

La herramienta `EXPLAIN ANALYZE` ejecuta la consulta y muestra el costo real de CPU, escaneo de disco e índices utilizados:

```sql
EXPLAIN ANALYZE
SELECT id, email, created_at
FROM users
WHERE status = 'active' AND created_at >= '2026-01-01';
```

---

## 2. Creación Estratégica de Índices

### Índice B-Tree (Default para igualdad y rangos)

```sql
CREATE INDEX idx_users_status_created 
ON users (status, created_at DESC);
```

### Índice GIN para Búsquedas JSONB

```sql
-- Útil para columnas de tipo JSONB o texto completo
CREATE INDEX idx_metadata_gin 
ON products USING GIN (metadata);
```

---

## 3. Consultas Paginadas de Alto Rendimiento

Evita utilizar `OFFSET` en tablas masivas ya que obliga a la base de datos a escanear filas previas. En su lugar, utiliza **Cursor Paginación (Keyset Pagination)**:

```sql
-- Paginación eficiente basada en ID
SELECT id, title, price
FROM products
WHERE id > 15000
ORDER BY id ASC
LIMIT 20;
```

---

## Conclusión

El monitoreo continuo de consultas lentas mediante `pg_stat_statements` e índices bien diseñados asegura latencias menores a 10ms incluso con millones de registros.
