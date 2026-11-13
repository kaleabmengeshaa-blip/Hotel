"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { deleteFeedback, toggleAvailability as saveAvailability } from "../actions";
import { logoutAdmin } from "./login/actions";
import { UNIVERSAL_MENU_INFO } from "../../data/menuData";
import QRGeneratorModal from "../../components/QRGeneratorModal";
import AdminLanguageCurrencySelect from "@/components/AdminLanguageCurrencySelect";
import { useBrowserOrigin } from "@/lib/use-browser-origin";
import { createQrDataUrl, downloadQrDataUrl } from "@/lib/qr-code";
import { requiresMenuItemDescription } from "@/lib/menu-validation";
import { formatMenuPrice, getMenuCopy, translateDietaryTag, translateMenuCategory, translateMenuItem, type MenuCurrency } from "@/lib/menu-i18n";
import { getAdminCopy } from "@/lib/admin-i18n";
import { useAdminLocale } from "@/lib/use-admin-locale";
import { useMenuSwitcherSetting } from "@/lib/use-menu-switcher-setting";
import { Smartphone, Download, Printer, Wand2, CheckCircle2, Copy, Check, Utensils, ExternalLink, ChefHat, CheckCircle, XCircle, ArrowLeft, Search, Plus, MessageSquare, Star, RefreshCw, Trash2, LogOut } from "lucide-react";

type AdminFeedback = { id: string; name: string | null; message: string; rating: number | null; createdAt: string };
type AdminMenuItem = { id: string; name: string; description: string; price: number | string; priceUsd: number | string | null; imageUrl: string | null; prepTimeMins: number; isAvailable: boolean; dietaryTags: string[] };
type AdminMenuCategory = { id: string; hotelId: string; name: string; items: AdminMenuItem[] };
type AdminGuestSelection = { id: string; guestLabel: string; updatedAt: string; items: { itemId: string; name: string; categoryName: string; quantity: number; unitPrice: number; unitPriceUsd: number | null }[] };
type FormItem = { id: string; name: string; description: string; category: string; price: number; priceUsd: number | null; prepTimeMinutes: number };
const drinkCategoryOptions = ["Hot Drinks", "Soft Drinks", "Cold Drinks"];
const emptyItem = { name: "", description: "", category: "", price: "", priceUsd: "", prepTimeMins: "15" };

export default function AdminDashboardClient({ initialFeedback }: { initialFeedback: AdminFeedback[] }) {
  const [feedbackItems, setFeedbackItems] = useState(initialFeedback);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null);
  const { locale, language, setLocale } = useAdminLocale();
  const { enabled: languageSwitcherEnabled, isLoading: isLoadingSwitcher, isSaving: isSavingSwitcher, error: switcherError, setEnabled: setLanguageSwitcherEnabled } = useMenuSwitcherSetting();
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

  useEffect(() => {
    let mounted = true;
    void createQrDataUrl(liveUrl, 260).then((dataUrl) => { if (mounted) { setQr({ url: liveUrl, dataUrl }); setQrError(""); } }).catch((error: unknown) => { console.error("Could not create the menu QR code:", error); if (mounted) setQrError("Could not create the QR code. Please try again."); });
    return () => { mounted = false; };
  }, [liveUrl]);

  useEffect(() => {
    let mounted = true;
    void fetch("/api/menu", { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error("Failed to load menu"); return response.json(); }).then((data: AdminMenuCategory[]) => { if (mounted) setCategories(data); }).catch((error) => console.error("Could not load menu:", error)).finally(() => { if (mounted) setLoadingMenu(false); });
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
    if (!category || !window.confirm(t('Delete category "{category}"?').replace("{category}", category.name) + (category.items.length ? ` ${category.items.length} dishes will also be deleted.` : ""))) return;
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
    setEditingId(item.id); setItemForm({ name: item.name, description: item.description, category: item.category, price: item.price > 0 ? String(item.price) : "", priceUsd: item.priceUsd === null ? "" : String(item.priceUsd), prepTimeMins: String(item.prepTimeMinutes) });
    setPhoto(null); setShowDishForm(true); setFormMessage("");
  };

  const toggleAvailability = async (id: string) => {
    const item = categories.flatMap((category) => category.items).find((entry) => entry.id === id);
    if (!item) return;
    setAvailabilitySavingId(id);
    try { await saveAvailability(id); await refreshMenu(); }
    catch (error) { setFormMessage(error instanceof Error ? t(error.message) : t("Could not update availability.")); }
    finally { setAvailabilitySavingId(null); }
  };

  const clearSelection = async (id: string) => {
    setClearingId(id); setSelectionError("");
    try {
      const response = await fetch("/api/selections", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not clear the guest selection.");
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
  const visibleCategories = categories.filter((category) => selectedCategory === "all" || category.name.toLowerCase() === selectedCategory.toLowerCase()).map((category) => ({
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
            {switcherError && <p role="alert" className="text-xs text-rose-300">{t(switcherError)}</p>}
            <Link href="/?from=admin" className="rounded-xl border border-white/15 px-3 py-2 text-xs">{t("View Guest Menu")}</Link>
            <form action={logoutAdmin}><button className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs"><LogOut className="h-4 w-4" />{t("Sign out")}</button></form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-300"><CheckCircle2 className="mr-1 inline h-4 w-4" />{t("Live Venue QR Code")}</p><h2 className="text-2xl font-bold">{t("Table QR Code Management")}</h2><p className="text-xs text-stone-400">{t("Single universal QR code for all tables, counters, and guest rooms")}</p></div><button onClick={() => setGeneratorOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 font-bold text-stone-950"><Wand2 className="h-4 w-4" />{t("Open Sticker Generator")}</button></div>
          <div className="grid gap-5 lg:grid-cols-2"><div className="flex flex-wrap items-center gap-5 rounded-2xl border border-amber-500/30 bg-stone-950 p-5">{qrDataUrl ? <img src={qrDataUrl} alt={t("Universal Menu QR Code")} className="h-44 w-44 rounded bg-white p-2" /> : <div className="flex h-44 w-44 items-center justify-center bg-white text-xs text-stone-600">{qrError ? t(qrError) : t("Creating QR code...")}</div>}<div className="min-w-0 flex-1 space-y-3"><h3 className="font-bold">{UNIVERSAL_MENU_INFO.venueName}</h3><p className="break-all text-xs text-amber-300">{liveUrl}</p><div className="flex gap-2"><button onClick={() => { void navigator.clipboard.writeText(liveUrl); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }} className="rounded-lg border border-white/20 px-3 py-2 text-xs">{copied ? <Check className="inline h-4 w-4" /> : <Copy className="inline h-4 w-4" />} {copied ? t("Copied") : t("Copy")}</button><button disabled={!qrDataUrl} onClick={() => downloadQrDataUrl(qrDataUrl, "Universal_Table_Menu_QR.png")} className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs text-stone-950 disabled:opacity-50"><Download className="h-4 w-4" />{t("Download QR")}</button><button onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-xs"><Printer className="h-4 w-4" />{t("Print Sticker")}</button></div></div></div>
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-stone-950 p-5 sm:grid-cols-2"><div><Smartphone className="mb-2 h-6 w-6 text-amber-400" /><h3 className="font-bold">{t("Mobile Test Scan")}</h3><a href={liveUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-amber-300">{t("Open Live Menu")}<ExternalLink className="h-3 w-3" /></a></div><div><Utensils className="mb-2 h-6 w-6 text-emerald-400" /><h3 className="font-bold">{t("Active Menu Items")}</h3><p className="text-xs text-stone-400">{loadingMenu ? t("Loading menu...") : `${categories.reduce((sum, category) => sum + category.items.length, 0)} ${language === "am" ? "ምግቦች" : "dishes"} ${language === "am" ? "በ" : "across"} ${categories.length} ${language === "am" ? "ምድቦች" : "categories"}`}</p></div></div>
          </div>
        </section>

        <section className="space-y-4 border-t border-white/10 pt-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">{t("Live guest selections")}</h2><p className="text-xs text-stone-400">{t("Anonymous food selections update here automatically ({count})").replace("{count}", String(selections.length))}</p></div><span className="text-xs text-emerald-300">{t("Refreshes every 5 seconds")}</span></div>{selectionError && <p role="alert" className="text-sm text-rose-300">{t(selectionError)}</p>}{loadingSelections ? <p role="status">{t("Loading guest selections...")}</p> : selections.length === 0 ? <p className="rounded-xl border border-white/10 bg-stone-950 p-5 text-sm text-stone-400">{t("No guest selections yet. New selections will appear here.")}</p> : <div className="grid gap-4 md:grid-cols-2">{selections.map((selection) => { const etb = selection.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0); const usd = selection.items.reduce((sum, item) => sum + item.quantity * (item.unitPriceUsd ?? 0), 0); const hasEtb = selection.items.some((item) => item.unitPrice > 0 || item.unitPriceUsd === null); const hasUsd = selection.items.some((item) => item.unitPriceUsd !== null); return <article key={selection.id} className="rounded-xl border border-white/10 bg-stone-950 p-4"><div className="flex justify-between"><div><h3 className="font-semibold">{selection.guestLabel}</h3><time className="text-xs text-stone-500">{new Date(selection.updatedAt).toLocaleString(language === "am" ? "am-ET" : "en-US")}</time></div><button disabled={clearingId === selection.id} onClick={() => void clearSelection(selection.id)} className="rounded border border-white/20 px-3 py-1 text-xs">{clearingId === selection.id ? t("Clearing...") : t("Clear")}</button></div><ul className="mt-3 space-y-2 border-t border-white/10 pt-3">{selection.items.map((item) => <li key={item.itemId} className="flex justify-between gap-2 text-sm"><span>{item.quantity}× {translateMenuItem(item.name, language)} <small className="text-stone-500">{translateMenuCategory(item.categoryName, language)}</small></span><span>{formatMenuPrice(item.quantity * item.unitPrice, item.unitPriceUsd === null ? null : item.quantity * item.unitPriceUsd, currency, language)}</span></li>)}</ul><p className="mt-3 text-right text-sm font-bold text-amber-300">{t("Total")}: {currency === "ETB" ? hasEtb ? formatMenuPrice(etb, hasUsd ? usd : null, currency, language) : getMenuCopy(language, "etbPriceUnavailable") : hasUsd ? formatMenuPrice(etb, usd, currency, language) : getMenuCopy(language, "usdPriceUnavailable")}</p></article>; })}</div>}</section>

        <section className="space-y-5 border-t border-white/10 pt-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">{t("Kitchen Inventory & Availability")}</h2><p className="text-xs text-stone-400">{t("Toggle dishes in stock or mark items sold out (86) in real-time")}</p></div><div className="flex flex-wrap items-center gap-2"><button onClick={() => { setEditingId(null); setItemForm(emptyItem); setShowDishForm((shown) => !shown); }} className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-stone-950"><Plus className="h-4 w-4" />{t("Add dish")}</button><button onClick={() => setShowCategoryForm((shown) => !shown)} className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-stone-950"><Plus className="h-4 w-4" />{t("Add category")}</button><div className="relative"><Search className="absolute left-2 top-2 h-4 w-4 text-stone-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search dishes...")} className="w-44 rounded-lg border border-white/15 bg-stone-900 py-2 pl-8 pr-2 text-xs" /></div><select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="rounded-lg border border-white/15 bg-stone-900 px-2 py-2 text-xs"><option value="all">{t("All Categories")}</option>{categoryOptions.map((name) => <option key={name} value={name}>{translateMenuCategory(name, language)}</option>)}</select></div></div>
          {showCategoryForm && <form onSubmit={addCategory} className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-stone-950 p-4"><label className="text-xs">{t("Category name")}<input required maxLength={80} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} className="mt-1 block rounded-lg border border-white/15 bg-stone-900 px-3 py-2" /></label><button disabled={savingCategory} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950">{savingCategory ? t("Adding...") : t("Add category")}</button><button type="button" onClick={() => setShowCategoryForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm">{t("Cancel")}</button>{categoryMessage && <p role="status" className={categoryMessage.ok ? "text-emerald-300" : "text-rose-300"}>{categoryMessage.text}</p>}</form>}
          {categories.length > 0 && <div className="rounded-xl border border-white/10 bg-stone-950 p-4"><h3 className="mb-3 text-sm font-bold">{t("Manage categories")}</h3><ul className="flex flex-wrap gap-2">{categories.map((category) => <li key={category.id} className="flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-2 text-xs">{translateMenuCategory(category.name, language)}<button disabled={deletingCategoryId !== null} onClick={() => void deleteCategory(category.id)} className="text-rose-300">{deletingCategoryId === category.id ? t("Deleting...") : t("Delete")}</button></li>)}</ul>{categoryMessage && <p role="status" className="mt-2 text-sm">{categoryMessage.text}</p>}</div>}
          {showDishForm && <form onSubmit={saveDish} className="grid gap-3 rounded-xl border border-white/10 bg-stone-950 p-4 sm:grid-cols-2"><label className="text-xs">{t("Dish name")}<input required value={itemForm.name} onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })} className="mt-1 block w-full rounded-lg bg-stone-900 p-2" /></label><label className="text-xs">{t("Price (ETB)")}<input type="number" min="0" step="0.01" value={itemForm.price} onChange={(event) => setItemForm({ ...itemForm, price: event.target.value })} className="mt-1 block w-full rounded-lg bg-stone-900 p-2" /></label><label className="text-xs">{t("Price (USD)")}<input type="number" min="0" step="0.01" value={itemForm.priceUsd} onChange={(event) => setItemForm({ ...itemForm, priceUsd: event.target.value })} className="mt-1 block w-full rounded-lg bg-stone-900 p-2" /></label><label className="text-xs">{t("Category")}<select required value={itemForm.category} onChange={(event) => setItemForm({ ...itemForm, category: event.target.value })} className="mt-1 block w-full rounded-lg bg-stone-900 p-2"><option value="">{t("Choose a category")}</option>{categoryOptions.map((name) => <option key={name} value={name}>{translateMenuCategory(name, language)}</option>)}</select></label><label className="text-xs">{t("Preparation time (minutes)")}<input type="number" min="0" step="1" value={itemForm.prepTimeMins} onChange={(event) => setItemForm({ ...itemForm, prepTimeMins: event.target.value })} className="mt-1 block w-full rounded-lg bg-stone-900 p-2" /></label><label className="text-xs sm:col-span-2">{t("Description")}<textarea required={requiresMenuItemDescription(itemForm.category)} rows={3} value={itemForm.description} onChange={(event) => setItemForm({ ...itemForm, description: event.target.value })} className="mt-1 block w-full rounded-lg bg-stone-900 p-2" /></label><label className="text-xs sm:col-span-2">{t("Dish photo (optional)")}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} className="mt-1 block w-full" /></label><div className="flex items-center gap-3 sm:col-span-2"><button disabled={savingDish} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950">{savingDish ? t("Saving") : editingId ? t("Update dish") : t("Save dish")}</button><button type="button" onClick={() => { setShowDishForm(false); setEditingId(null); setItemForm(emptyItem); }} className="rounded-lg border border-white/20 px-4 py-2 text-sm">{t("Cancel")}</button>{formMessage && <p role="status" className="text-sm">{formMessage}</p>}</div></form>}
          {!showDishForm && formMessage && <p role="status" className="text-sm text-emerald-300">{formMessage}</p>}
          {loadingMenu ? <p role="status">{t("Loading menu items...")}</p> : visibleCategories.length === 0 ? <p className="text-sm text-stone-400">{t("No menu items found.")}</p> : <div className="space-y-8">{visibleCategories.map((category) => <section key={category.id} className="space-y-3"><h3 className="border-b border-amber-500/30 pb-2 text-xl font-bold">{translateMenuCategory(category.name, language)} <span className="text-sm text-stone-400">({category.items.length})</span></h3>{category.items.length === 0 ? <p className="text-sm text-stone-500">{t("No dishes in this category.")}</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{category.items.map((item) => <article key={item.id} className={`flex flex-col justify-between rounded-2xl border p-4 ${item.isAvailable ? "border-white/10 bg-stone-950" : "border-rose-500/30 bg-rose-950/20"}`}><div><div className="flex justify-between gap-3"><div className="relative h-14 w-14 overflow-hidden rounded-lg bg-stone-900">{item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" /> : <span className="text-xs">{item.name}</span>}</div><div className="text-right text-sm font-bold text-amber-300">{currency === "ETB" && item.price <= 0 && item.priceUsd !== null ? getMenuCopy(language, "etbPriceUnavailable") : formatMenuPrice(item.price, item.priceUsd, currency, language)}<p className="text-xs text-stone-400">{item.prepTimeMinutes} {t("mins prep")}</p></div></div><h4 className="mt-3 font-bold">{item.name}</h4>{item.description && <p className="mt-1 line-clamp-2 text-xs text-stone-400">{item.description}</p>}<div className="mt-2 flex flex-wrap gap-1">{item.dietary.map((tag: string) => <span key={tag} className="rounded bg-stone-900 px-2 py-1 text-[9px]">{translateDietaryTag(tag, language)}</span>)}</div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3"><span className={`inline-flex items-center gap-1 text-xs ${item.isAvailable ? "text-emerald-400" : "text-rose-400"}`}>{item.isAvailable ? <><CheckCircle className="h-4 w-4" />{t("In Stock")}</> : <><XCircle className="h-4 w-4" />{t("86 Sold Out")}</>}</span><div className="flex flex-wrap gap-2"><button onClick={() => editDish(item)} className="rounded-lg border border-white/20 px-2 py-1 text-xs">{t("Edit")}</button><button onClick={() => void deleteDish(item.id)} className="rounded-lg border border-rose-500/40 px-2 py-1 text-xs text-rose-300">{t("Delete")}</button><button disabled={availabilitySavingId === item.id} onClick={() => void toggleAvailability(item.id)} className="rounded-lg border border-white/20 px-2 py-1 text-xs">{availabilitySavingId === item.id ? t("Updating...") : item.isAvailable ? t("Mark Sold Out (86)") : t("Restock Item")}</button></div></div></article>)}</div>}</section>)}</div>}
        </section>

        <section className="space-y-4 border-t border-white/10 pt-8"><div className="flex flex-wrap items-center justify-between"><div><h2 className="text-2xl font-bold">{t("Guest comments")}</h2><p className="text-xs text-stone-400">{t("Guest ratings and feedback ({count})").replace("{count}", String(feedbackItems.length))}</p></div><button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs"><RefreshCw className="h-4 w-4" />{t("Refresh")}</button></div>{feedbackMessage && <p role="status" className="text-sm">{feedbackMessage}</p>}{feedbackItems.length === 0 ? <p className="rounded-xl border border-white/10 bg-stone-950 p-5 text-sm text-stone-400"><MessageSquare className="mr-2 inline h-4 w-4" />{t("No guest feedback yet.")}</p> : <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-stone-950 px-4">{feedbackItems.map((feedback) => <article key={feedback.id} className="flex justify-between gap-4 py-4"><div><div className="flex flex-wrap items-center gap-3"><h3 className="text-sm font-semibold">{feedback.name || t("Guest")}</h3>{feedback.rating !== null && <span className="inline-flex items-center gap-1 text-xs text-amber-300"><Star className="h-3.5 w-3.5" fill="currentColor" />{feedback.rating}/5</span>}<time className="text-xs text-stone-500">{feedback.createdAt.slice(0, 10)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm text-stone-300">{feedback.message}</p></div><button aria-label={t("Delete guest comment")} disabled={deletingFeedbackId === feedback.id} onClick={() => void removeFeedback(feedback.id)} className="h-fit rounded p-2 text-stone-400 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button></article>)}</div>}</section>
      </main>
      <QRGeneratorModal isOpen={generatorOpen} onClose={() => setGeneratorOpen(false)} language={language} />
    </div>
  );
}
