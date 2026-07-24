---
title: "Guía Completa de Git y GitHub: Comandos y Flujos de Trabajo"
description: "Aprende el flujo de trabajo profesional con Git y GitHub: commits, ramas, rebase, resolución de conflictos y Pull Requests."
slug: "git-github"
image: "https://git-scm.com/images/logos/downloads/Git-Icon-1788C.png"
updated: "Jul 2026"
---

## Introducción a Git y GitHub

**Git** es un sistema de control de versiones distribuido que permite registrar cada cambio realizado en el código fuente, facilitando el trabajo colaborativo sin riesgo de sobrescribir avances.

![Git Logo](https://git-scm.com/images/logos/downloads/Git-Icon-1788C.png)

---

## 1. Configuración Inicial del Entorno

```bash
# Configurar identidad global de usuario
git config --global user.name "Tu Nombre"
git config --global user.email "tu@correo.com"

# Configurar rama por defecto como 'main'
git config --global init.defaultBranch main
```

---

## 2. Flujo de Trabajo Diario en Ramas (Feature Branch Workflow)

```bash
# 1. Crear y cambiar a una nueva rama de funcionalidad
git checkout -b feature/nueva-funcionalidad

# 2. Verificar el estado de los archivos modificados
git status

# 3. Agregar cambios al área de preparación (staging)
git add .

# 4. Crear un commit descriptivo siguiendo la convención Conventional Commits
git commit -m "feat: agregar módulo de autenticación con JWT"

# 5. Enviar la rama al repositorio remoto en GitHub
git push -u origin feature/nueva-funcionalidad
```

---

## 3. Resolución de Conflictos y Rebase

Cuando la rama `main` avanza, re-sincroniza tu rama antes de solicitar el *Pull Request*:

```bash
# Actualizar la rama main local
git checkout main
git pull origin main

# Reaplicar los commits de tu rama sobre el último estado de main
git checkout feature/nueva-funcionalidad
git rebase main
```

---

## Comandos Utilitarios de Rescate

```bash
# Deshacer el último commit manteniendo los cambios en staging
git reset --soft HEAD~1

# Guardar temporalmente cambios no commiteados (stashing)
git stash save "trabajo en progreso"
git stash pop
```

---

## Conclusión

El dominio de Git es la habilidad fundamental indispensable para cualquier desarrollador de software profesional.
