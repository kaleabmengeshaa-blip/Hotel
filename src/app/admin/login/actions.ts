'use server';

import { redirect } from 'next/navigation';
import {
  clearAdminSession,
  createAdminSession,
  isAdminAuthConfigured,
  verifyAdminCredentials,
} from '@/lib/admin-auth';
import { clearLoginFailures, getLoginLockMinutes, recordLoginFailure } from '@/lib/login-rate-limit';

type LoginState = { message: string };

function lockedMessage(minutes: number) {
  return `Too many failed attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}

export async function loginAdmin(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAdminAuthConfigured()) {
    return {
      message: 'Admin login is not configured. Set the required ADMIN variables and restart the server.',
    };
  }

  const username = formData.get('username');
  const password = formData.get('password');
  if (typeof username !== 'string' || typeof password !== 'string') {
    return { message: 'Enter your username and password.' };
  }

  const lockMinutes = await getLoginLockMinutes();
  if (lockMinutes > 0) {
    return { message: lockedMessage(lockMinutes) };
  }

  if (!verifyAdminCredentials(username.trim(), password)) {
    const newLockMinutes = await recordLoginFailure();
    // A short pause makes rapid guessing slower without bothering a real user.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      message: newLockMinutes > 0 ? lockedMessage(newLockMinutes) : 'Invalid username or password.',
    };
  }

  await clearLoginFailures();
  await createAdminSession();
  redirect('/admin');
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect('/admin/login');
}