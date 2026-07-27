import type { APIRoute } from 'astro';
import { tutorialService } from '../lib/application/services/TutorialService';
import { calculators } from '../data/calculators.js';

const SITE_URL = 'https://herramientastic.orbynexdigital.cl';

function formatDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export const GET: APIRoute = async () => {
  // Páginas estáticas
  const staticPages = [
    { url: '/', changefreq: 'weekly', priority: '1.0' },
    { url: '/nosotros', changefreq: 'monthly', priority: '0.6' },
    { url: '/contacto', changefreq: 'monthly', priority: '0.6' },
    { url: '/politicas', changefreq: 'yearly', priority: '0.3' },
    { url: '/blog/apps', changefreq: 'weekly', priority: '0.8' },
    { url: '/blog/calculadoras', changefreq: 'monthly', priority: '0.8' },
    { url: '/blog/guias', changefreq: 'daily', priority: '0.9' },
  ];

  // Tutoriales dinámicos desde Supabase
  let tutorials: any[] = [];
  try {
    tutorials = await tutorialService.getTutorialCatalog();
  } catch {
    tutorials = [];
  }

  // Calculadoras desde archivo estático
  const calculatorPages = (calculators || []).map((calc: any) => ({
    url: `/blog/calculadoras/${calc.slug}`,
    changefreq: 'monthly',
    priority: '0.7',
  }));

  const today = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${staticPages.map(page => `
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
  ${tutorials.map((tut: any) => `
  <url>
    <loc>${SITE_URL}/blog/guias/${tut.slug}</loc>
    <lastmod>${formatDate(tut.updated_at || tut.created_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  ${calculatorPages.map((calc: any) => `
  <url>
    <loc>${SITE_URL}${calc.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${calc.changefreq}</changefreq>
    <priority>${calc.priority}</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(xml.trim(), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
