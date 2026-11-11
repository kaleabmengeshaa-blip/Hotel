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
    <div className="flex items-center">
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
              className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-amber-500/30 bg-stone-950 p-2 shadow-xl"
            >
              <div role="group" aria-label={toggleLabel} className="flex gap-1">
                {([true, false] as const).map((nextEnabled) => {
                  const optionLabel = getAdminCopy(nextEnabled ? "On" : "Off", language);
                  return (
                    <button
                      key={optionLabel}
                      type="button"
                      aria-pressed={enabled === nextEnabled}
                      disabled={toggleDisabled}
                      onClick={() => {
                        if (enabled !== nextEnabled) void onToggle(nextEnabled);
                        if (!nextEnabled) setIsOptionsOpen(false);
                      }}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        enabled === nextEnabled
                          ? "bg-amber-500/15 text-amber-200"
                          : "text-stone-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {optionLabel}
                      {enabled === nextEnabled && (
                        <Check aria-hidden="true" className="h-3.5 w-3.5 text-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>
              {enabled && (
                <label className="mt-2 block border-t border-white/10 pt-2 text-xs text-stone-300">
                  <span className="mb-1.5 block">{label}</span>
                  <select
                    aria-label={label}
                    value={locale}
                    onChange={(event) => {
                      if (isMenuLocale(event.target.value)) onChange(event.target.value);
                    }}
                    className="w-full rounded-lg border border-white/15 bg-stone-900 px-3 py-2 text-xs font-semibold text-stone-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="am-ETB">አማርኛ · ETB</option>
                    <option value="en-USD">English · USD</option>
                    <option value="en-ETB">English · ETB</option>
                  </select>
                </label>
              )}
            </div>
          )}
        </div>
      )}
      {!showToggle && enabled && (
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
