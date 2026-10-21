'use server';

import { redirect } from 'next/navigation';
import {
  clearAdminSession,
  createAdminSession,
  isAdminAuthConfigured,
  verifyAdminCredentials,
} from '@/lib/admin-auth';

type LoginState = { message: string };

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

  if (!verifyAdminCredentials(username.trim(), password)) {
    return { message: 'Invalid username or password.' };
  }

  await createAdminSession();
  redirect('/admin');
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect('/admin/login');
}