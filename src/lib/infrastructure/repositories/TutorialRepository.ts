import { supabase } from '../../supabase/client';
import type { Tutorial } from '../../domain/models/Tutorial';

/**
 * Responsabilidad: Única y exclusiva comunicación con la tabla `tutorials` de Supabase.
 * No debe contener lógica de negocio, solo operaciones CRUD y queries.
 */
export class TutorialRepository {
  private tableName = 'tutorials';

  async getAll(): Promise<Tutorial[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tutorials from Supabase:', error);
      throw new Error('No se pudieron obtener los tutoriales');
    }

    return data || [];
  }

  async getPaginated(page: number, pageSize: number): Promise<{ data: Tutorial[], count: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching paginated tutorials:', error);
      return { data: [], count: 0 };
    }

    return { data: data || [], count: count || 0 };
  }

  async getBySlug(slug: string): Promise<Tutorial | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Row not found
      console.error(`Error fetching tutorial ${slug}:`, error);
      throw new Error(`Error obteniendo la guía: ${slug}`);
    }

    return data;
  }

  async create(tutorial: Tutorial): Promise<Tutorial> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([tutorial])
      .select()
      .single();

    if (error) {
      console.error('Error creating tutorial:', error);
      throw new Error('Error al crear el tutorial en BD');
    }

    return data;
  }

  async incrementViews(slug: string): Promise<void> {
    const { error } = await supabase.rpc('increment_tutorial_views', { tutorial_slug: slug });
    if (error) {
      console.error('Error incrementing views:', error);
    }
  }
}
