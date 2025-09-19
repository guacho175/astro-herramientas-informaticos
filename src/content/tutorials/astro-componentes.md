---
title: "Componentes en Astro"
description: "Aprende cómo crear y reutilizar componentes en Astro para mantener tu código modular y eficiente."
slug: "astro-componentes"
image: "/images/tutorials/astro-icon-dark.png"
updated: "Sep 2025"
---

## Introducción
Astro permite crear sitios web rápidos y modernos usando componentes reutilizables. Aprender a trabajar con componentes te ayudará a mantener una estructura limpia y escalable.

---

## ¿Qué es un componente en Astro?
Un componente es un archivo `.astro` que encapsula estructura HTML, lógica y estilo. Se puede reutilizar en múltiples páginas o layouts.

---

## Crear un componente básico

📁 `src/components/Titulo.astro`
```astro
---
const { texto } = Astro.props;
---
<h2 class="text-3xl font-bold text-blue-600 mb-4">{texto}</h2>
```

### Usarlo en una página:
```astro
---
import Titulo from "../components/Titulo.astro";
---
<Titulo texto="Bienvenido a mi sitio" />
```

---

## Componentes con slot (contenido dinámico)

📁 `Card.astro`
```astro
<article class="p-6 rounded-lg shadow-md bg-white dark:bg-gray-900">
  <slot />
</article>
```

Uso:
```astro
<Card>
  <h3>Contenido de la tarjeta</h3>
</Card>
```

---

## Recomendaciones

- Usa PascalCase en nombres: `MiComponente.astro`
- Coloca los componentes en `src/components/`
- Usa props para recibir datos y slots para contenido anidado

---

## Conclusión

El uso de componentes en Astro mejora la organización del proyecto, reduce duplicación de código y favorece el mantenimiento.
