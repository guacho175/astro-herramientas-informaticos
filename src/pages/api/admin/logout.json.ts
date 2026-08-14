import type { APIRoute } from 'astro';
import { adminAuthService, isSameOrigin } from '../../../lib/application/services/AdminAuthService';

export const POST: APIRoute = async ({ request }) => {
  if (!isSameOrigin(request)) {
    return new Response(JSON.stringify({ error: 'El origen de la solicitud no está permitido.' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Set-Cookie': adminAuthService.clearSessionCookie(),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
