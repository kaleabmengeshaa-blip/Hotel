"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isMenuLocale, type MenuLanguage, type MenuLocale } from "@/lib/menu-i18n";

const ADMIN_LOCALE_STORAGE_KEY = "hotel-admin-menu-locale";
const listeners = new Set<() => void>();
let currentLocale: MenuLocale = "en-ETB";
let hasReadStorage = false;

function getLocaleSnapshot(): MenuLocale {
  if (typeof window !== "undefined" && !hasReadStorage) {
    const savedLocale = window.localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY);
    if (isMenuLocale(savedLocale)) currentLocale = savedLocale;
    hasReadStorage = true;
  }
  return currentLocale;
}

function subscribeToLocale(listener: () => void): () => void {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === ADMIN_LOCALE_STORAGE_KEY) {
      hasReadStorage = false;
      getLocaleSnapshot();
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

function updateAdminLocale(locale: MenuLocale): void {
  currentLocale = locale;
  hasReadStorage = true;
  window.localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, locale);
  listeners.forEach((listener) => listener());
}

export function useAdminLocale(): {
  locale: MenuLocale;
  language: MenuLanguage;
  setLocale: (locale: MenuLocale) => void;
} {
  const locale = useSyncExternalStore(subscribeToLocale, getLocaleSnapshot, getServerLocaleSnapshot);
  const language: MenuLanguage = locale === "am-ETB" ? "am" : "en";

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return { locale, language, setLocale: updateAdminLocale };
}
