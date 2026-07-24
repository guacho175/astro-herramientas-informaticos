# 🚀 Portal de Herramientas e Insumos Informáticos

[![Astro](https://img.shields.io/badge/Astro-v5.13-ff5d01?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deployed%20with-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://herramientastic.orbynexdigital.cl)
[![License](https://img.shields.io/badge/License-MIT-blue.style=flat-square)](LICENSE)

Portal web de utilidades, aplicaciones esenciales, calculadoras y guías técnicas de informática para estudiantes, profesionales y entusiastas del desarrollo de software. Diseñado con una arquitectura moderna, rápida y estática utilizando **Astro 5** and **Tailwind CSS**.

---

## 🌐 Despliegue en Producción

- **Dominio Principal:** [herramientastic.orbynexdigital.cl](https://herramientastic.orbynexdigital.cl)
- **URL Alternativa Vercel:** [astro-herramientas-informaticos.vercel.app](https://astro-herramientas-informaticos.vercel.app)

---

## ✨ Características Principales

- 📚 **Guías y Tutoriales Dinámicos:** Colecciones de contenido Markdown administradas mediante la API de colecciones nativa de Astro.
- 🛠️ **Catálogo de Herramientas:** Selección curada de software, extensiones e IDEs indispensables para productividad.
- 🧮 **Calculadoras y Utilidades:** Herramientas interactivas para conversión y cómputo informático.
- 🎨 **Diseño Moderno & Responsive:** Interfaz optimizada para pantallas móviles, tablets y de escritorio con Tailwind CSS.
- ⚡ **Rendimiento Ultra Rápido:** Compilado como sitio 100% estático (SSG), garantizando puntuaciones de 100% en Lighthouse.

---

## 📂 Estructura del Proyecto

```text
/
├── public/                # Archivos estáticos e imágenes públicas
├── src/
│   ├── assets/            # Recursos visuales e íconos SVG
│   ├── components/        # Componentes UI reutilizables (Navbar, Cards, Footer)
│   ├── content/           # Colecciones de contenido Markdown
│   │   ├── tutorials/     # Artículos y tutoriales (.md)
│   │   └── content.config.ts  # Configuración y esquema de Zod
│   ├── data/              # Datos estáticos (Herramientas, tutoriales destacados)
│   ├── layouts/           # Plantilla base (Layout.astro)
│   └── pages/             # Enrutamiento basado en archivos (.astro)
│       ├── blog/          # Secciones de Apps, Calculadoras y Guías ([slug].astro)
│       ├── contacto.astro
│       ├── index.astro
│       └── politicas.astro
├── astro.config.mjs       # Configuración global de Astro e integraciones
└── package.json
```

---

## 🛠️ Instalación y Desarrollo Local

### Requisitos Previos
- **Node.js**: v18.x o superior
- **npm**: v9.x o superior

### Pasos:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/guacho175/astro-herramientas-informaticos.git
   cd astro-herramientas-informaticos
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:4321](http://localhost:4321) en tu navegador para ver la aplicación en vivo.

---

## 🧞 Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor local de desarrollo en `localhost:4321`. |
| `npm run build` | Compila la aplicación para producción en la carpeta `./dist`. |
| `npm run preview` | Previsualiza la compilación localmente antes de desplegar. |
| `npx vercel` | Despliega una versión de prueba en Vercel. |
| `npx vercel --prod` | Despliega directamente la versión de producción en Vercel. |

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Siéntete libre de utilizarlo como referencia en tu portafolio o proyectos personales.
