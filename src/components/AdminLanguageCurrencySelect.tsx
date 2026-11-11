"use client";

import { isMenuLocale, type MenuLanguage, type MenuLocale } from "@/lib/menu-i18n";
import { getAdminCopy } from "@/lib/admin-i18n";

type AdminLanguageCurrencySelectProps = {
  locale: MenuLocale;
  language: MenuLanguage;
  enabled: boolean;
  showToggle?: boolean;
  toggleDisabled?: boolean;
  onChange: (locale: MenuLocale) => void;
  onToggle?: (enabled: boolean) => void | Promise<void>;
};

export default function AdminLanguageCurrencySelect({
  locale,
  language,
  enabled,
  showToggle = true,
  toggleDisabled = false,
  onChange,
  onToggle,
}: AdminLanguageCurrencySelectProps) {
  const label = getAdminCopy("Language and currency", language);
  const toggleLabel = getAdminCopy(
    enabled ? "Language options: On" : "Language options: Off",
    language,
  );

  return (
    <div className="flex items-center gap-2">
      {showToggle && onToggle && (
        <button
          type="button"
          aria-label={toggleLabel}
          aria-pressed={enabled}
          aria-expanded={enabled}
          aria-controls="admin-language-currency-options"
          disabled={toggleDisabled}
          onClick={() => void onToggle(!enabled)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-stone-900 px-3 py-2 text-xs font-semibold text-stone-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${enabled ? "bg-emerald-400" : "bg-stone-500"}`}
          />
          {toggleLabel}
        </button>
      )}
      {(!showToggle || enabled) && (
        <label id="admin-language-currency-options" className="flex items-center text-xs text-stone-300">
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
      )}
    </div>
  );
}
