import type { APIRoute } from 'astro';
import { adminAuthService, isSameOrigin } from '../../../lib/application/services/AdminAuthService';
import { manualTutorialService } from '../../../lib/application/services/ManualTutorialService';

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function parseBody(value: unknown): { topic: string } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const topic = (value as Record<string, unknown>).topic;
  return typeof topic === 'string' ? { topic: topic.trim() } : null;
}

export const POST: APIRoute = async ({ request }) => {
  if (!isSameOrigin(request)) {
    return json({ error: 'El origen de la solicitud no está permitido.' }, 403);
  }
  if (!adminAuthService.getSession(request)) {
    return json({ error: 'La sesión administrativa no es válida o expiró.' }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'El cuerpo de la solicitud debe ser JSON válido.' }, 400);
  }

  const input = parseBody(body);
  if (!input || !input.topic || input.topic.length > 200) {
    return json({ error: 'El tema debe contener entre 1 y 200 caracteres.' }, 400);
  }

  try {
    const tutorial = await manualTutorialService.generate(input.topic);
    return json({ success: true, message: 'Tutorial generado y guardado exitosamente.', data: tutorial }, 200);
  } catch {
    console.error('[Admin API] La generación manual del tutorial falló.');
    return json({ error: 'No fue posible generar y guardar el tutorial.' }, 500);
  }
};
