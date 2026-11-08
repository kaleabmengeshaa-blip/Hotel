import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

// After MAX_FAILURES wrong passwords from one IP within WINDOW_MS, that IP is locked out
// for LOCK_MS. State lives in the database because serverless instances don't share memory.
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;

async function getAttemptKey() {
  const requestHeaders = await headers();
  // Vercel sets x-forwarded-for to the real client IP (first entry).
  const ip =
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    requestHeaders.get('x-real-ip')?.trim() ||
    'unknown';
  // Store a hash rather than the raw IP address.
  return createHash('sha256').update(`admin-login:${ip}`).digest('hex');
}

/** Returns the number of minutes the caller must wait, or 0 if they may try to log in. */
export async function getLoginLockMinutes(): Promise<number> {
  try {
    const attempt = await prisma.adminLoginAttempt.findUnique({
      where: { key: await getAttemptKey() },
      select: { lockedUntil: true },
    });
    const remainingMs = (attempt?.lockedUntil?.getTime() ?? 0) - Date.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 60_000) : 0;
  } catch (error) {
    // Don't block the admin if the limiter itself fails; the password check still applies.
    console.error('Login rate limit check failed:', error);
    return 0;
  }
}

/** Records a failed attempt. Returns minutes locked if this attempt triggered a lockout, else 0. */
export async function recordLoginFailure(): Promise<number> {
  try {
    const key = await getAttemptKey();
    const now = new Date();
    const windowStartCutoff = new Date(now.getTime() - WINDOW_MS);

    const attempt = await prisma.$transaction(async (transaction) => {
      const existing = await transaction.adminLoginAttempt.findUnique({ where: { key } });
      const windowExpired = !existing || existing.windowStart < windowStartCutoff;
      const failures = windowExpired ? 1 : existing.failures + 1;
      const lockedUntil = failures >= MAX_FAILURES ? new Date(now.getTime() + LOCK_MS) : null;

      return transaction.adminLoginAttempt.upsert({
        where: { key },
        create: { key, failures, windowStart: now, lockedUntil },
        update: {
          failures: lockedUntil ? 0 : failures,
          windowStart: windowExpired || lockedUntil ? now : existing.windowStart,
          lockedUntil,
        },
      });
    });

    return attempt.lockedUntil ? Math.ceil(LOCK_MS / 60_000) : 0;
  } catch (error) {
    console.error('Failed to record login failure:', error);
    return 0;
  }
}

/** Clears the caller's failure count after a successful login and prunes stale rows. */
export async function clearLoginFailures() {
  try {
    const key = await getAttemptKey();
    const staleCutoff = new Date(Date.now() - STALE_MS);
    await prisma.adminLoginAttempt.deleteMany({
      // A lockout resets windowStart, so anything older than STALE_MS is no longer locked.
      where: { OR: [{ key }, { windowStart: { lt: staleCutoff } }] },
    });
  } catch (error) {
    console.error('Failed to clear login failures:', error);
  }
}
