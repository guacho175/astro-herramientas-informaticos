---
title: "Docker & Docker Compose: Guía Práctica de Contenedores"
description: "Aprende a empaquetar tus aplicaciones web, bases de datos y microservicios en contenedores aislados y portables."
slug: "docker-contenedores-desarrollo"
image: "https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png"
updated: "Jul 2026"
---

## ¿Por qué utilizar Docker en Desarrollo?

**Docker** elimina el clásico problema de *"en mi máquina sí funciona"*, empaquetando el código, las dependencias y el runtime en un contenedor liviano e independiente.

---

## 1. Creación de un `Dockerfile` Optimizado

Para un proyecto Node.js/Astro, se recomienda una compilación multi-stage para minimizar el tamaño de la imagen final:

```dockerfile
# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 2. Orquestación con `docker-compose.yml`

Para levantar tu aplicación junto a una base de datos PostgreSQL:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:80"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## Comandos Esenciales

- **Construir y levantar servicios:**
  ```bash
  docker compose up -d --build
  ```
- **Ver logs en tiempo real:**
  ```bash
  docker compose logs -f app
  ```

---

## Conclusión

El uso de Docker estandariza los entornos de desarrollo y staging, facilitando los despliegues continuos en cualquier proveedor cloud.
