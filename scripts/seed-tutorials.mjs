/**
 * Script de migración: Inserta los 10 tutoriales TIC en Supabase.
 * 
 * Lee los archivos .md nuevos de src/content/tutorials/, extrae frontmatter
 * y contenido, y los inserta en la tabla `tutorials` de Supabase.
 * 
 * Uso: node scripts/seed-tutorials.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import WebSocket from 'ws';
import 'dotenv/config';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno: PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  realtime: { transport: WebSocket }
});

// Los 10 archivos nuevos a migrar
const newTutorialFiles = [
  'introduccion-docker-contenedores.md',
  'fundamentos-git-github-2026.md',
  'redes-tcp-ip-fundamentos.md',
  'seguridad-informatica-basica.md',
  'linux-terminal-comandos-esenciales.md',
  'bases-datos-sql-fundamentos.md',
  'html-css-desde-cero-2026.md',
  'python-automatizacion-scripts.md',
  'cloud-computing-conceptos-aws.md',
  'api-rest-conceptos-practica.md',
];

/**
 * Parsea un archivo Markdown con frontmatter YAML delimitado por ---
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error('No se encontró frontmatter válido');
  }

  const frontmatterLines = match[1].split(/\r?\n/);
  const frontmatter = {};

  for (const line of frontmatterLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.substring(0, colonIdx).trim();
    let value = line.substring(colonIdx + 1).trim();

    // Remover comillas
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  }

  return {
    frontmatter,
    content_markdown: match[2].trim(),
  };
}

async function seedTutorials() {
  const tutorialsDir = join(process.cwd(), 'src', 'content', 'tutorials');
  
  console.log('🚀 Iniciando migración de 10 tutoriales TIC a Supabase...\n');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const filename of newTutorialFiles) {
    const filepath = join(tutorialsDir, filename);

    try {
      const rawContent = readFileSync(filepath, 'utf-8');
      const { frontmatter, content_markdown } = parseFrontmatter(rawContent);

      const slug = frontmatter.slug || filename.replace('.md', '');

      // Verificar si ya existe en Supabase
      const { data: existing } = await supabase
        .from('tutorials')
        .select('slug')
        .eq('slug', slug)
        .single();

      if (existing) {
        console.log(`⏭️  [SKIP] "${frontmatter.title}" ya existe en Supabase (slug: ${slug})`);
        skipCount++;
        continue;
      }

      const payload = {
        slug,
        title: frontmatter.title,
        description: frontmatter.description,
        category: frontmatter.category || 'General',
        content_markdown,
        image: frontmatter.image || '/images/tutorials/astro-icon-dark.png',
        views: 0,
      };

      const { data, error } = await supabase
        .from('tutorials')
        .insert([payload])
        .select('slug, title')
        .single();

      if (error) {
        console.error(`❌ [ERROR] "${frontmatter.title}": ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ [OK] "${data.title}" insertado (slug: ${data.slug})`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ [ERROR] Procesando ${filename}: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Resultado: ${successCount} insertados, ${skipCount} omitidos, ${errorCount} errores`);
  console.log('🏁 Migración finalizada.');
}

seedTutorials();
