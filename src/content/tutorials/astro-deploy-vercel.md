---
title: "Cómo desplegar tu sitio Astro en Vercel"
description: "Aprende a conectar tu proyecto Astro con Vercel y publicar tu sitio en línea en pocos pasos."
slug: "astro-deploy-vercel"
image: "https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png"
updated: "Sep 2025"
---

## Introducción
Vercel es una plataforma ideal para desplegar sitios Astro, ya que ofrece integración directa, CI/CD y dominio gratuito.

---

## Paso 1: Subir el proyecto a GitHub

1. Inicia un repositorio local con Git.
2. Crea el repositorio en GitHub.
3. Empuja tu código:
```bash
git remote add origin https://github.com/usuario/mi-sitio.git
git push -u origin main
```

---

## Paso 2: Crear cuenta en Vercel

- Ve a [vercel.com](https://vercel.com)
- Inicia sesión con tu cuenta de GitHub
- Autoriza el acceso a tus repositorios

---

## Paso 3: Importar el proyecto Astro

1. Clic en "New Project"
2. Selecciona tu repo de GitHub
3. Verifica que detecte Astro automáticamente
4. Usa configuración por defecto: `npm install && npm run build`

---

## Paso 4: Personaliza tu dominio

- Vercel genera un dominio gratuito `misitio.vercel.app`
- Puedes conectar un dominio propio (ej. `tudominio.cl`)

---

## CI/CD automático

Cada vez que hagas `git push` a `main`, Vercel reconstruirá y publicará automáticamente el sitio.

---

## Conclusión

Con Vercel, publicar un proyecto Astro es fácil, rápido y profesional. Ideal para portafolios, blogs y landing pages.
