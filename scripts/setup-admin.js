import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan credenciales de Supabase en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: { fetch: fetch },
  realtime: { transport: WebSocket }
});

const password = process.argv[2];

if (!password) {
  console.error('❌ Debes proporcionar una contraseña como argumento.');
  console.log('Ejemplo: node scripts/setup-admin.js "MiClaveSuperSegura123!"');
  process.exit(1);
}

// 1. Generar Hash Robusto (scrypt)
const salt = crypto.randomBytes(16).toString('hex');
const hashBuffer = crypto.scryptSync(password, salt, 64);
const passwordHash = `${salt}:${hashBuffer.toString('hex')}`;

async function setup() {
  console.log('Generando hash de contraseña...');
  
  // 2. Guardar en Supabase
  const { data, error } = await supabase
    .from('admin_keys')
    .upsert(
      { key_name: 'primary_admin', password_hash: passwordHash },
      { onConflict: 'key_name' }
    );

  if (error) {
    console.error('❌ Error al guardar la clave en Supabase:', error.message);
    console.log('💡 Tip: ¿Ya ejecutaste el código de setup-admin.sql en el SQL Editor de Supabase?');
  } else {
    console.log('✅ Clave de administrador configurada y encriptada exitosamente en Supabase.');
  }
}

setup();
