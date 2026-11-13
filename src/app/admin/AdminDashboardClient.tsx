"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { deleteFeedback, toggleAvailability as saveAvailability } from "../actions";
import { logoutAdmin } from "./login/actions";
import { UNIVERSAL_MENU_INFO } from "../data/menuData";
import QRGeneratorModal from "../components/QRGeneratorModal";
import AdminLanguageCurrencySelect from "@/components/AdminLanguageCurrencySelect";
import { useBrowserOrigin } from "@/lib/use-browser-origin";
import { createQrDataUrl, downloadQrDataUrl } from "@/lib/qr-code";
import { requiresMenuItemDescription } from "@/lib/menu-validation";
import { formatMenuPrice, getMenuCopy, translateDietaryTag, translateMenuCategory, translateMenuItem, type MenuCurrency } from "@/lib/menu-i18n";
import { getAdminCopy } from "@/lib/admin-i18n";
import { useAdminLocale } from "@/lib/use-admin-locale";
import { useMenuSwitcherSetting } from "@/lib/use-menu-switcher-setting";
import { Smartphone, Download, Printer, Wand2, CheckCircle2, Copy, Check, Utensils, ExternalLink, ChefHat, CheckCircle, XCircle, ArrowLeft, Search, Plus, MessageSquare, Star, RefreshCw, Trash2, LogOut, PencilLine, PackageSearch, CircleDollarSign, Sparkles, Filter, Menu, BadgeCheck, Eye, EyeOff } from "lucide-react";

type AdminFeedback = { id: string; name: string | null; message: string; rating: number | null; createdAt: string };
type AdminMenuItem = { id: string; name: string; description: string; price: number | string; priceUsd: number | string | null; imageUrl: string | null; prepTimeMins: number; isAvailable: boolean; dietaryTags: string[] };
type AdminMenuCategory = { id: string; hotelId: string; name: string; items: AdminMenuItem[] };
type AdminGuestSelection = { id: string; guestLabel: string; updatedAt: string; items: { itemId: string; name: string; categoryName: string; quantity: number; unitPrice: number; unitPriceUsd: number | null }[] };
type FormItem = { id: string; name: string; description: string; category: string; price: number; priceUsd: number | null; prepTimeMinutes: number };
const drinkCategoryOptions = ["Hot Drinks", "Soft Drinks", "Cold Drinks"];
const categoryOrder = ["foods", "starters", "hot drinks", "soft drinks", "cold drinks"];
const emptyItem = { name: "", description: "", category: "", price: "", priceUsd: "", prepTimeMins: "15" };

export default function AdminDashboardClient({ initialFeedback }: { initialFeedback: AdminFeedback[] }) {
  const [feedbackItems, setFeedbackItems] = useState(initialFeedback);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null);
  const { locale, language, setLocale } = useAdminLocale();
  const {
    enabled: languageSwitcherEnabled,
    newestFirstEnabled,
    isLoading: isLoadingSwitcher,
    isSaving: isSavingSwitcher,
    error: switcherError,
    setEnabled: setLanguageSwitcherEnabled,
    setNewestFirstEnabled,
  } = useMenuSwitcherSetting();
  const currency: MenuCurrency = locale === "en-USD" ? "USD" : "ETB";
  const t = (text: string) => getAdminCopy(text, language);
  const liveUrl = useBrowserOrigin() || UNIVERSAL_MENU_INFO.qrUrl;
  const [qr, setQr] = useState<{ url: string; dataUrl: string } | null>(null);
  const [qrError, setQrError] = useState("");
  const [copied, setCopied] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [categories, setCategories] = useState<AdminMenuCategory[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [selections, setSelections] = useState<AdminGuestSelection[]>([]);
  const [loadingSelections, setLoadingSelections] = useState(true);
  const [selectionError, setSelectionError] = useState("");
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showDishForm, setShowDishForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [photo, setPhoto] = useState<File | null>(null);
  const [savingDish, setSavingDish] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [availabilitySavingId, setAvailabilitySavingId] = useState<string | null>(null);

  const refreshMenu = async () => {
    const response = await fetch("/api/menu", { cache: "no-store" });
    if (!response.ok) throw new Error(t("Could not refresh the menu."));
    setCategories(await response.json() as AdminMenuCategory[]);
  };
  const categoryOptions = Array.from(new Set([...drinkCategoryOptions, ...categories.map((category) => category.name)])).filter((name) => name.trim().toLowerCase() !== "drinks");
  const orderedCategories = [...categories].sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.name.trim().toLowerCase());
    const bIndex = categoryOrder.indexOf(b.name.trim().toLowerCase());
    return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex);
  });

  useEffect(() => {
    let mounted = true;
    void createQrDataUrl(liveUrl, 260).then((dataUrl) => { if (mounted) { setQr({ url: liveUrl, dataUrl }); setQrError(""); } }).catch((error: unknown) => { console.error("Could not create the menu QR code:", error); if (mounted) setQrError("Could not create the QR code. Please try again."); });
    return () => { mounted = false; };
  }, [liveUrl]);

  useEffect(() => {
    let mounted = true;
    void fetch("/api/menu", { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error("Failed to load menu"); return response.json(); }).then((data: AdminMenuCategory[]) => { if (mounted) setCategories(data); setLoadingMenu(false); }).catch((error: unknown) => { console.error("Could not load the menu:", error); if (mounted) setSelectionError("Could not load the menu."); setLoadingMenu(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    let loading = false;
    const load = async () => {
      if (loading) return;
      loading = true;
      try {
        const response = await fetch("/api/selections", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load guest selections.");
        if (!Array.isArray(result)) throw new Error("The guest selections response is invalid.");
        if (mounted) { setSelections(result as AdminGuestSelection[]); setSelectionError(""); }
      } catch (error) {
        if (mounted) setSelectionError(error instanceof Error ? error.message : "Could not load the guest selections.");
      } finally { loading = false; if (mounted) setLoadingSelections(false); }
    };
    const refreshVisible = () => { if (document.visibilityState === "visible") void load(); };
    void load();
    const timer = window.setInterval(refreshVisible, 5000);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => { mounted = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", refreshVisible); };
  }, []);

  const saveDish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSavingDish(true); setFormMessage("");
    try {
      const data = new FormData();
      if (editingId) data.set("id", editingId);
      data.set("name", itemForm.name); data.set("description", itemForm.description); data.set("category", itemForm.category);
      data.set("price", itemForm.price); data.set("priceUsd", itemForm.priceUsd); data.set("prepTimeMins", String(Number(itemForm.prepTimeMins)));
      if (photo) data.set("photo", photo);
      const response = await fetch("/api/menu", { method: editingId ? "PUT" : "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(t(result.error || "Could not save the dish."));
      setItemForm(emptyItem); setPhoto(null); setEditingId(null); setShowDishForm(false);
      setFormMessage(t(editingId ? '"{name}" was updated.' : '"{name}" was added to the menu.').replace("{name}", result.name));
      await refreshMenu();
    } catch (error) { setFormMessage(error instanceof Error ? t(error.message) : t("Could not save the dish.")); }
    finally { setSavingDish(false); }
  };

  const deleteDish = async (id: string) => {
    const name = categories.flatMap((category) => category.items).find((item) => item.id === id)?.name ?? "this dish";
    if (!window.confirm(t("Delete {item}?").replace("{item}", name))) return;
    try {
      const response = await fetch("/api/menu", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(t(result.error || "Could not delete the dish."));
      await refreshMenu(); setFormMessage(t('"{name}" was deleted.').replace("{name}", name));
    } catch (error) { setFormMessage(error instanceof Error ? t(error.message) : t("Could not delete the dish.")); }
  };

  const addCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSavingCategory(true); setCategoryMessage(null);
    try {
      const response = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: categoryName }) });
      const result = await response.json();
      if (!response.ok) throw new Error(t(result.error || "Could not add the category."));
      setCategories((current) => [...current, result.category as AdminMenuCategory]); setCategoryName(""); setShowCategoryForm(false);
      setCategoryMessage({ ok: true, text: t('Category "{name}" was added.').replace("{name}", result.category.name) });
    } catch (error) { setCategoryMessage({ ok: false, text: error instanceof Error ? t(error.message) : t("Could not add the category.") }); }
    finally { setSavingCategory(false); }
  };

  const deleteCategory = async (id: string) => {
    const category = categories.find((entry) => entry.id === id);
    if (!category) return;
    const confirmText = `${t('Delete category "{category}"?').replace("{category}", category.name)}${category.items.length ? ` ${category.items.length} dishes will also be deleted.` : ""}`;
    if (!window.confirm(confirmText)) return;
    setDeletingCategoryId(id); setCategoryMessage(null);
    try {
      const response = await fetch("/api/menu", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId: id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(t(result.error || "Could not delete the category."));
      setCategories((current) => current.filter((entry) => entry.id !== id));
      if (selectedCategory === category.name) setSelectedCategory("all");
      setCategoryMessage({ ok: true, text: t('Category "{name}" and its dishes were deleted.').replace("{name}", category.name) });
    } catch (error) { setCategoryMessage({ ok: false, text: error instanceof Error ? t(error.message) : t("Could not delete the category.") }); }
    finally { setDeletingCategoryId(null); }
  };

  const editDish = (item: FormItem) => {
    setEditingId(item.id);
    setItemForm({ name: item.name, description: item.description, category: item.category, price: item.price > 0 ? String(item.price) : "", priceUsd: item.priceUsd === null ? "" : String(item.priceUsd), prepTimeMins: item.prepTimeMinutes ? String(item.prepTimeMinutes) : "15" });
    setPhoto(null); setShowDishForm(true); setFormMessage("");
  };

  const toggleAvailability = async (id: string) => {
    if (!categories.some((category) => category.items.some((item) => item.id === id))) return;
    setAvailabilitySavingId(id);
    try { await saveAvailability(id); await refreshMenu(); }
    catch (error) { setFormMessage(error instanceof Error ? t(error.message) : t("Could not update availability.")); }
    finally { setAvailabilitySavingId(null); }
  };

  const clearSelection = async (id: string) => {
    setClearingId(id); setSelectionError("");
    try {
      const response = await fetch("/api/selections", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not clear the guest selection.");
      setSelections((current) => current.filter((selection) => selection.id !== id));
    } catch (error) { setSelectionError(error instanceof Error ? t(error.message) : t("Could not clear the guest selection.")); }
    finally { setClearingId(null); }
  };

  const removeFeedback = async (id: string) => {
    setDeletingFeedbackId(id); setFeedbackMessage("");
    try { const result = await deleteFeedback(id); setFeedbackMessage(t(result.message)); if (result.ok) setFeedbackItems((current) => current.filter((item) => item.id !== id)); }
    catch (error) { console.error("Could not delete guest comment:", error); setFeedbackMessage(t("Could not delete the comment. Please try again.")); }
    finally { setDeletingFeedbackId(null); }
  };

  const search = query.trim().toLowerCase();
  const visibleCategories = orderedCategories.filter((category) => selectedCategory === "all" || category.name.trim().toLowerCase() === selectedCategory).map((category) => ({
    ...category,
    items: category.items.filter((item) => !search || item.name.toLowerCase().includes(search) || item.description.toLowerCase().includes(search)).map((item) => ({
      id: item.id, name: item.name, category: category.name, description: item.description, price: Number(item.price), priceUsd: item.priceUsd === null ? null : Number(item.priceUsd), image: item.imageUrl ?? "", isAvailable: item.isAvailable, prepTimeMinutes: item.prepTimeMins, dietary: item.dietaryTags || [],
    })),
  })).filter((category) => !search || category.items.length > 0);
  const qrDataUrl = qr?.url === liveUrl ? qr.dataUrl : "";

  return (
    <div className="min-h-screen bg-[#0d0f12] pb-20 text-stone-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-stone-950/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><ChefHat className="h-7 w-7 text-amber-400" /><div><h1 className="text-xl font-bold text-white">{t("Hotel Admin Control Center")}</h1><p className="text-xs text-stone-400">{t("QR Code Management & Kitchen Control")}</p></div></div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminLanguageCurrencySelect locale={locale} language={language} enabled={languageSwitcherEnabled} onChange={setLocale} onToggle={setLanguageSwitcherEnabled} toggleDisabled={isLoadingSwitcher || isSavingSwitcher} />
            <button
              type="button"
              aria-label={t(newestFirstEnabled ? "Newest dishes first: On" : "Newest dishes first: Off")}
              onClick={() => void setNewestFirstEnabled(!newestFirstEnabled)}
              disabled={isLoadingSwitcher || isSavingSwitcher}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                newestFirstEnabled
                  ? "border-emerald-400 bg-emerald-500/15 text-emerald-200 shadow-emerald-500/10"
                  : "border-white/15 bg-white/5 text-stone-200 hover:bg-white/10"
              }`}
            >
              <span>{t("Newest dishes first")}</span>
              <span className="rounded-full bg-stone-950/10 px-1.5 py-0.5 text-[10px]">
                {t(newestFirstEnabled ? "On" : "Off")}
              </span>
            </button>
            {switcherError && <p role="alert" className="text-xs text-rose-300">{t(switcherError)}</p>}
            <Link href="/?from=admin" className="rounded-xl border border-white/15 px-3 py-2 text-xs">{t("View Guest Menu")}</Link>
            <form action={logoutAdmin}><button className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs"><LogOut className="h-4 w-4" />{t("Sign out")}</button></form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-300"><CheckCircle2 className="mr-1 inline h-4 w-4" />{t("Live Venue QR Code")}</p><h2 className="text-2xl font-bold">{t("Table QR Code Management")}</h2><p className="text-xs text-stone-400">{t("Single universal QR code for all tables, counters, and guest rooms")}</p></div><button onClick={() => setGeneratorOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 font-bold text-stone-950"><Wand2 className="h-4 w-4" />{t("Open Sticker Generator")}</button></div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-amber-500/30 bg-stone-950 p-5">{qrDataUrl ? <img src={qrDataUrl} alt={t("Universal Menu QR Code")} className="h-44 w-44 rounded-2xl border border-white/10 bg-white p-2 shadow-lg shadow-amber-500/10" /> : <div className="flex h-44 w-44 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-stone-900 text-xs text-stone-400">{t("Creating QR code...")}</div>}<div className="space-y-3"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">{t("Universal Menu QR Code")}</p><h3 className="text-lg font-bold text-white">{t("1 Code For All Tables")}</h3><p className="text-sm text-stone-300">{t("Print and display this QR code on all table tents, room key cards, and bar counters.")}</p>{qrError ? <p className="text-xs text-rose-300">{qrError}</p> : <div className="flex flex-wrap gap-2">{qrDataUrl && <button onClick={() => downloadQrDataUrl(qrDataUrl, "hotel-menu-qr.png")} className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-stone-100"><Download className="h-3.5 w-3.5" />{t("Download QR")}</button>}<button onClick={() => navigator.clipboard.writeText(liveUrl).then(() => setCopied(true)).catch(() => undefined)} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-stone-950"><Copy className="h-3.5 w-3.5" />{copied ? t("Copied:") : t("Copy")}</button></div>}</div></div> </div>
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-stone-950 p-5 sm:grid-cols-2"><div><Smartphone className="mb-2 h-6 w-6 text-amber-400" /><h3 className="font-bold">{t("Live Phone Scan QR Code")}</h3><p className="mt-2 text-sm text-stone-300">{t("Scan with phone camera to open live digital menu on your phone")}</p></div><div className="space-y-3"><div className="rounded-2xl border border-white/10 bg-stone-900 p-3"><p className="text-xs text-stone-400">{t("Live Menu QR Code")}</p><p className="mt-1 text-sm font-semibold text-white">{liveUrl}</p></div><div className="flex gap-2">{qrDataUrl && <button onClick={() => window.open(liveUrl, "_blank")} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-stone-200"><ExternalLink className="h-3.5 w-3.5" />{t("Open Live Menu")}</button>}<button onClick={() => setGeneratorOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-stone-200"><Printer className="h-3.5 w-3.5" />{t("Print Stickers")}</button></div></div></div>
          </div>
        </section>

        <section className="space-y-4 border-t border-white/10 pt-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">{t("Live guest selections")}</h2><p className="text-xs text-stone-400">{t("Anonymous food selections update here automatically ({count})").replace("{count}", String(selections.reduce((sum, selection) => sum + selection.items.reduce((total, item) => total + item.quantity, 0), 0)))}</p></div><button onClick={() => void fetch("/api/selections", { cache: "no-store" }).then(() => undefined)} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-stone-200"><RefreshCw className="h-3.5 w-3.5" />{t("Refresh")}</button></div>
          <div className="rounded-2xl border border-white/10 bg-stone-950 p-4">
            {loadingSelections ? <p className="text-sm text-stone-400">{t("Loading guest selections...")}</p> : selections.length === 0 ? <p className="text-sm text-stone-400">{t("No guest selections yet. New selections will appear here.")}</p> : <div className="space-y-3">{selections.map((selection) => (
              <div key={selection.id} className="rounded-xl border border-white/10 bg-stone-900/60 p-3">
                <div className="flex items-center justify-between gap-2"><p className="font-semibold text-white">{selection.guestLabel}</p><span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">{t("Updated {date}").replace("{date}", new Date(selection.updatedAt).toLocaleString())}</span></div>
                <div className="mt-2 space-y-2">{selection.items.map((item) => <div key={`${selection.id}-${item.itemId}`} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-sm"><span className="text-stone-200">{item.name} × {item.quantity}</span><span className="text-amber-300">{formatMenuPrice(item.unitPrice * item.quantity, item.unitPriceUsd === null ? null : item.unitPriceUsd * item.quantity, currency, language)}</span></div>)}</div>
              </div>
            ))}</div>}
          </div>
        </section>

        <section className="space-y-5 border-t border-white/10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">{t("Kitchen Inventory & Availability")}</h2><p className="text-xs text-stone-400">{t("Toggle dishes in stock or mark items sold out (86) in real-time")}</p></div><button onClick={() => setShowDishForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 font-bold text-stone-950"><Plus className="h-4 w-4" />{t("Add dish")}</button></div>

          {showCategoryForm && <form onSubmit={addCategory} className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-stone-950 p-4"><label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs text-stone-300">{t("Category name")}<input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} className="rounded-xl border border-white/10 bg-stone-900 px-3 py-2 text-sm text-white" required /></label><button type="submit" disabled={savingCategory} className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-950 disabled:opacity-50">{savingCategory ? t("Adding...") : t("Add category")}</button><button type="button" onClick={() => { setShowCategoryForm(false); setCategoryName(""); }} className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-stone-200">{t("Cancel")}</button></form>}

          <div className="rounded-xl border border-white/10 bg-stone-950 p-4">
            <h3 className="mb-3 text-sm font-bold">{t("Manage categories")}</h3>
            {categories.length > 0 && <ul className="flex flex-wrap gap-2">{categories.map((category) => <li key={category.id} className="flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-2 text-xs"><span className="font-semibold text-white">{category.name}</span><button type="button" onClick={() => setSelectedCategory(category.name)} className="rounded-md border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wide text-stone-200">{t("selected")}</button>{category.items.length > 0 && <button type="button" onClick={() => deleteCategory(category.id)} disabled={deletingCategoryId === category.id} className="rounded-md border border-rose-500/30 px-2 py-1 text-[10px] uppercase tracking-wide text-rose-200 disabled:opacity-50">{deletingCategoryId === category.id ? t("Deleting...") : t("Delete")}</button>}</li>)}</ul>}
            {categoryMessage && <p role="status" className="mt-2 text-sm">{categoryMessage.text}</p>}
            <div className="mt-4 border-t border-white/10 pt-4"><p className="mb-2 text-xs text-stone-400">{t("Choose a category to view its dishes")}</p><div className="flex flex-wrap gap-2">{categoryOptions.map((name) => <button key={name} type="button" onClick={() => setSelectedCategory(name === "All Categories" ? "all" : name)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${selectedCategory === name ? "border-amber-500 bg-amber-500/15 text-amber-200" : "border-white/10 bg-stone-900 text-stone-300"}`}>{name}</button>)}</div></div>
          </div>

          {showDishForm && <form onSubmit={saveDish} className="grid gap-3 rounded-xl border border-white/10 bg-stone-950 p-4 sm:grid-cols-2"><label className="text-xs text-stone-300">{t("Dish name")}<input value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2 text-sm text-white" required /></label><label className="text-xs text-stone-300">{t("Category")}<select value={itemForm.category} onChange={(event) => setItemForm((current) => ({ ...current, category: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2 text-sm text-white" required>{categoryOptions.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><label className="text-xs text-stone-300">{t("Price (ETB)")}<input type="number" min="0" step="0.01" value={itemForm.price} onChange={(event) => setItemForm((current) => ({ ...current, price: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2 text-sm text-white" /></label><label className="text-xs text-stone-300">{t("Price (USD)")}<input type="number" min="0" step="0.01" value={itemForm.priceUsd} onChange={(event) => setItemForm((current) => ({ ...current, priceUsd: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2 text-sm text-white" /></label><label className="text-xs text-stone-300">{t("Preparation time (minutes)")}<input type="number" min="0" value={itemForm.prepTimeMins} onChange={(event) => setItemForm((current) => ({ ...current, prepTimeMins: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2 text-sm text-white" /></label><label className="text-xs text-stone-300 sm:col-span-2">{t("Description (required)")}<textarea value={itemForm.description} onChange={(event) => setItemForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 min-h-24 w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2 text-sm text-white" required /></label><div className="sm:col-span-2 flex flex-wrap gap-2"><button type="submit" disabled={savingDish} className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-950 disabled:opacity-50">{savingDish ? t("Saving...") : editingId ? t("Update dish") : t("Save dish")}</button><button type="button" onClick={() => { setShowDishForm(false); setEditingId(null); setItemForm(emptyItem); setPhoto(null); }} className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-stone-200">{t("Cancel")}</button></div></form>}

          {!showDishForm && formMessage && <p role="status" className="text-sm text-emerald-300">{formMessage}</p>}

          {loadingMenu ? <p role="status">{t("Loading menu items...")}</p> : visibleCategories.length === 0 ? <p className="text-sm text-stone-400">{t("No menu items found.")}</p> : <div className="space-y-4">{visibleCategories.map((category) => (<div key={category.id} className="rounded-2xl border border-white/10 bg-stone-950 p-4"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-lg font-bold text-white">{category.name}</h3><span className="text-xs text-stone-400">{category.items.length} {t("items")}</span></div>{category.items.length === 0 ? <p className="text-sm text-stone-400">{t("No dishes in this category.")}</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{category.items.map((item) => (<div key={item.id} className="rounded-xl border border-white/10 bg-stone-900/80 p-3"><div className="mb-3 flex items-center justify-between gap-2"><div><p className="font-semibold text-white">{item.name}</p><p className="text-[11px] text-stone-400">{translateMenuCategory(category.name, language)} · {formatMenuPrice(Number(item.price), item.priceUsd === null ? null : Number(item.priceUsd), currency, language)}</p></div>{item.isAvailable ? <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">{t("In Stock")}</span> : <span className="rounded-full bg-rose-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-300">{t("Sold Out")}</span>}</div><p className="line-clamp-2 text-xs text-stone-300">{item.description}</p><div className="mt-3 flex items-center justify-between"><span className="text-[11px] text-stone-400">{item.prepTimeMinutes} {t("mins prep")}</span><div className="flex gap-2">{item.isAvailable ? <button type="button" onClick={() => toggleAvailability(item.id)} disabled={availabilitySavingId === item.id} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-semibold text-stone-200 disabled:opacity-50">{availabilitySavingId === item.id ? t("Updating...") : t("Mark Sold Out (86)")}</button> : <button type="button" onClick={() => toggleAvailability(item.id)} disabled={availabilitySavingId === item.id} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-semibold text-stone-200 disabled:opacity-50">{availabilitySavingId === item.id ? t("Updating...") : t("Restock Item")}</button>}<button type="button" onClick={() => editDish(item)} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-semibold text-stone-200">{t("Edit")}</button></div></div></div>))}</div>}</div>))}</div>}
        </section>

        <section className="space-y-4 border-t border-white/10 pt-8"><div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold">{t("Guest comments")}</h2><p className="text-xs text-stone-400">{t("Guest ratings and feedback ({count})").replace("{count}", String(feedbackItems.length))}</p></div><button onClick={() => void fetch("/api/feedback", { cache: "no-store" }).then(() => undefined)} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-stone-200"><RefreshCw className="h-3.5 w-3.5" />{t("Refresh")}</button></div>
          <div className="rounded-2xl border border-white/10 bg-stone-950 p-4">
            {feedbackItems.length === 0 ? <p className="text-sm text-stone-400">{t("No guest feedback yet.")}</p> : <div className="space-y-3">{feedbackItems.map((feedback) => <div key={feedback.id} className="rounded-xl border border-white/10 bg-stone-900/60 p-3"><div className="flex items-center justify-between gap-2"><div><p className="font-semibold text-white">{feedback.name || t("Guest")}</p><p className="text-[11px] text-stone-400">{new Date(feedback.createdAt).toLocaleString()}</p></div><button type="button" onClick={() => removeFeedback(feedback.id)} disabled={deletingFeedbackId === feedback.id} className="rounded-lg border border-rose-500/30 px-2 py-1 text-[10px] font-semibold text-rose-200 disabled:opacity-50">{deletingFeedbackId === feedback.id ? t("Deleting...") : t("Delete comment")}</button></div>{feedback.rating !== null && <div className="mt-2 text-xs text-amber-300">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`mr-1 inline h-3.5 w-3.5 ${index < (feedback.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-stone-600"}`} />)} <span className="ml-1 text-stone-400">{feedback.rating}/5</span></div>}<p className="mt-2 text-sm text-stone-200">{feedback.message}</p></div>)}</div> }
          </div>
        </section>
      </main>
      <QRGeneratorModal isOpen={generatorOpen} onClose={() => setGeneratorOpen(false)} language={language} />
    </div>
  );
}
