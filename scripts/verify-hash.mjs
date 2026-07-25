import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import WebSocket from 'ws';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { realtime: { transport: WebSocket } }
);

const { data, error } = await supabase.from('admin_keys').select('*');
console.log('DB Error:', error);
console.log('Rows:', JSON.stringify(data, null, 2));

if (data && data.length > 0) {
  const hash = data[0].password_hash;
  console.log('\nHash stored:', hash.substring(0, 40) + '...');

  const [salt, key] = hash.split(':');
  console.log('Salt:', salt);
  console.log('Key hex length:', key?.length);

  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync('admin123', salt, 64);

    console.log('keyBuffer byte length:', keyBuffer.length);
    console.log('derivedKey byte length:', derivedKey.length);

    if (keyBuffer.length === derivedKey.length) {
      console.log('Password match:', crypto.timingSafeEqual(keyBuffer, derivedKey));
    } else {
      console.log('LENGTH MISMATCH - cannot compare');
    }
  } catch (e) {
    console.log('Verification error:', e.message);
  }
} else {
  console.log('NO ROWS FOUND in admin_keys table!');
}

process.exit(0);
