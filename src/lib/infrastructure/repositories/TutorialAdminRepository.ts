import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Tutorial } from '../../domain/models/Tutorial';

/**
 * Repositorio exclusivo de servidor para escrituras administrativas.
 *
 * No se exporta el cliente ni se reutiliza en rutas públicas: el rol de
 * servicio omite RLS y solo debe existir dentro de funciones de servidor.
 */
export class TutorialAdminRepository {
  private client: SupabaseClient | null = null;
  private readonly tableName = 'tutorials';

  private getClient(): SupabaseClient {
    if (this.client) return this.client;

    const url = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!url || !serviceRoleKey) {
      throw new Error('La persistencia administrativa no está configurada.');
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

  async list(): Promise<Pick<Tutorial, 'slug' | 'title' | 'description'>[]> {
    const { data, error } = await this.getClient()
      .from(this.tableName)
      .select('slug,title,description')
      .order('created_at', { ascending: false })
      .limit(1_000);

    if (error) throw new Error('No se pudo consultar el catálogo administrativo.');
    return data || [];
  }

  async findBySlug(slug: string): Promise<Tutorial | null> {
    const { data, error } = await this.getClient()
      .from(this.tableName)
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw new Error('No se pudo comprobar la idempotencia del tutorial.');
    return data;
  }

  async findBySlugPrefix(prefix: string): Promise<Tutorial | null> {
    const escapedPrefix = prefix.replace(/[%_]/g, '\\$&');
    const { data, error } = await this.getClient()
      .from(this.tableName)
      .select('*')
      .like('slug', `${escapedPrefix}%`)
      .limit(1)
      .maybeSingle();

    if (error) throw new Error('No se pudo comprobar la idempotencia del tutorial.');
    return data;
  }

  async claimJob(jobKey: string): Promise<boolean> {
    const { data, error } = await this.getClient().rpc('claim_tutorial_generation_job', {
      p_job_key: jobKey,
    });

    if (error) throw new Error('No se pudo reservar la generación del tutorial.');
    return data === true;
  }

  async completeJob(jobKey: string, tutorialSlug: string): Promise<void> {
    const { error } = await this.getClient()
      .from('tutorial_generation_jobs')
      .update({
        status: 'completed',
        tutorial_slug: tutorialSlug,
        error_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq('job_key', jobKey)
      .eq('status', 'running');

    if (error) throw new Error('No se pudo completar el registro de generación.');
  }

  async failJob(jobKey: string, errorCode: string): Promise<void> {
    const { error } = await this.getClient()
      .from('tutorial_generation_jobs')
      .update({
        status: 'failed',
        error_code: errorCode.slice(0, 100),
        updated_at: new Date().toISOString(),
      })
      .eq('job_key', jobKey)
      .eq('status', 'running');

    if (error) console.error('[TutorialAdminRepository] No se pudo registrar el fallo del job.');
  }

  async create(tutorial: Tutorial): Promise<Tutorial> {
    const { data, error } = await this.getClient()
      .from(this.tableName)
      .insert([tutorial])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('El tutorial ya existe.');
      }
      throw new Error('No se pudo guardar el tutorial.');
    }

    return data;
  }
}

export const tutorialAdminRepository = new TutorialAdminRepository();
