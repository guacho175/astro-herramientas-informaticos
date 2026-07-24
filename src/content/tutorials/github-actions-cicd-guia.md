---
title: "GitHub Actions: Guía Completa de Automatización CI/CD"
description: "Crea pipelines de integración y despliegue continuo automatizados con GitHub Actions, Docker y Vercel."
slug: "github-actions-cicd-guia"
image: "https://github.githubassets.com/images/modules/site/features/actions-icon-actions.svg"
updated: "Jul 2026"
---

## Introducción a GitHub Actions

**GitHub Actions** es la plataforma de automatización de flujos de trabajo nativa de GitHub. Permite construir, probar y desplegar código directamente desde tu repositorio al ocurrir eventos como `push`, `pull_request` o lanzamientos de `release`.

![GitHub Actions Logo](https://github.githubassets.com/images/modules/site/features/actions-icon-actions.svg)

---

## 1. Pipeline de CI/CD Completo (`.github/workflows/main.yml`)

```yaml
name: Production CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  audit-and-test:
    name: 🧪 Auditar & Compilar
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Clonar Repositorio
        uses: actions/checkout@v4

      - name: 🟢 Configurar Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: 📦 Instalación de Dependencias
        run: npm ci

      - name: 🔍 Verificación de TypeScript
        run: npm run check

      - name: 🏗️ Compilación de Producción
        run: npm run build

  deploy-production:
    name: 🚀 Despliegue a Producción Vercel
    needs: audit-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Clonar Repositorio
        uses: actions/checkout@v4

      - name: ⚡ Desplegar a Vercel por CLI
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 2. Configuración de Secretos de Seguridad

Guarda siempre las credenciales en **Settings > Secrets and variables > Actions**:
- `VERCEL_TOKEN`: Token de autenticación de tu cuenta de Vercel.
- `VERCEL_ORG_ID`: ID del equipo/usuario.
- `VERCEL_PROJECT_ID`: ID único del proyecto.

---

## Conclusión

Integrar GitHub Actions garantiza entregas continuas confiables, reduciendo a cero los errores manuales al desplegar a producción.
