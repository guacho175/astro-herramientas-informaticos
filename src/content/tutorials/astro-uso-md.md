---
title: "Uso de contenido Markdown en Astro"
description: "Aprende cómo integrar archivos Markdown para crear blogs o secciones de contenido dinámico en tu proyecto Astro."
slug: "astro-uso-md"
image: "/images/tutorials/astro-icon-dark.png"
updated: "Sep 2025"
---

## Introducción
Astro permite leer y renderizar archivos Markdown (`.md`) como contenido dinámico. Ideal para blogs, tutoriales, documentación y más.

---

## Estructura recomendada

```
src/
└── content/
    └── tutorials/
        ├── git-github.md
        └── nuevo-tutorial.md
```

---

## Configurar colección de contenido

📄 `src/content/config.ts`
```ts
import { defineCollection, z } from "astro:content";

const tutorials = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    image: z.string(),
    updated: z.string(),
  })
});

export const collections = {
  tutorials,
};
```

---

## Leer Markdown con rutas dinámicas

📄 `[slug].astro`
```astro
import { getEntryBySlug } from "astro:content";
const { slug } = Astro.params;
const tutorial = await getEntryBySlug("tutorials", slug);
const { Content } = await tutorial.render();
```

---

## Estilizar contenido con `prose`

Instala plugin:
```bash
npm install -D @tailwindcss/typography
```

En `tailwind.config.cjs`:
```js
plugins: [require('@tailwindcss/typography')],
```

Uso:
```html
<article class="prose dark:prose-invert">
  <Content />
</article>
```

---

## Conclusión

Markdown + Astro te permite separar contenido del código y escalar tu sitio fácilmente sin duplicar layouts.
