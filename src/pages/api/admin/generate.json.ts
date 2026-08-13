import { aiGeneratorService } from '../../../lib/application/services/AIGeneratorService';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import crypto from 'crypto';
import type { APIRoute } from 'astro';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const jsonResponse = (body: Record<string, unknown>, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });

/** Verifica un hash scrypt almacenado como salt:key. */
function verifyPassword(password: string, hash: unknown): boolean {
  if (typeof hash !== 'string') {
    return false;
  }

  try {
    const [salt, key, ...extraParts] = hash.split(':');
    if (!salt || !key || extraParts.length > 0 || !/^[a-f\d]{128}$/i.test(key)) {
      return false;
    }

    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, keyBuffer.length);
    return keyBuffer.length === derivedKey.length && crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

function parseRequestBody(value: unknown): { topic: string; password: string } | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const body = value as Record<string, unknown>;
  if (
    (body.topic !== undefined && typeof body.topic !== 'string') ||
    (body.password !== undefined && typeof body.password !== 'string')
  ) {
    return null;
  }

  return {
    topic: typeof body.topic === 'string' ? body.topic.trim() : '',
    password: typeof body.password === 'string' ? body.password : ''
  };
}

export const POST: APIRoute = async ({ request }) => {
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return jsonResponse({ error: 'El cuerpo de la solicitud debe ser JSON válido.' }, 400);
  }

  const input = parseRequestBody(requestBody);
  if (!input) {
    return jsonResponse({ error: 'La solicitud no tiene el formato esperado.' }, 400);
  }

  if (!input.password || input.password.length > 1_024) {
    return jsonResponse({ error: 'Falta la contraseña.' }, 401);
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Admin API] La configuración de Supabase no está disponible.');
    return jsonResponse({ error: 'Configuración de seguridad no disponible.' }, 500);
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: adminKeyData, error: dbError } = await supabaseAdmin
      .from('admin_keys')
      .select('password_hash')
      .eq('key_name', 'primary_admin')
      .single();

    if (dbError || !adminKeyData) {
      console.error('[Admin API] No fue posible consultar la clave administrativa.');
      return jsonResponse({ error: 'Configuración de seguridad no disponible.' }, 500);
    }

    if (!verifyPassword(input.password, adminKeyData.password_hash)) {
      return jsonResponse({ error: 'Acceso no autorizado. Clave incorrecta.' }, 401);
    }

    if (!input.topic || input.topic.length > 200) {
      return jsonResponse({ error: 'El tema debe contener entre 1 y 200 caracteres.' }, 400);
    }

    const generatedData = await aiGeneratorService.generateTutorial(input.topic);

    const slug = generatedData.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    if (!slug) {
      console.error('[Admin API] El título generado no produjo un slug válido.');
      return jsonResponse({ error: 'No fue posible procesar el tutorial generado.' }, 500);
    }

    const tutorialPayload = {
      slug,
      title: generatedData.title,
      description: generatedData.description,
      category: generatedData.category,
      content_markdown: generatedData.content_markdown,
      image: `/images/tutorials/${slug}.png`,
      views: 0
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('tutorials')
      .insert([tutorialPayload])
      .select()
      .single();

    if (insertError) {
      console.error('[Admin API] No fue posible guardar el tutorial.');
      return jsonResponse({ error: 'Error al guardar el tutorial en la base de datos.' }, 500);
    }

    return jsonResponse(
      {
        success: true,
        message: 'Tutorial generado y guardado exitosamente.',
        data: inserted
      },
      200
    );
  } catch {
    console.error('[Admin API] La generación del tutorial falló.');
    return jsonResponse({ error: 'Error interno del servidor.' }, 500);
  }
};
