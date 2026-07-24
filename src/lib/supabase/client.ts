import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// Valores por defecto para prevenir errores en tiempo de compilación si faltan variables
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ No se encontraron las credenciales de Supabase. Asegúrate de configurar el archivo .env');
}

// Exportamos una instancia Singleton del cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  realtime: {
    transport: WebSocket
  }
});
