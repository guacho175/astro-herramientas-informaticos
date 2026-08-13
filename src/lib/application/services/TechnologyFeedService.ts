export interface TechnologySource {
  title: string;
  url: string;
  excerpt?: string;
  publishedAt?: string;
}

export interface EmergingTopicCandidate {
  topic: string;
  sources: TechnologySource[];
}

const OFFICIAL_FEEDS = [
  'https://vercel.com/changelog/rss',
  'https://developers.cloudflare.com/changelog/rss/developer-platform.xml',
  'https://github.com/withastro/astro/releases.atom',
  'https://github.com/vercel/ai/releases.atom',
  'https://github.com/supabase/supabase/releases.atom',
];

const RELEVANT_TERMS = [
  'ai', 'agent', 'api', 'astro', 'auth', 'cache', 'cloud', 'database',
  'edge', 'gateway', 'javascript', 'model', 'postgres', 'security',
  'serverless', 'supabase', 'typescript', 'vercel', 'worker', 'workflow',
];

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function readTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

function readLink(block: string): string {
  const atomLink = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1];
  return atomLink || readTag(block, 'link');
}

function parseFeed(xml: string): TechnologySource[] {
  const blocks = xml.match(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi) || [];

  return blocks.flatMap((block) => {
    const title = readTag(block, 'title');
    const url = readLink(block);
    const excerpt = readTag(block, 'description') || readTag(block, 'summary') || readTag(block, 'content');
    const publishedAt = readTag(block, 'pubDate') || readTag(block, 'published') || readTag(block, 'updated');

    if (!title || !url || !/^https:\/\//i.test(url)) return [];

    return [{
      title: title.slice(0, 240),
      url,
      excerpt: excerpt.slice(0, 600) || undefined,
      publishedAt: publishedAt || undefined,
    }];
  });
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function relevance(source: TechnologySource): number {
  const haystack = normalize(`${source.title} ${source.excerpt || ''}`);
  return RELEVANT_TERMS.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

export class TechnologyFeedService {
  constructor(private readonly feeds = OFFICIAL_FEEDS) {}

  private async fetchFeed(url: string): Promise<TechnologySource[]> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'HerramientasTIC-ContentBot/1.0' },
        signal: AbortSignal.timeout(6_000),
      });

      if (!response.ok) return [];
      const xml = (await response.text()).slice(0, 750_000);
      return parseFeed(xml);
    } catch {
      return [];
    }
  }

  async discover(limit = 20): Promise<EmergingTopicCandidate[]> {
    const sources = (await Promise.all(this.feeds.map((feed) => this.fetchFeed(feed)))).flat();
    const cutoff = Date.now() - 45 * 24 * 60 * 60 * 1000;
    const seen = new Set<string>();

    return sources
      .filter((source) => {
        if (!source.publishedAt) return true;
        const timestamp = Date.parse(source.publishedAt);
        return Number.isNaN(timestamp) || timestamp >= cutoff;
      })
      .sort((a, b) => {
        const score = relevance(b) - relevance(a);
        if (score !== 0) return score;
        return Date.parse(b.publishedAt || '') - Date.parse(a.publishedAt || '');
      })
      .flatMap((source) => {
        const key = normalize(source.title);
        if (!key || seen.has(key) || relevance(source) === 0) return [];
        seen.add(key);
        return [{ topic: source.title, sources: [source] }];
      })
      .slice(0, Math.max(1, Math.min(limit, 50)));
  }
}

export const technologyFeedService = new TechnologyFeedService();
