"use client";

import { isMenuLocale, type MenuLanguage, type MenuLocale } from "@/lib/menu-i18n";
import { getAdminCopy } from "@/lib/admin-i18n";

type AdminLanguageCurrencySelectProps = {
  locale: MenuLocale;
  language: MenuLanguage;
  onChange: (locale: MenuLocale) => void;
};

export default function AdminLanguageCurrencySelect({
  locale,
  language,
  onChange,
}: AdminLanguageCurrencySelectProps) {
  const label = getAdminCopy("Language and currency", language);

  return (
    <label className="flex items-center gap-2 text-xs text-stone-300">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={locale}
        onChange={(event) => {
          if (isMenuLocale(event.target.value)) onChange(event.target.value);
        }}
        className="max-w-[155px] rounded-xl border border-white/15 bg-stone-900 px-3 py-2 text-xs font-semibold text-stone-100 focus:border-amber-500 focus:outline-none"
      >
        <option value="am-ETB">አማርኛ · ETB</option>
        <option value="en-USD">English · USD</option>
        <option value="en-ETB">English · ETB</option>
      </select>
    </label>
  );
}
