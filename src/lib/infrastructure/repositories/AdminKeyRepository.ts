import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Acceso de servidor a la clave administrativa. La tabla no tiene políticas
 * públicas y sólo se consulta con service_role desde rutas de servidor.
 */
export class AdminKeyRepository {
  private client: SupabaseClient | null = null;

  private getClient(): SupabaseClient {
    if (this.client) return this.client;

    const url = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!url || !serviceRoleKey) {
      throw new Error('La autenticación administrativa no está configurada.');
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    return this.client;
  }

  async getPrimaryPasswordHash(): Promise<string | null> {
    const { data, error } = await this.getClient()
      .from('admin_keys')
      .select('password_hash')
      .eq('key_name', 'primary_admin')
      .maybeSingle();

    if (error) throw new Error('No se pudo consultar la clave administrativa.');
    return typeof data?.password_hash === 'string' ? data.password_hash : null;
  }
}

export const adminKeyRepository = new AdminKeyRepository();
