---
title: "Docker & Docker Compose: Guía de Contenedores y Entornos de Desarrollo"
description: "Aprende desde cero a empaquetar aplicaciones web, microservicios y bases de datos PostgreSQL con Docker y Docker Compose."
slug: "docker-contenedores-desarrollo"
image: "https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png"
updated: "Jul 2026"
---

## Conceptos Clave de Docker

**Docker** permite aislar aplicaciones dentro de contenedores ligeros que incluyen todo lo necesario para su ejecución (código, runtime, bibliotecas y herramientas del sistema).

![Arquitectura de Docker Container](https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png)

### Diferencia entre Imagen y Contenedor
- **Imagen:** Plantilla de solo lectura que contiene las instrucciones para construir el entorno.
- **Contenedor:** Instancia ejecutable e independiente creada a partir de una imagen.

---

## Creación de un `Dockerfile` Multi-Stage de Producción

El patrón *Multi-Stage Build* permite separar la etapa de compilación de la imagen final de ejecución, reduciendo el tamaño de la imagen hasta en un 80%:

```dockerfile
# ── Stage 1: Build & Dependencies ──
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar archivos de dependencias e instalar
COPY package*.json ./
RUN npm ci

# Copiar código fuente y compilar sitio estático
COPY . .
RUN npm run build

# ── Stage 2: Production Server ──
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Copiar solo el resultado compilado del Stage 1
COPY --from=builder /app/dist .

# Exponer puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## Orquestación con `docker-compose.yml`

Para desarrollar aplicaciones complejas que requieren bases de datos y servicios en segundo plano, **Docker Compose** permite coordinar múltiples contenedores con una sola configuración:

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://orbynex_user:secretpass@db:5432/orbynex_db
    depends_on:
      - db
    restart: always

  db:
    image: postgres:16-alpine
    container_name: orbynex_postgres
    environment:
      POSTGRES_USER: orbynex_user
      POSTGRES_PASSWORD: secretpass
      POSTGRES_DB: orbynex_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

volumes:
  postgres_data:
```

---

## Comandos Frecuentes en el Día a Día

```bash
# Construir y levantar todos los servicios en segundo plano
docker compose up -d --build

# Ver el estado de los contenedores
docker compose ps

# Inspeccionar los logs de un servicio específico
docker compose logs -f web

# Detener y eliminar contenedores y redes
docker compose down -v
```

---

## Resumen

Con Docker y Compose garantizas que tu aplicación se comporte exactamente igual en tu máquina de desarrollo, en servidores de prueba y en clústeres de producción en la nube.
