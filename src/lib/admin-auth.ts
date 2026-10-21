import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'hotel-admin-session';

const SESSION_TTL_SECONDS = 8 * 60 * 60;

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

function safeStringEqual(left: string, right: string) {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function sign(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function isAdminAuthConfigured() {
  return Boolean(
    process.env.ADMIN_USERNAME &&
      process.env.ADMIN_PASSWORD &&
      getSessionSecret()
  );
}

export function verifyAdminCredentials(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUsername || !expectedPassword || !getSessionSecret()) return false;

  const usernameMatches = safeStringEqual(username, expectedUsername);
  const passwordMatches = safeStringEqual(password, expectedPassword);
  return usernameMatches && passwordMatches;
}

export async function createAdminSession() {
  const secret = getSessionSecret();
  if (!secret) throw new Error('ADMIN_SESSION_SECRET must contain at least 32 characters.');

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `${issuedAt}.${issuedAt + SESSION_TTL_SECONDS}`;
  const token = `${payload}.${sign(payload, secret)}`;
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function isAdminAuthenticated() {
  const secret = getSessionSecret();
  if (!secret) return false;

  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;

  const [issuedAtText, expiresAtText, signature, extra] = token.split('.');
  if (!issuedAtText || !expiresAtText || !signature || extra !== undefined) return false;

  const payload = `${issuedAtText}.${expiresAtText}`;
  const expectedSignature = sign(payload, secret);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return false;
  }

  const issuedAt = Number(issuedAtText);
  const expiresAt = Number(expiresAtText);
  const now = Math.floor(Date.now() / 1000);

  return (
    Number.isInteger(issuedAt) &&
    Number.isInteger(expiresAt) &&
    issuedAt <= now &&
    expiresAt > now &&
    expiresAt - issuedAt <= SESSION_TTL_SECONDS
  );
}