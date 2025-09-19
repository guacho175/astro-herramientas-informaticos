---
title: "Cómo usar Git y GitHub"
description: "Aprende los comandos básicos para trabajar con repositorios."
slug: "git-github"
image: "https://git-scm.com/images/logos/downloads/Git-Icon-1788C.png"
updated: "Sep 2025"
---

## Introducción
Git es un sistema de control de versiones distribuido. Permite trabajar en equipo sobre un mismo proyecto y mantener un historial de cambios seguro y confiable.  
GitHub, en cambio, es una plataforma en la nube que permite alojar repositorios de Git, colaborar con otros desarrolladores y automatizar flujos de trabajo.

---

## Instalación y configuración inicial

1. **Instalar Git**
   - Windows: [gitforwindows.org](https://gitforwindows.org)  
   - macOS: `brew install git`  
   - Linux: `sudo apt install git`

2. **Configurar usuario y correo (una sola vez)**
   ```bash
   git config --global user.name "Tu Nombre"
   git config --global user.email "tu-correo@ejemplo.com"
   git config --global init.defaultBranch main
   ```

3. **Verificar instalación**
   ```bash
   git --version
   ```

---

## Comandos básicos

- `git init` → Crea un nuevo repositorio en la carpeta actual.  
- `git add .` → Añade todos los cambios al “staging area”.  
- `git commit -m "mensaje"` → Guarda los cambios en el historial.  
- `git status` → Muestra el estado actual de los archivos.  
- `git push` → Envía cambios al repositorio remoto (GitHub).  
- `git pull` → Descarga cambios desde el remoto y los integra.  

Ejemplo:
```bash
git add .
git commit -m "feat: primera versión del proyecto"
git push origin main
```

---

## Conectar Git con GitHub

1. Crea un nuevo repositorio en GitHub.  
2. Copia la URL (HTTPS o SSH).  
3. Conéctalo desde tu proyecto local:
   ```bash
   git remote add origin https://github.com/usuario/mi-proyecto.git
   git branch -M main
   git push -u origin main
   ```

---

## Flujo de trabajo básico

1. Verifica en qué rama estás:
   ```bash
   git branch
   ```
2. Haz cambios en tu código.  
3. Agrega los cambios:
   ```bash
   git add archivo.astro
   ```
4. Confirma el commit:
   ```bash
   git commit -m "fix: corregido estilo del menú lateral"
   ```
5. Sube a GitHub:
   ```bash
   git push
   ```

---

## Ramas y colaboración

- Crear nueva rama:
  ```bash
  git checkout -b feat/nueva-funcion
  ```
- Cambiar entre ramas:
  ```bash
  git switch main
  ```
- Fusionar ramas:
  ```bash
  git merge feat/nueva-funcion
  ```
- Subir una rama y abrir Pull Request:
  ```bash
  git push -u origin feat/nueva-funcion
  ```

---

## Ignorar archivos con `.gitignore`

Ejemplo para proyectos Node/Astro:
```
node_modules/
dist/
.vscode/
.env
```

---

## Resolver conflictos

Si al hacer `git pull` aparecen conflictos:
1. Abre el archivo conflictivo, verás marcas como:
   ```
   <<<<<<< HEAD
   tu código local
   =======
   cambios remotos
   >>>>>>> rama-remota
   ```
2. Elige qué parte conservar.  
3. Guarda, luego:
   ```bash
   git add archivo
   git commit
   ```

---

## Ver historial y deshacer

- Ver historial:
  ```bash
  git log --oneline --graph
  ```
- Revertir un commit:
  ```bash
  git revert <hash>
  ```
- Restaurar archivo:
  ```bash
  git restore archivo.md
  ```

---

## Buenas prácticas

- Commits pequeños y descriptivos (usa prefijos: `feat`, `fix`, `docs`, `style`, etc.).  
- Usa ramas para cada nueva funcionalidad.  
- Protege la rama `main` en GitHub.  
- Nunca subas contraseñas o archivos sensibles.  

Ejemplo de mensajes claros:
```bash
git commit -m "feat(tutorial): agregar sección de ramas y colaboración"
git commit -m "fix(styles): corregir contraste en modo oscuro"
```

---

## Mini guía rápida

```bash
# Iniciar repositorio
git init
git clone <url>

# Ciclo básico
git status
git add .
git commit -m "mensaje"
git push
git pull

# Ramas
git checkout -b nueva-rama
git merge nueva-rama
git branch -d nueva-rama

# Historial
git log --oneline
git diff
```

---

## Conclusión
Git y GitHub son herramientas fundamentales para el trabajo en equipo y el control de versiones. Dominar su uso te permitirá mantener proyectos organizados, colaborar sin perder información y desplegar tus aplicaciones de forma más segura y profesional.
