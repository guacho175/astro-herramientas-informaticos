import type { APIRoute } from 'astro';
import { adminAuthService, isSameOrigin } from '../../../lib/application/services/AdminAuthService';

function json(body: Record<string, unknown>, status: number, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

function parseBody(value: unknown): { password: string } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const password = (value as Record<string, unknown>).password;
  return typeof password === 'string' ? { password } : null;
}

export const POST: APIRoute = async ({ request }) => {
  if (!isSameOrigin(request)) {
    return json({ error: 'El origen de la solicitud no está permitido.' }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'El cuerpo de la solicitud debe ser JSON válido.' }, 400);
  }

  const input = parseBody(body);
  if (!input || !input.password || input.password.length > 1_024) {
    return json({ error: 'Las credenciales no son válidas.' }, 401);
  }

  try {
    if (!await adminAuthService.authenticate(input.password)) {
      return json({ error: 'Las credenciales no son válidas.' }, 401);
    }

    return json(
      { success: true, message: 'Sesión iniciada.' },
      200,
      { 'Set-Cookie': adminAuthService.createSessionCookie() },
    );
  } catch {
    console.error('[Admin API] No fue posible iniciar la sesión administrativa.');
    return json({ error: 'La autenticación administrativa no está disponible.' }, 500);
  }
};
