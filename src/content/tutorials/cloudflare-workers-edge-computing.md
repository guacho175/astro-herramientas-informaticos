---
title: "Cloudflare Workers & Edge Computing Serverless"
description: "Ejecuta funciones serverless con latencia ultra-baja en más de 300 ciudades directamente en el Edge."
slug: "cloudflare-workers-edge-computing"
image: "https://upload.wikimedia.org/wikipedia/commons/9/94/Cloudflare_Logo.png"
updated: "Jul 2026"
---

## ¿Qué es el Edge Computing?

A diferencia de las funciones serverless tradicionales que corren en una sola región cloud, **Cloudflare Workers** ejecuta el código JavaScript/TypeScript en la ubicación física de la red CDN más cercana al usuario final.

---

## 1. Código de un Cloudflare Worker (Wrangler / TypeScript)

```typescript
export interface Env {
  DB_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/time') {
      const time = new Date().toISOString();
      return new Response(JSON.stringify({ edgeTime: time }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response('Worker activo en el Edge de Cloudflare', { status: 200 });
  },
};
```

---

## 2. Almacenamiento Key-Value Ultra Rápido (KV Storage)

Puedes almacenar datos globales en caché con respuestas menores a 10ms:

```typescript
// Guardar valor en KV
await env.DB_KV.put('user_config', JSON.stringify({ theme: 'dark' }), { expirationTtl: 3600 });

// Obtener valor desde el nodo local
const config = await env.DB_KV.get('user_config');
```

---

## Despliegue en 1 Comando

```bash
npx wrangler deploy
```

---

## Conclusión

El cómputo en el Edge redefine la velocidad percibida por el usuario, eliminando la latencia de ida y vuelta a servidores centrales.
