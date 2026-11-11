'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ChefHat, Eye, EyeOff, KeyRound, UserRound } from 'lucide-react';
import { loginAdmin } from './actions';
import { getAdminCopy } from '@/lib/admin-i18n';
import { useAdminLocale } from '@/lib/use-admin-locale';
import AdminLanguageCurrencySelect from '@/components/AdminLanguageCurrencySelect';

const initialState = { message: '' };

export default function LoginForm({ authConfigured }: { authConfigured: boolean }) {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const {
    locale,
    language,
    setLocale,
    languageSwitcherEnabled,
    setLanguageSwitcherEnabled,
  } = useAdminLocale();
  const t = (text: string) => getAdminCopy(text, language);
  const lockMatch = state.message.match(/^Too many failed attempts\. Please try again in (\d+) minutes?\.?$/);
  const loginMessage = lockMatch
    ? t("Too many failed attempts. Please try again in {minutes} minutes.").replace("{minutes}", lockMatch[1])
    : t(state.message);

  return (
    <>
      <div className="mb-7">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
            <ChefHat className="h-5 w-5" />
          </div>
          <AdminLanguageCurrencySelect
            locale={locale}
            language={language}
            enabled={languageSwitcherEnabled}
            onChange={setLocale}
            onToggle={setLanguageSwitcherEnabled}
          />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-400">{t('Manager Portal')}</p>
        <h1 className="mt-1 text-2xl font-bold text-white">{t('Admin sign in')}</h1>
        <p className="mt-2 text-sm text-stone-400">{t('Sign in to manage the restaurant menu.')}</p>
      </div>

      {!authConfigured && (
        <p className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {t('Add ADMIN_USERNAME, ADMIN_PASSWORD, and a 32-character ADMIN_SESSION_SECRET to your local environment, then restart the server.')}
        </p>
      )}

      <form action={formAction} className="space-y-4">
        <label className="block text-sm font-medium text-stone-300">
          {t('Username')}
          <span className="relative mt-1 block">
            <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              required
              autoComplete="username"
              name="username"
              className="w-full rounded-lg border border-white/15 bg-stone-900 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-amber-500"
            />
          </span>
        </label>

        <label className="block text-sm font-medium text-stone-300">
          {t('Password')}
          <span className="relative mt-1 block">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              required
              autoComplete="current-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="w-full rounded-lg border border-white/15 bg-stone-900 py-2.5 pl-10 pr-10 text-sm text-white outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={t(showPassword ? 'Hide password' : 'Show password')}
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 transition hover:text-stone-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>

        {state.message && (
          <p role="status" className="text-sm text-rose-300">
            {loginMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !authConfigured}
          className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? t('Signing in...') : t('Sign in')}
        </button>
      </form>

      <Link href="/" className="mt-6 inline-block text-sm text-stone-400 hover:text-white">
        {t('Return to guest menu')}
      </Link>
    </>
  );
}