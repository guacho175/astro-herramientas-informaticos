# 🚀 Portal de Herramientas e Insumos Informáticos

[![Astro](https://img.shields.io/badge/Astro-v5.13-ff5d01?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed%20with-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://herramientastic.orbynexdigital.cl)

Motor de generación de tutoriales técnicos y portal público de utilidades, aplicaciones y calculadoras de informática. Construido con **Astro 5** en modo servidor, **Tailwind CSS** y **Supabase**.

> 📌 **Documentación técnica:** este README es material de presentación. El estado real del sistema vive en [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md), y las reglas para agentes de código en [`AGENTS.md`](AGENTS.md).

---

## 🌐 Despliegue en Producción

- **Dominio Principal:** [herramientastic.orbynexdigital.cl](https://herramientastic.orbynexdigital.cl)
- **URL Alternativa Vercel:** [astro-herramientas-informaticos.vercel.app](https://astro-herramientas-informaticos.vercel.app)

---

## ✨ Características Principales

- 🤖 **Generación de tutoriales con IA:** panel administrativo que crea artículos técnicos mediante la API de Gemini y los publica al instante.
- 📚 **Guías dinámicas:** los tutoriales se almacenan en Supabase y se renderizan en servidor, sin necesidad de redesplegar para publicar.
- 🛠️ **Catálogo de Herramientas:** selección curada de software, extensiones e IDEs para productividad.
- 🧮 **Calculadoras y Utilidades:** subredes, bases numéricas, hashes, contraseñas, ancho de banda y conversión de almacenamiento.
- 🎨 **Diseño Moderno & Responsive:** interfaz optimizada para móvil, tablet y escritorio, con modo oscuro.
- ⚡ **Rendimiento:** renderizado en servidor con caché en el edge (`stale-while-revalidate`) para minimizar latencia y consultas a la base de datos.

---

## 📂 Estructura del Proyecto

```text
/
├── public/                # Archivos estáticos e imágenes públicas
├── docs/                  # Documentación canónica (estado, API, contenido, ADR)
├── scripts/               # Utilidades operativas (seed, admin, verificación)
├── supabase/
│   └── migrations/        # Esquema de base de datos
├── src/
│   ├── assets/            # Recursos visuales e íconos SVG
│   ├── components/        # Componentes UI y calculadoras
│   ├── data/              # Catálogos estáticos (herramientas, calculadoras)
│   ├── layouts/           # Plantillas base
│   ├── lib/               # Capas: domain · application · infrastructure
│   └── pages/             # Enrutamiento por archivos
│       ├── admin/         # Panel de generación de tutoriales
│       ├── api/           # Endpoints (generación, búsqueda)
│       └── blog/          # Apps, Calculadoras y Guías ([slug].astro)
├── AGENTS.md              # Reglas para agentes de código
├── astro.config.mjs
└── package.json
```

---

## 🛠️ Instalación y Desarrollo Local

### Requisitos Previos
- **Node.js**: v18.x o superior
- **npm**: v9.x o superior
- Un proyecto de **Supabase** con las migraciones de `supabase/migrations/` aplicadas
- Una clave de API de **Google Gemini** (solo si vas a usar el generador)

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/guacho175/astro-herramientas-informaticos.git
   cd astro-herramientas-informaticos
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar el entorno:** crea un archivo `.env` en la raíz con estas variables:
   ```bash
   PUBLIC_SUPABASE_URL=
   PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   GEMINI_API_KEY=
   ```
   > ⚠️ `SUPABASE_SERVICE_ROLE_KEY` omite las políticas de seguridad de la base de datos. Nunca la expongas al cliente ni la incluyas en un commit.

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:4321](http://localhost:4321) en tu navegador.

---

## 🧞 Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor local de desarrollo en `localhost:4321`. |
| `npm run build` | Compila la aplicación para producción. |
| `npm run preview` | Previsualiza la compilación localmente. |
| `node scripts/check-docs.mjs` | Valida la consistencia de la documentación. |
| `npx vercel` | Despliega una versión de prueba en Vercel. |
| `npx vercel --prod` | Despliega la versión de producción. |

El despliegue habitual es automático: Vercel compila en cada push a `main`.

---

## 📄 Licencia

Repositorio privado. Todos los derechos reservados.
