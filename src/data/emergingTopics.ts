export interface EmergingTopic {
  id: string;
  title: string;
  brief: string;
  category: string;
  sources: readonly string[];
  dedupeTerms: readonly string[];
}

/**
 * Temas rotativos para el generador diario.
 *
 * Las fuentes son documentación primaria. El modelo debe basarse en ellas y
 * distinguir claramente entre funciones estables, previews y anuncios.
 */
export const emergingTopics: readonly EmergingTopic[] = [
  {
    id: 'astro-novedades',
    title: 'Novedades de Astro para sitios modernos',
    brief: 'Explica una capacidad reciente y estable de Astro con un ejemplo práctico, requisitos de versión y advertencias de migración.',
    category: 'Desarrollo Web',
    sources: ['https://astro.build/blog/', 'https://docs.astro.build/'],
    dedupeTerms: ['novedades de astro', 'astro 5'],
  },
  {
    id: 'vercel-ai-gateway',
    title: 'Vercel AI Gateway en proyectos reales',
    brief: 'Crea una guía para integrar Vercel AI Gateway, seleccionar modelos y diseñar fallback sin quedar acoplado a un proveedor.',
    category: 'Inteligencia Artificial',
    sources: ['https://vercel.com/docs/ai-gateway', 'https://vercel.com/docs/ai-gateway/models-and-providers'],
    dedupeTerms: ['vercel ai gateway', 'ai gateway de vercel'],
  },
  {
    id: 'cloudflare-workers-ai',
    title: 'Primeros pasos con Cloudflare Workers AI',
    brief: 'Enseña a ejecutar un modelo desde un Worker, proteger credenciales y controlar consumo y errores.',
    category: 'Cloud',
    sources: ['https://developers.cloudflare.com/workers-ai/', 'https://developers.cloudflare.com/workers-ai/get-started/'],
    dedupeTerms: ['cloudflare workers ai', 'workers ai'],
  },
  {
    id: 'chatgpt-apps',
    title: 'Cómo crear una aplicación para ChatGPT',
    brief: 'Presenta el flujo vigente para crear una app conectada a ChatGPT, con arquitectura, herramientas y seguridad básica.',
    category: 'Inteligencia Artificial',
    sources: ['https://developers.openai.com/apps-sdk/', 'https://platform.openai.com/docs/'],
    dedupeTerms: ['aplicación para chatgpt', 'apps sdk'],
  },
  {
    id: 'agentes-openai',
    title: 'Agentes de IA con herramientas y trazabilidad',
    brief: 'Explica cómo construir un agente pequeño, limitar sus herramientas y observar sus ejecuciones con prácticas actuales.',
    category: 'Inteligencia Artificial',
    sources: ['https://openai.github.io/openai-agents-js/', 'https://platform.openai.com/docs/guides/agents'],
    dedupeTerms: ['agentes de ia con herramientas', 'openai agents sdk'],
  },
  {
    id: 'gemini-structured-output',
    title: 'JSON confiable con Structured Outputs de Gemini',
    brief: 'Muestra cómo solicitar respuestas con esquema, validarlas y manejar errores sin confiar ciegamente en la salida del modelo.',
    category: 'Inteligencia Artificial',
    sources: ['https://ai.google.dev/gemini-api/docs/structured-output', 'https://ai.google.dev/gemini-api/docs'],
    dedupeTerms: ['structured outputs de gemini', 'json con gemini'],
  },
  {
    id: 'supabase-edge-functions',
    title: 'Automatizaciones con Supabase Edge Functions',
    brief: 'Construye una automatización segura con Edge Functions, secretos del servidor y acceso a la base de datos.',
    category: 'Backend',
    sources: ['https://supabase.com/docs/guides/functions', 'https://supabase.com/docs/guides/functions/secrets'],
    dedupeTerms: ['supabase edge functions', 'edge functions de supabase'],
  },
  {
    id: 'mcp-servidor',
    title: 'Construye tu primer servidor MCP',
    brief: 'Explica los conceptos de Model Context Protocol y crea un servidor pequeño con herramientas limitadas y entradas validadas.',
    category: 'Inteligencia Artificial',
    sources: ['https://modelcontextprotocol.io/docs/getting-started/intro', 'https://modelcontextprotocol.io/specification/'],
    dedupeTerms: ['servidor mcp', 'model context protocol'],
  },
  {
    id: 'passkeys-web',
    title: 'Autenticación web moderna con passkeys',
    brief: 'Introduce passkeys y WebAuthn con un flujo práctico, compatibilidad, recuperación de cuenta y errores frecuentes.',
    category: 'Ciberseguridad',
    sources: ['https://web.dev/articles/passkey-registration', 'https://www.w3.org/TR/webauthn-3/'],
    dedupeTerms: ['autenticación con passkeys', 'passkeys y webauthn'],
  },
  {
    id: 'webgpu',
    title: 'Computación acelerada en el navegador con WebGPU',
    brief: 'Explica cuándo usar WebGPU, cómo detectar compatibilidad y ejecutar un ejemplo seguro con fallback.',
    category: 'Desarrollo Web',
    sources: ['https://developer.mozilla.org/docs/Web/API/WebGPU_API', 'https://www.w3.org/TR/webgpu/'],
    dedupeTerms: ['navegador con webgpu', 'introducción a webgpu'],
  },
  {
    id: 'node-permissions',
    title: 'Reduce riesgos con el modelo de permisos de Node.js',
    brief: 'Enseña a restringir filesystem, procesos y red en una aplicación Node.js, incluyendo limitaciones y verificación.',
    category: 'Ciberseguridad',
    sources: ['https://nodejs.org/api/permissions.html', 'https://nodejs.org/en/learn/getting-started/security-best-practices'],
    dedupeTerms: ['permisos de node.js', 'permission model de node'],
  },
  {
    id: 'github-actions-oidc',
    title: 'Despliegues sin claves permanentes con GitHub Actions y OIDC',
    brief: 'Configura autenticación federada desde CI, permisos mínimos y protecciones de entorno sin guardar credenciales duraderas.',
    category: 'DevOps',
    sources: ['https://docs.github.com/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect', 'https://docs.github.com/actions/security-for-github-actions/security-guides/automatic-token-authentication'],
    dedupeTerms: ['github actions y oidc', 'despliegues sin claves permanentes'],
  },
  {
    id: 'container-security',
    title: 'Imágenes de contenedor pequeñas y seguras',
    brief: 'Crea una imagen reproducible con usuario no root, build multietapa, dependencias fijadas y escaneo básico.',
    category: 'DevOps',
    sources: ['https://docs.docker.com/build/building/best-practices/', 'https://docs.docker.com/scout/'],
    dedupeTerms: ['contenedor pequeñas y seguras', 'seguridad de imágenes docker'],
  },
  {
    id: 'postgres-vector-search',
    title: 'Búsqueda semántica con Postgres y pgvector',
    brief: 'Implementa una búsqueda vectorial pequeña, explica índices, filtrado y evaluación de resultados.',
    category: 'Bases de Datos',
    sources: ['https://github.com/pgvector/pgvector', 'https://supabase.com/docs/guides/ai/vector-columns'],
    dedupeTerms: ['postgres y pgvector', 'búsqueda semántica con postgres'],
  },
  {
    id: 'browser-view-transitions',
    title: 'Transiciones de vista nativas para aplicaciones web',
    brief: 'Crea transiciones progresivas con View Transition API, accesibilidad y fallback para navegadores no compatibles.',
    category: 'Desarrollo Web',
    sources: ['https://developer.mozilla.org/docs/Web/API/View_Transition_API', 'https://www.w3.org/TR/css-view-transitions-1/'],
    dedupeTerms: ['transiciones de vista nativas', 'view transition api'],
  },
  {
    id: 'observabilidad-opentelemetry',
    title: 'Observabilidad portable con OpenTelemetry',
    brief: 'Instrumenta una aplicación web con trazas y atributos útiles, evitando datos sensibles y dependencia del proveedor.',
    category: 'DevOps',
    sources: ['https://opentelemetry.io/docs/languages/js/', 'https://opentelemetry.io/docs/concepts/observability-primer/'],
    dedupeTerms: ['observabilidad con opentelemetry', 'opentelemetry para javascript'],
  },
];
