// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind'; // ✅ IMPORTANTE

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()], // ✅ AGREGA EL PLUGIN AQUÍ
});
