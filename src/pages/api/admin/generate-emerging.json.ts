import type { APIRoute } from 'astro';
import { adminAuthService, isSameOrigin } from '../../../lib/application/services/AdminAuthService';
import {
  panelTutorialGenerationService,
  PanelGenerationBusyError,
} from '../../../lib/application/services/PanelTutorialGenerationService';

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

export const POST: APIRoute = async ({ request }) => {
  if (!isSameOrigin(request)) {
    return json({ success: false, error: 'El origen de la solicitud no está permitido.' }, 403);
  }
  if (!adminAuthService.getSession(request)) {
    return json({ success: false, error: 'La sesión administrativa no es válida o expiró.' }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'El cuerpo de la solicitud debe ser JSON válido.' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ success: false, error: 'La solicitud no tiene el formato esperado.' }, 400);
  }

  try {
    const run = await panelTutorialGenerationService.run();
    const status = run.failed === run.requested ? 500 : run.failed > 0 ? 207 : 200;
    return json({
      success: run.failed === 0,
      batchId: run.batchId,
      message: run.failed === 0
        ? 'Lote automático completado.'
        : run.failed === run.requested
          ? 'No se pudo generar ningún tutorial.'
          : 'El lote terminó parcialmente.',
      ...run,
    }, status);
  } catch (error) {
    if (error instanceof PanelGenerationBusyError) {
      return json({
        success: false,
        error: 'Ya hay un lote automático en curso. Espera su resultado antes de iniciar otro.',
      }, 409);
    }
    console.error('[Admin API] La ejecución diaria desde el panel falló.');
    return json({ success: false, error: 'No fue posible ejecutar el lote automático.' }, 500);
  }
};

export const maxDuration = 300;
