"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isMenuLocale, type MenuLanguage, type MenuLocale } from "@/lib/menu-i18n";

const ADMIN_LOCALE_STORAGE_KEY = "hotel-admin-menu-locale";
const ADMIN_LANGUAGE_SWITCHER_STORAGE_KEY = "hotel-admin-language-switcher-enabled";
const listeners = new Set<() => void>();
let currentLocale: MenuLocale = "en-ETB";
let hasReadStorage = false;
let languageSwitcherEnabled = false;
let hasReadLanguageSwitcherStorage = false;

function getLocaleSnapshot(): MenuLocale {
  if (typeof window !== "undefined" && !hasReadStorage) {
    const savedLocale = window.localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY);
    if (isMenuLocale(savedLocale)) currentLocale = savedLocale;
    hasReadStorage = true;
  }
  return currentLocale;
}

function getLanguageSwitcherSnapshot(): boolean {
  if (typeof window !== "undefined" && !hasReadLanguageSwitcherStorage) {
    languageSwitcherEnabled =
      window.localStorage.getItem(ADMIN_LANGUAGE_SWITCHER_STORAGE_KEY) === "true";
    hasReadLanguageSwitcherStorage = true;
  }
  return languageSwitcherEnabled;
}

function subscribeToLocale(listener: () => void): () => void {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === ADMIN_LOCALE_STORAGE_KEY) {
      hasReadStorage = false;
      getLocaleSnapshot();
    } else if (event.key === ADMIN_LANGUAGE_SWITCHER_STORAGE_KEY) {
      hasReadLanguageSwitcherStorage = false;
      getLanguageSwitcherSnapshot();
    } else {
      return;
    }
    listeners.forEach((notify) => notify());
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getServerLocaleSnapshot(): MenuLocale {
  return "en-ETB";
}

function getServerLanguageSwitcherSnapshot(): boolean {
  return false;
}

function updateAdminLocale(locale: MenuLocale): void {
  currentLocale = locale;
  hasReadStorage = true;
  window.localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, locale);
  listeners.forEach((listener) => listener());
}

function updateLanguageSwitcherEnabled(enabled: boolean): void {
  languageSwitcherEnabled = enabled;
  hasReadLanguageSwitcherStorage = true;
  window.localStorage.setItem(ADMIN_LANGUAGE_SWITCHER_STORAGE_KEY, String(enabled));
  listeners.forEach((listener) => listener());
}

export function useAdminLocale(): {
  locale: MenuLocale;
  language: MenuLanguage;
  setLocale: (locale: MenuLocale) => void;
  languageSwitcherEnabled: boolean;
  setLanguageSwitcherEnabled: (enabled: boolean) => void;
} {
  const locale = useSyncExternalStore(subscribeToLocale, getLocaleSnapshot, getServerLocaleSnapshot);
  const languageSwitcherEnabled = useSyncExternalStore(
    subscribeToLocale,
    getLanguageSwitcherSnapshot,
    getServerLanguageSwitcherSnapshot,
  );
  const language: MenuLanguage = locale === "am-ETB" ? "am" : "en";

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return {
    locale,
    language,
    setLocale: updateAdminLocale,
    languageSwitcherEnabled,
    setLanguageSwitcherEnabled: updateLanguageSwitcherEnabled,
  };
}
