import crypto from 'node:crypto';
import { adminKeyRepository, type AdminKeyRepository } from '../../infrastructure/repositories/AdminKeyRepository';

export const ADMIN_SESSION_COOKIE = 'admin_session';
export const ADMIN_SESSION_TTL_SECONDS = 60 * 30;

interface AdminSessionPayload {
  version: 1;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

function getSessionSecret(): string {
  return (import.meta.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || '').trim();
}

function isProduction(): boolean {
  return import.meta.env.PROD || process.env.NODE_ENV === 'production';
}

function toBase64Url(value: Buffer | string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64Url(value: string): Buffer | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;

  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='), 'base64');
  } catch {
    return null;
  }
}

function sign(payload: string, secret: string): string {
  return toBase64Url(crypto.createHmac('sha256', secret).update(payload).digest());
}

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  for (const value of cookieHeader.split(';')) {
    const separator = value.indexOf('=');
    if (separator < 1) continue;
    if (value.slice(0, separator).trim() === name) return value.slice(separator + 1).trim();
  }

  return null;
}

function verifyPassword(password: string, storedHash: string | null): boolean {
  if (!storedHash) return false;

  try {
    const [salt, key, ...extraParts] = storedHash.split(':');
    if (!salt || !key || extraParts.length > 0 || !/^[a-f\d]{128}$/i.test(key)) return false;

    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, keyBuffer.length);
    return keyBuffer.length === derivedKey.length && crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

function isSessionPayload(value: unknown): value is AdminSessionPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return payload.version === 1
    && typeof payload.issuedAt === 'number'
    && Number.isSafeInteger(payload.issuedAt)
    && typeof payload.expiresAt === 'number'
    && Number.isSafeInteger(payload.expiresAt)
    && typeof payload.nonce === 'string'
    && /^[a-f\d]{32}$/i.test(payload.nonce);
}

function cookieAttributes(maxAge: number, expires: Date): string {
  return [
    'Path=/',
    `Max-Age=${maxAge}`,
    `Expires=${expires.toUTCString()}`,
    'HttpOnly',
    'SameSite=Strict',
    ...(isProduction() ? ['Secure'] : []),
  ].join('; ');
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export class AdminAuthService {
  constructor(private readonly adminKeys: AdminKeyRepository = adminKeyRepository) {}

  async authenticate(password: unknown): Promise<boolean> {
    if (typeof password !== 'string' || password.length === 0 || password.length > 1_024) {
      return false;
    }

    return verifyPassword(password, await this.adminKeys.getPrimaryPasswordHash());
  }

  createSessionCookie(now = Date.now()): string {
    const secret = getSessionSecret();
    if (secret.length < 32) {
      throw new Error('La sesión administrativa no está configurada.');
    }

    const payload: AdminSessionPayload = {
      version: 1,
      issuedAt: now,
      expiresAt: now + ADMIN_SESSION_TTL_SECONDS * 1_000,
      nonce: crypto.randomBytes(16).toString('hex'),
    };
    const encodedPayload = toBase64Url(JSON.stringify(payload));
    const signature = sign(encodedPayload, secret);
    const expires = new Date(payload.expiresAt);

    return `${ADMIN_SESSION_COOKIE}=${encodedPayload}.${signature}; ${cookieAttributes(ADMIN_SESSION_TTL_SECONDS, expires)}`;
  }

  clearSessionCookie(): string {
    return `${ADMIN_SESSION_COOKIE}=; ${cookieAttributes(0, new Date(0))}`;
  }

  getSession(request: Request, now = Date.now()): AdminSessionPayload | null {
    const secret = getSessionSecret();
    if (secret.length < 32) return null;

    const token = readCookie(request, ADMIN_SESSION_COOKIE);
    if (!token || token.length > 1_024) return null;
    const [encodedPayload, signature, ...extraParts] = token.split('.');
    if (!encodedPayload || !signature || extraParts.length > 0) return null;

    const expectedSignature = sign(encodedPayload, secret);
    const givenSignature = fromBase64Url(signature);
    const expectedSignatureBuffer = fromBase64Url(expectedSignature);
    if (!givenSignature || !expectedSignatureBuffer || givenSignature.length !== expectedSignatureBuffer.length) return null;
    if (!crypto.timingSafeEqual(givenSignature, expectedSignatureBuffer)) return null;

    const payloadBuffer = fromBase64Url(encodedPayload);
    if (!payloadBuffer) return null;

    try {
      const payload = JSON.parse(payloadBuffer.toString('utf8')) as unknown;
      if (!isSessionPayload(payload)) return null;
      if (payload.expiresAt <= now || payload.issuedAt > now || payload.expiresAt - payload.issuedAt > ADMIN_SESSION_TTL_SECONDS * 1_000) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }
}

export const adminAuthService = new AdminAuthService();
