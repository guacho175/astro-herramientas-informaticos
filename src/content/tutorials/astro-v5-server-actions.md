---
title: "Guía Definitiva de Server Actions en Astro 5"
description: "Aprende a gestionar mutaciones de datos tipo-seguras en el servidor con la API nativa de Server Actions en Astro 5."
slug: "astro-v5-server-actions"
image: "https://astro.build/assets/press/astro-icon-dark.svg"
updated: "Jul 2026"
---

## Introducción a Astro 5 y Server Actions

Con la llegada de **Astro 5**, el desarrollo de aplicaciones web híbridas ha alcanzado un nuevo nivel de madurez. Las **Server Actions** permiten ejecutar código en el servidor directamente desde el cliente con validación de tipos Zod de extremo a extremo, sin necesidad de crear endpoints API independientes.

---

## Requisitos Previos

- Node.js v18.x o v20.x superior.
- Proyecto Astro 5 configurado con `output: 'server'` o `output: 'hybrid'`.

```bash
npm install astro@latest
```

---

## Configuración del Servidor y Acción

Para definir una acción, se utiliza el objeto `defineAction` importado de `astro:actions`:

```typescript
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  subscribeNewsletter: defineAction({
    accept: 'form',
    input: z.object({
      email: z.string().email('El correo electrónico no es válido'),
    }),
    handler: async (input) => {
      // Lógica de servidor: guardar en base de datos o servicio externo
      console.log(`Email suscrito: ${input.email}`);

      return { success: true, message: '¡Gracias por suscribirte!' };
    },
  }),
};
```

---

## Invocación en Componentes Astro

Puedes invocar la acción directamente desde el cliente mediante `actions`:

```astro
---
// src/pages/index.astro
---

<form id="newsletter-form">
  <input type="email" name="email" placeholder="tu@correo.com" required />
  <button type="submit">Suscribirme</button>
</form>

<script>
  import { actions } from 'astro:actions';

  const form = document.getElementById('newsletter-form') as HTMLFormElement;

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const { data, error } = await actions.subscribeNewsletter(formData);

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      alert(data.message);
    }
  });
</script>
```

---

## Conclusión

Las Server Actions en Astro 5 eliminan la necesidad de código repetitivo de boilerplate para APIs REST, garantizando un tipado estricto y seguro de extremo a extremo.
