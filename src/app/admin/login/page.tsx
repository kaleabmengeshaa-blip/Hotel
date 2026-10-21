import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChefHat } from 'lucide-react';
import { isAdminAuthenticated, isAdminAuthConfigured } from '@/lib/admin-auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect('/admin');

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0f12] px-4 py-10 text-stone-100">
      <section className="w-full max-w-sm rounded-2xl border border-white/10 bg-stone-950 p-6 shadow-2xl sm:p-8">
        <div className="mb-7">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
            <ChefHat className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Manager Portal</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Admin sign in</h1>
          <p className="mt-2 text-sm text-stone-400">Sign in to manage the restaurant menu.</p>
        </div>

        <LoginForm authConfigured={isAdminAuthConfigured()} />

        <Link href="/" className="mt-6 inline-block text-sm text-stone-400 hover:text-white">
          Return to guest menu
        </Link>
      </section>
    </main>
  );
}