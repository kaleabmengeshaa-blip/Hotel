"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
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
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const label = getAdminCopy("Language and currency", language);
  const toggleLabel = getAdminCopy("Language options", language);
  const statusLabel = getAdminCopy(
    enabled ? "Language options: On" : "Language options: Off",
    language,
  );

  return (
    <div className="flex items-center gap-2">
      {showToggle && onToggle && (
        <div className="relative">
          <button
            type="button"
            aria-label={statusLabel}
            aria-haspopup="menu"
            aria-expanded={isOptionsOpen}
            aria-controls="admin-language-options-menu"
            disabled={toggleDisabled}
            onClick={() => setIsOptionsOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-500 px-3 py-2 text-xs font-bold text-stone-950 shadow-sm shadow-amber-500/20 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {toggleLabel}
            <span className="rounded-full bg-stone-950/10 px-1.5 py-0.5 text-[10px]">
              {getAdminCopy(enabled ? "On" : "Off", language)}
            </span>
            <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
          {isOptionsOpen && (
            <div
              id="admin-language-options-menu"
              role="menu"
              aria-label={toggleLabel}
              className="absolute right-0 z-50 mt-2 min-w-32 overflow-hidden rounded-xl border border-amber-500/30 bg-stone-950 p-1 shadow-xl"
            >
              {([true, false] as const).map((nextEnabled) => {
                const optionLabel = getAdminCopy(nextEnabled ? "On" : "Off", language);
                return (
                  <button
                    key={optionLabel}
                    type="button"
                    role="menuitemradio"
                    aria-checked={enabled === nextEnabled}
                    disabled={toggleDisabled}
                    onClick={() => {
                      setIsOptionsOpen(false);
                      if (enabled !== nextEnabled) void onToggle(nextEnabled);
                    }}
                    className="flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-xs font-semibold text-stone-200 transition hover:bg-amber-500/15 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {optionLabel}
                    {enabled === nextEnabled && (
                      <Check aria-hidden="true" className="h-3.5 w-3.5 text-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
