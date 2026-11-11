import { redirect } from 'next/navigation';
import { isAdminAuthenticated, isAdminAuthConfigured } from '@/lib/admin-auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect('/admin');

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0f12] px-4 py-10 text-stone-100">
      <section className="w-full max-w-sm rounded-2xl border border-white/10 bg-stone-950 p-6 shadow-2xl sm:p-8">
        <LoginForm authConfigured={isAdminAuthConfigured()} />
      </section>
    </main>
  );
}