import { aiGeneratorService } from '../../../lib/application/services/AIGeneratorService';
import { tutorialService } from '../../../lib/application/services/TutorialService';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import crypto from 'crypto';
import type { APIRoute } from 'astro';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Función helper para verificar el hash (scrypt)
 */
function verifyPassword(password: string, hash: string): boolean {
  try {
    const [salt, key] = hash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (error) {
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { topic, password } = body;
    
    if (!password) {
      return new Response(JSON.stringify({ error: 'Falta la contraseña.' }), { status: 401 });
    }

    // 1. Obtener el hash de la base de datos (clave 'primary_admin')
    const { data: adminKeyData, error: dbError } = await supabaseAdmin
      .from('admin_keys')
      .select('password_hash')
      .eq('key_name', 'primary_admin')
      .single();

    if (dbError || !adminKeyData) {
      console.error('[Admin API] Error obteniendo clave de la BD:', dbError?.message);
      return new Response(JSON.stringify({ error: 'Configuración de seguridad no inicializada en Supabase.' }), { status: 500 });
    }

    // 2. Verificar el hash criptográfico
    const isValid = verifyPassword(password, adminKeyData.password_hash);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Acceso no autorizado. Clave incorrecta.' }), { status: 401 });
    }

    if (!topic) {
      return new Response(JSON.stringify({ error: 'El tema es obligatorio.' }), { status: 400 });
    }

    // 1. Generar contenido con IA (Cascade Fallback)
    console.log(`[Admin API] Iniciando generación para el tema: ${topic}`);
    const generatedData = await aiGeneratorService.generateTutorial(topic);

    // Generar un slug simple basado en el título
    const slug = generatedData.title
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // 2. Insertar en Supabase
    const tutorialPayload = {
      slug,
      title: generatedData.title,
      description: generatedData.description,
      category: generatedData.category,
      content_markdown: generatedData.content_markdown,
      image: `/images/tutorials/${slug}.png`, // Placeholder image
      views: 0
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('tutorials')
      .insert([tutorialPayload])
      .select()
      .single();

    if (insertError) {
      console.error('[Admin API] Error insertando tutorial:', insertError);
      return new Response(JSON.stringify({ error: 'Error al guardar el tutorial en la base de datos.' }), { status: 500 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Tutorial generado y guardado exitosamente.',
      data: inserted
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('[Admin API] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor', 
      details: error.message 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
