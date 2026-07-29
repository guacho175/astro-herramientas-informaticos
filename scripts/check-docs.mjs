#!/usr/bin/env node
/**
 * check-docs.mjs — validación documental del repositorio.
 *
 * Sin dependencias: solo Node y Git.
 *
 *   node scripts/check-docs.mjs                # comprobaciones 1-2-4-5
 *   node scripts/check-docs.mjs --diff         # añade el mapa código→doc sobre cambios sin confirmar
 *   node scripts/check-docs.mjs --diff --skip-docs="razon"   # omite la comprobación 3 con justificación
 *
 * Lo que este script SÍ puede garantizar: que los archivos existan, que los
 * enlaces resuelvan, que los encabezados de estado estén presentes, que no
 * reaparezcan fuentes duplicadas y que no se filtren patrones de credenciales.
 *
 * Lo que NO puede garantizar: que un documento diga la verdad. Que un archivo
 * se haya tocado no significa que se haya actualizado bien. Esa parte depende
 * de la revisión del diff descrita en AGENTS.md.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const args = process.argv.slice(2);
const useDiff = args.includes('--diff');
const skipDocs = args.find((a) => a.startsWith('--skip-docs'));

const errors = [];
const warnings = [];
const fail = (check, msg) => errors.push(`[${check}] ${msg}`);
const warn = (check, msg) => warnings.push(`[${check}] ${msg}`);

/** Documentos canónicos: deben existir y llevar encabezado de estado. */
const CANONICAL = [
  'docs/PROJECT_STATE.md',
  'docs/API.md',
  'docs/CONTENT.md',
];

/** Punteros: no deben contener reglas propias. */
const POINTERS = [
  'CLAUDE.md',
  '.cursorrules',
  '.github/copilot-instructions.md',
];

/** Rutas que no deben reaparecer: fuentes duplicadas o retiradas. */
const FORBIDDEN = [
  'GUIDE_FOR_AGENTS.md',
  'TUTORIAL_GUIDELINES.md',
  'setup-admin.sql',
  'PLAN.md',
  'STATE.md',
  'src/content.config.ts',
  'src/content/content.config.ts',
];

/** Mapa código → documentación. Tocar la izquierda exige tocar alguno de la derecha. */
const IMPACT_MAP = [
  { code: /^supabase\/migrations\//, docs: ['docs/PROJECT_STATE.md', 'docs/API.md'] },
  { code: /^src\/pages\/api\//, docs: ['docs/API.md'] },
  { code: /^astro\.config\.mjs$/, docs: ['docs/PROJECT_STATE.md'] },
  { code: /^package\.json$/, docs: ['docs/PROJECT_STATE.md', 'README.md'] },
  { code: /^src\/lib\/domain\//, docs: ['docs/API.md'] },
  { code: /^src\/components\/TutorialIcon\.astro$/, docs: ['docs/CONTENT.md'] },
];

/** Patrones de credencial que nunca deben aparecer en archivos versionados. */
const SECRET_PATTERNS = [
  { name: 'JWT de Supabase', re: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/ },
  { name: 'clave de API de Google', re: /\bAIza[0-9A-Za-z_-]{30,}/ },
  { name: 'secreto de Supabase', re: /\bsb_secret_[A-Za-z0-9_-]{10,}/ },
  { name: 'asignación de service role key', re: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]?[A-Za-z0-9._-]{20,}/ },
];

const read = (p) => readFileSync(join(ROOT, p), 'utf-8');
const git = (cmd) =>
  execSync(cmd, { cwd: ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

// ---------------------------------------------------------------- 1. Encabezados
for (const doc of CANONICAL) {
  if (!existsSync(join(ROOT, doc))) {
    fail('encabezado', `falta el documento canónico ${doc}`);
    continue;
  }
  const head = read(doc).split('\n').slice(0, 8).join('\n');
  if (!/\*\*Fuente de verdad:\*\*/.test(head)) {
    fail('encabezado', `${doc} no declara "**Fuente de verdad:**" en sus primeras líneas`);
  }
  const m = head.match(/\*\*Última verificación:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  if (!m) {
    fail('encabezado', `${doc} no declara "**Última verificación:** AAAA-MM-DD"`);
  }
}

if (!existsSync(join(ROOT, 'AGENTS.md'))) {
  fail('encabezado', 'falta AGENTS.md en la raíz');
}

// ---------------------------------------------------------------- 2. Enlaces
const collectMarkdown = (dir, acc = []) => {
  for (const entry of readdirSync(join(ROOT, dir))) {
    if (['node_modules', 'dist', '.astro', '.vercel', '.git'].includes(entry)) continue;
    const rel = join(dir, entry);
    if (statSync(join(ROOT, rel)).isDirectory()) collectMarkdown(rel, acc);
    else if (entry.endsWith('.md')) acc.push(rel.split('\\').join('/'));
  }
  return acc;
};

for (const file of collectMarkdown('.')) {
  const content = read(file);
  const links = [...content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
  for (const link of links) {
    if (/^(https?:|mailto:|#)/.test(link)) continue;
    const target = link.split('#')[0];
    if (!target) continue;
    const resolved = resolve(ROOT, dirname(file), target);
    if (!existsSync(resolved)) {
      fail('enlaces', `${file} enlaza a "${link}", que no existe`);
    }
  }
}

// ---------------------------------------------------------------- 3. Mapa código→doc
if (useDiff) {
  if (skipDocs) {
    const reason = skipDocs.includes('=') ? skipDocs.split('=').slice(1).join('=') : '';
    if (!reason.trim()) {
      fail('impacto', '--skip-docs requiere una justificación: --skip-docs="razón"');
    } else {
      warn('impacto', `comprobación omitida. Justificación: ${reason}. Debe constar en el reporte final.`);
    }
  } else {
    // Cambios confirmados en el índice/árbol MÁS archivos nuevos sin añadir:
    // un documento recién creado también cuenta como documentación actualizada.
    const changed = [
      ...git('git diff --name-only HEAD').split('\n'),
      ...git('git ls-files --others --exclude-standard').split('\n'),
    ]
      .map((f) => f.trim())
      .filter(Boolean);
    for (const rule of IMPACT_MAP) {
      const hits = changed.filter((f) => rule.code.test(f));
      if (!hits.length) continue;
      if (!rule.docs.some((d) => changed.includes(d))) {
        fail(
          'impacto',
          `cambios en ${hits.join(', ')} sin tocar ninguno de: ${rule.docs.join(', ')}. ` +
            `Actualiza la documentación o repite con --skip-docs="razón".`
        );
      }
    }
  }
}

// ---------------------------------------------------------------- 4. Duplicación y punteros
for (const path of FORBIDDEN) {
  if (existsSync(join(ROOT, path))) {
    fail('duplicación', `${path} fue retirado y no debe reaparecer. Ver docs/adr/ y AGENTS.md.`);
  }
}

for (const pointer of POINTERS) {
  if (!existsSync(join(ROOT, pointer))) continue;
  const lines = read(pointer).split('\n').filter((l) => l.trim());
  if (lines.length > 3) {
    fail('punteros', `${pointer} tiene ${lines.length} líneas con contenido: los punteros no llevan reglas propias, solo remiten a AGENTS.md`);
  }
  if (!read(pointer).includes('AGENTS.md')) {
    fail('punteros', `${pointer} no remite a AGENTS.md`);
  }
}

// ---------------------------------------------------------------- 5. Secretos
// Rastreados MÁS nuevos sin añadir: un documento recién creado con una
// credencial pegada dentro es exactamente el caso que hay que detectar.
// Los archivos ignorados (.env, .vercel/) quedan fuera por --exclude-standard
// y no deben leerse nunca.
let tracked = [];
try {
  tracked = [
    ...git('git ls-files').split('\n'),
    ...git('git ls-files --others --exclude-standard').split('\n'),
  ].filter(Boolean);
} catch {
  warn('secretos', 'no se pudo listar archivos de Git; comprobación omitida');
}

for (const file of tracked) {
  if (file === 'scripts/check-docs.mjs' || file === 'package-lock.json') continue;
  const full = join(ROOT, file);
  if (!existsSync(full)) continue;
  let content;
  try {
    content = readFileSync(full, 'utf-8');
  } catch {
    continue;
  }
  for (const { name, re } of SECRET_PATTERNS) {
    if (re.test(content)) {
      fail('secretos', `posible ${name} en ${file}. No se versionan credenciales, solo nombres de variables.`);
    }
  }
}

// ---------------------------------------------------------------- Resultado
for (const w of warnings) console.warn(`aviso  ${w}`);

if (errors.length) {
  console.error(`\ncheck-docs: ${errors.length} problema(s)\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error('');
  process.exit(1);
}

console.log('check-docs: sin problemas.');
