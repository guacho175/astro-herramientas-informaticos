import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan credenciales de Supabase en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TUTORIALS_DIR = path.join(process.cwd(), 'src', 'content', 'tutorials');

async function migrate() {
  console.log('Iniciando migración de tutoriales a Supabase...');
  try {
    const files = await fs.readdir(TUTORIALS_DIR);
    const markdownFiles = files.filter(f => f.endsWith('.md'));

    for (const file of markdownFiles) {
      const content = await fs.readFile(path.join(TUTORIALS_DIR, file), 'utf-8');
      
      // Extraer Frontmatter básico (regex rudimentario para evitar dependencias extra)
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      let title = file.replace('.md', '');
      let slug = title;
      let category = 'Guías';
      let image = '';
      
      if (frontmatterMatch) {
        const fm = frontmatterMatch[1];
        const titleMatch = fm.match(/title:\s*['"]?([^'"\n]+)['"]?/);
        const slugMatch = fm.match(/slug:\s*['"]?([^'"\n]+)['"]?/);
        const catMatch = fm.match(/category:\s*['"]?([^'"\n]+)['"]?/);
        const imgMatch = fm.match(/image:\s*['"]?([^'"\n]+)['"]?/);
        
        if (titleMatch) title = titleMatch[1].trim();
        if (slugMatch) slug = slugMatch[1].trim();
        if (catMatch) category = catMatch[1].trim();
        if (imgMatch) image = imgMatch[1].trim();
      }

      // Eliminar el frontmatter del contenido para guardarlo limpio en BD
      const body = content.replace(/^---\n[\s\S]*?\n---/, '').trim();

      const { error } = await supabase.from('tutorials').upsert({
        slug,
        title,
        description: body.substring(0, 150) + '...',
        content_markdown: body,
        category,
        image: image || 'https://cdn-icons-png.flaticon.com/512/732/732212.png',
      }, { onConflict: 'slug' });

      if (error) {
        console.error(`❌ Error insertando ${slug}:`, error.message);
      } else {
        console.log(`✅ Migrado exitosamente: ${slug}`);
      }
    }
    
    console.log('🎉 Migración completada. Ya puedes borrar la carpeta src/content/tutorials si lo deseas.');
  } catch (error) {
    console.error('Error durante la migración:', error);
  }
}

migrate();
