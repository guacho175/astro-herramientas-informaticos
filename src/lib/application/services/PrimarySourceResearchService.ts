import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import type { TutorialResearchSource } from '../../domain/models/TutorialGeneration';

const ALLOWED_SOURCE_HOSTS = new Set([
  'developers.cloudflare.com',
  'github.com',
  'vercel.com',
]);
const MAX_SOURCE_BYTES = 600_000;
const MAX_EXCERPT_LENGTH = 4_000;
const MAX_REDIRECTS = 2;
const SOURCE_TIMEOUT_MS = 6_000;

function isPrivateIpv4(address: string): boolean {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) return true;
  const [a, b] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) return isPrivateIpv4(address);
  if (isIP(address) !== 6) return true;

  const normalized = address.toLowerCase();
  if (normalized.startsWith('::ffff:')) {
    return isPrivateIpv4(normalized.slice('::ffff:'.length));
  }

  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith('2001:db8:')
  );
}

function parseAllowedUrl(value: string, base?: URL): URL | null {
  let url: URL;
  try {
    url = base ? new URL(value, base) : new URL(value);
  } catch {
    return null;
  }

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    !ALLOWED_SOURCE_HOSTS.has(url.hostname.toLowerCase())
  ) {
    return null;
  }

  url.hash = '';
  return url;
}

async function hasOnlyPublicAddresses(hostname: string): Promise<boolean> {
  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    return addresses.length > 0 && addresses.every(({ address }) => !isPrivateAddress(address));
  } catch {
    return false;
  }
}

function decodeHtml(value: string): string {
  const decodeCodePoint = (value: string, radix: number): string => {
    const codePoint = Number.parseInt(value, radix);
    return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : ' ';
  };

  return value
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => decodeCodePoint(code, 16))
    .replace(/&#(\d+);/g, (_, code) => decodeCodePoint(code, 10));
}

function extractReadableText(document: string): string {
  const primaryContent =
    document.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ||
    document.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
    document;

  return decodeHtml(
    primaryContent
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/?(?:article|section|main|h[1-6]|p|pre|code|li|blockquote|br|tr)\b[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_EXCERPT_LENGTH);
}

async function readLimitedText(response: Response): Promise<string | null> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SOURCE_BYTES) return null;
  if (!response.body) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_SOURCE_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function downloadSource(initialUrl: string): Promise<string | null> {
  let url = parseAllowedUrl(initialUrl);
  if (!url) return null;

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    if (!(await hasOnlyPublicAddresses(url.hostname))) return null;

    let response: Response;
    try {
      response = await fetch(url, {
        redirect: 'manual',
        headers: {
          Accept: 'text/html,application/xhtml+xml,text/markdown,text/plain;q=0.9',
          'User-Agent': 'HerramientasTIC-ResearchBot/1.0',
        },
        signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
      });
    } catch {
      return null;
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      url = location ? parseAllowedUrl(location, url) : null;
      if (!url || redirect === MAX_REDIRECTS) return null;
      continue;
    }

    if (!response.ok) return null;
    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    if (!/^(text\/html|text\/plain|text\/markdown|application\/xhtml\+xml)(?:;|$)/.test(contentType)) {
      return null;
    }

    const document = await readLimitedText(response);
    if (!document) return null;
    try {
      return extractReadableText(document);
    } catch {
      return null;
    }
  }

  return null;
}

export class PrimarySourceResearchService {
  async enrichSources(
    sources: readonly TutorialResearchSource[],
    limit = 2,
  ): Promise<TutorialResearchSource[]> {
    const safeLimit = Math.max(0, Math.min(limit, 2, sources.length));
    const enriched = await Promise.all(
      sources.slice(0, safeLimit).map(async (source) => {
        const researchedExcerpt = await downloadSource(source.url);
        return researchedExcerpt ? { ...source, excerpt: researchedExcerpt } : { ...source };
      }),
    );

    return [...enriched, ...sources.slice(safeLimit).map((source) => ({ ...source }))];
  }
}

export const primarySourceResearchService = new PrimarySourceResearchService();
