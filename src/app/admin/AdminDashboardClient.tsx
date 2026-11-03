"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { deleteFeedback, toggleAvailability as saveAvailability } from "../actions";
import { logoutAdmin } from "./login/actions";
import { UNIVERSAL_MENU_INFO } from "../../data/menuData";
import QRGeneratorModal from "../../components/QRGeneratorModal";
import { useBrowserOrigin } from "@/lib/use-browser-origin";
import { createQrDataUrl, downloadQrDataUrl } from "@/lib/qr-code";
import { requiresMenuItemDescription } from "@/lib/menu-validation";

import {
  Smartphone,
  Download,
  Printer,
  Wand2,
  CheckCircle2,
  Copy,
  Check,
  Utensils,
  ExternalLink,
  ChefHat,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowLeft,
  Search,
  Plus,
  MessageSquare,
  RefreshCw,
  Trash2,
  LogOut,
} from "lucide-react";

type AdminFeedback = {
  id: string;
  name: string | null;
  message: string;
  createdAt: string;
};

type AdminMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  priceUsd: number | string | null;
  imageUrl: string | null;
  prepTimeMins: number;
  isAvailable: boolean;
  dietaryTags: string[];
};

type AdminMenuCategory = {
  id: string;
  hotelId: string;
  name: string;
  items: AdminMenuItem[];
};

const drinkCategoryOptions = ["Hot Drinks", "Soft Drinks", "Cold Drinks"];

type AdminGuestSelection = {
  id: string;
  guestLabel: string;
  updatedAt: string;
  items: {
    itemId: string;
    name: string;
    categoryName: string;
    quantity: number;
    unitPrice: number;
    unitPriceUsd: number | null;
  }[];
};

export default function AdminDashboardClient({
  initialFeedback,
}: {
  initialFeedback: AdminFeedback[];
}) {
  const [feedbackItems, setFeedbackItems] = useState(initialFeedback);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null);
  const hotelName = UNIVERSAL_MENU_INFO.venueName;
  const currentOrigin = useBrowserOrigin();
  const liveUrl = currentOrigin || UNIVERSAL_MENU_INFO.qrUrl;
  const [copied, setCopied] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [qrData, setQrData] = useState<{ url: string; dataUrl: string } | null>(null);
  const [qrError, setQrError] = useState<{ url: string; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    priceUsd: "",
    prepTimeMins: "15",
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [dbCategories, setDbCategories] = useState<AdminMenuCategory[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryMessage, setCategoryMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [availabilitySavingId, setAvailabilitySavingId] = useState<string | null>(null);
  const [guestSelections, setGuestSelections] = useState<AdminGuestSelection[]>([]);
  const [isLoadingSelections, setIsLoadingSelections] = useState(true);
  const [selectionError, setSelectionError] = useState("");
  const [clearingSelectionId, setClearingSelectionId] = useState<string | null>(null);
  const qrDataUrl = qrData?.url === liveUrl ? qrData.dataUrl : "";
  const qrErrorMessage = qrError?.url === liveUrl ? qrError.message : "";
  const menuCategoryOptions = Array.from(
    new Set([...drinkCategoryOptions, ...dbCategories.map((category) => category.name)])
  ).filter((categoryName) => categoryName.trim().toLowerCase() !== "drinks");

useEffect(() => {
  let isMounted = true;
  void createQrDataUrl(liveUrl, 260)
    .then((dataUrl) => {
      if (isMounted) setQrData({ url: liveUrl, dataUrl });
    })
    .catch((error: unknown) => {
      console.error("Could not create the menu QR code:", error);
      if (isMounted) {
        setQrError({ url: liveUrl, message: "Could not create the QR code. Please try again." });
      }
    });

  return () => {
    isMounted = false;
  };
}, [liveUrl]);

useEffect(() => {
  fetch("/api/menu")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load menu");
      return res.json();
    })
    .then((data: AdminMenuCategory[]) => {
      setDbCategories(data);
    })
    .catch((error) => {
      console.error("Could not load menu:", error);
    })
    .finally(() => {
      setIsLoadingMenu(false);
    });
}, []);

useEffect(() => {
  let isMounted = true;
  let isLoading = false;

  const loadSelections = async () => {
    if (isLoading) return;
    isLoading = true;
    try {
      const response = await fetch("/api/selections", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not load guest selections.");
      }
      if (!Array.isArray(result)) {
        throw new Error("The guest selections response is invalid.");
      }
      if (isMounted) {
        setGuestSelections(result as AdminGuestSelection[]);
        setSelectionError("");
      }
    } catch (error) {
      console.error("Could not load guest selections:", error);
      if (isMounted) {
        setSelectionError(error instanceof Error ? error.message : "Could not load guest selections.");
      }
    } finally {
      isLoading = false;
      if (isMounted) setIsLoadingSelections(false);
    }
  };

  // Poll only while the dashboard is on screen, so a forgotten background tab doesn't
  // keep the database awake all day; catch up immediately when staff come back.
  const refreshIfVisible = () => {
    if (document.visibilityState === "visible") void loadSelections();
  };

  void loadSelections();
  const refreshTimer = window.setInterval(refreshIfVisible, 5000);
  document.addEventListener("visibilitychange", refreshIfVisible);
  return () => {
    isMounted = false;
    window.clearInterval(refreshTimer);
    document.removeEventListener("visibilitychange", refreshIfVisible);
  };
}, []);

  const handleSaveDish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFormMessage("");

    try {
      const formData = new FormData();
      if (editingItemId) formData.set("id", editingItemId);
      formData.set("name", newItem.name);
      formData.set("description", newItem.description);
      formData.set("category", newItem.category);
      formData.set("price", newItem.price);
      formData.set("priceUsd", newItem.priceUsd);
      formData.set("prepTimeMins", String(Number(newItem.prepTimeMins)));
      if (selectedPhoto) {
        formData.set("photo", selectedPhoto);
      }

      const response = await fetch("/api/menu", {
        method: editingItemId ? "PUT" : "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save the dish.");
      }

      setNewItem({ name: "", description: "", category: "", price: "", priceUsd: "", prepTimeMins: "15" });
      setSelectedPhoto(null);
      setEditingItemId(null);
      setShowAddForm(false);
      setFormMessage(editingItemId ? `"${result.name}" was updated.` : `"${result.name}" was added to the menu.`);

      const menuResponse = await fetch("/api/menu");
      if (menuResponse.ok) setDbCategories(await menuResponse.json());
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Could not save the dish.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDish = async (itemId: string) => {
    const itemName = dbCategories.flatMap((category) => category.items).find((item) => item.id === itemId)?.name ?? "this dish";

    if (!window.confirm(`Delete ${itemName}?`)) {
      return;
    }

    try {
      const response = await fetch("/api/menu", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete the dish.");
      }

      const menuResponse = await fetch("/api/menu");
      if (menuResponse.ok) {
        setDbCategories(await menuResponse.json());
      }
      setFormMessage(`"${itemName}" was deleted.`);
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Could not delete the dish.");
    }
  };

  const handleAddCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingCategory(true);
    setCategoryMessage(null);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not add the category.");
      }

      setDbCategories((categories) => [...categories, result.category as AdminMenuCategory]);
      setNewCategoryName("");
      setShowAddCategoryForm(false);
      setCategoryMessage({ ok: true, text: `Category "${result.category.name}" was added.` });
    } catch (error) {
      setCategoryMessage({
        ok: false,
        text: error instanceof Error ? error.message : "Could not add the category.",
      });
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const category = dbCategories.find((item) => item.id === categoryId);
    if (!category) return;

    const dishWarning =
      category.items.length > 0
        ? ` This will also permanently delete ${category.items.length} dish${
            category.items.length === 1 ? "" : "es"
          }.`
        : "";
    if (!window.confirm(`Delete category "${category.name}"?${dishWarning} This cannot be undone.`)) {
      return;
    }

    setDeletingCategoryId(categoryId);
    setCategoryMessage(null);
    try {
      const response = await fetch("/api/menu", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not delete the category.");
      }

      setDbCategories((categories) => categories.filter((item) => item.id !== categoryId));
      if (selectedCategory === category.name) setSelectedCategory("all");
      setCategoryMessage({
        ok: true,
        text: `Category "${category.name}" and its dishes were deleted.`,
      });
    } catch (error) {
      setCategoryMessage({
        ok: false,
        text: error instanceof Error ? error.message : "Could not delete the category.",
      });
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleClearSelection = async (selectionId: string) => {
    setClearingSelectionId(selectionId);
    setSelectionError("");
    try {
      const response = await fetch("/api/selections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectionId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not clear the guest selection.");
      }
      setGuestSelections((selections) => selections.filter((selection) => selection.id !== selectionId));
    } catch (error) {
      console.error("Could not clear guest selection:", error);
      setSelectionError(error instanceof Error ? error.message : "Could not clear the guest selection.");
    } finally {
      setClearingSelectionId(null);
    }
  };

  const startEditingItem = (item: { id: string; name: string; description: string; category: string; price: number; priceUsd: number | null; prepTimeMinutes: number }) => {
    setEditingItemId(item.id);
    setNewItem({
      name: item.name,
      description: item.description,
      category: item.category,
      price: String(item.price),
      priceUsd: item.priceUsd === null ? "" : String(item.priceUsd),
      prepTimeMins: String(item.prepTimeMinutes),
    });
    setSelectedPhoto(null);
    setShowAddForm(true);
    setFormMessage("");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleItemAvailability = async (id: string) => {
    const item = dbCategories
      .flatMap((category) => category.items)
      .find((menuItem) => menuItem.id === id);
    if (!item) return;

    setAvailabilitySavingId(id);
    setFormMessage("");
    try {
      const isAvailable = await saveAvailability(id);
      const response = await fetch("/api/menu", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not refresh the menu.");
      setDbCategories(await response.json());
      setFormMessage(`"${item.name}" ${isAvailable ? "restocked" : "marked sold out"}.`);
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Could not update availability.");
    } finally {
      setAvailabilitySavingId(null);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    setDeletingFeedbackId(feedbackId);
    setFeedbackMessage("");
    try {
      const result = await deleteFeedback(feedbackId);
      setFeedbackMessage(result.message);
      if (result.ok) {
        setFeedbackItems((items) => items.filter((item) => item.id !== feedbackId));
      }
    } catch (error) {
      console.error("Could not delete guest comment:", error);
      setFeedbackMessage("Could not delete the comment. Please try again.");
    } finally {
      setDeletingFeedbackId(null);
    }
  };

  const databaseItems = dbCategories.flatMap((category) =>
    category.items.map((item) => ({
    id: item.id,
    name: item.name,
    category: category.name,
    description: item.description,
    price: Number(item.price),
    priceUsd: item.priceUsd === null ? null : Number(item.priceUsd),
    image: item.imageUrl ?? "",
    isAvailable: item.isAvailable,
    prepTimeMinutes: item.prepTimeMins,
    dietary: item.dietaryTags || [],
    }))
  );

const filteredItems = databaseItems.filter((item) => {
  if (
    selectedCategory !== "all" &&
    item.category.toLowerCase() !== selectedCategory.toLowerCase()
  ) {
    return false;
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  }

  return true;
});

  return (
    <div className="min-h-screen bg-[#0d0f12] text-stone-100 selection:bg-amber-500 selection:text-stone-950 pb-20">
      
      {/* ADMIN NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-stone-950/90 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-white sm:text-xl">
                  Hotel Admin Control Center
                </h1>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-widest text-amber-300">
                  Manager Portal
                </span>
              </div>
              <p className="text-xs text-stone-400">QR Code Management & Kitchen Control</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/?from=admin"
              className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-stone-200 hover:bg-white/15 hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4 text-amber-400" /> View Guest Menu
            </Link>
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-stone-300 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        
        {/* TOP QR MANAGEMENT HUB SECTION */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-300 mb-1">
                <Sparkles className="h-3 w-3" /> Live Venue QR Code
              </div>
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-white">
                Table QR Code Management
              </h2>
              <p className="text-xs text-stone-400">
                Single universal QR code for all tables, counters, and guest rooms
              </p>
            </div>

            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-xs font-extrabold text-stone-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
            >
              <Wand2 className="h-4 w-4" /> Open Sticker Generator
            </button>
          </div>

          {/* QR Showcase Grid */}
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            
            {/* Live QR Card */}
            <div className="flex flex-col sm:flex-row items-center gap-6 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 p-6 shadow-2xl backdrop-blur-xl">
              <div className="rounded-2xl border-4 border-amber-500/40 bg-white p-3 shadow-lg shrink-0">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="Universal Menu QR Code"
                    className="h-44 w-44 rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center rounded-lg text-xs text-stone-500">
                    {qrErrorMessage || "Creating QR code..."}
                  </div>
                )}
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-semibold text-emerald-400 inline-flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 1 Code For All Tables
                  </span>
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-white">
                    {hotelName}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Print and display this QR code on all table tents, room key cards, and bar counters.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-stone-300">
                  <span className="truncate flex-1 text-amber-300 font-mono text-[11px]">{liveUrl}</span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold px-2 py-1 rounded-lg bg-stone-900 border border-white/10"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => downloadQrDataUrl(qrDataUrl, "Universal_Table_Menu_QR.png")}
                    disabled={!qrDataUrl}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" /> Download QR
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print Sticker
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Staff Actions & Stats */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-stone-950 p-5 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Mobile Test Scan</h4>
                  <p className="text-xs text-stone-400 mt-1">
                    Scan with your smartphone camera to verify the live guest menu experience.
                  </p>
                </div>
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  Open Live Menu <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="rounded-3xl border border-white/10 bg-stone-950 p-5 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Active Menu Items</h4>
                  <p className="text-xs text-stone-400 mt-1">
                    {isLoadingMenu
                      ? "Loading menu..."
                      : `${databaseItems.length} dishes across ${dbCategories.length} categories`}
                  </p>
                </div>
                <div className="text-xs font-semibold text-emerald-400">
                  All Systems Operational
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-white/10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-white">
                Live guest selections
              </h2>
              <p className="text-xs text-stone-400">
                Anonymous food selections update here automatically ({guestSelections.length})
              </p>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              Refreshes every 5 seconds
            </span>
          </div>

          {selectionError && (
            <p role="alert" className="text-sm text-rose-300">{selectionError}</p>
          )}

          {isLoadingSelections ? (
            <p role="status" className="text-sm text-stone-400">Loading guest selections...</p>
          ) : guestSelections.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-stone-950 p-6 text-sm text-stone-400">
              <Utensils className="mb-2 h-5 w-5 text-stone-500" />
              No guest selections yet. New selections will appear here.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {guestSelections.map((selection) => {
                const total = selection.items.reduce(
                  (sum, item) => sum + item.quantity * item.unitPrice,
                  0
                );
                return (
                  <article key={selection.id} className="rounded-2xl border border-amber-500/20 bg-stone-950 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white">{selection.guestLabel}</h3>
                        <time className="mt-1 block text-xs text-stone-500" dateTime={selection.updatedAt}>
                          Updated {new Date(selection.updatedAt).toLocaleString()}
                        </time>
                      </div>
                      <button
                        type="button"
                        disabled={clearingSelectionId === selection.id}
                        onClick={() => void handleClearSelection(selection.id)}
                        className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-stone-300 hover:bg-white/10 disabled:opacity-50"
                      >
                        {clearingSelectionId === selection.id ? "Clearing..." : "Clear"}
                      </button>
                    </div>
                    <ul className="mt-4 space-y-2 border-t border-white/10 pt-3">
                      {selection.items.map((item) => (
                        <li key={item.itemId} className="flex justify-between gap-3 text-sm">
                          <span className="text-stone-200">
                            <span className="mr-2 font-bold text-amber-300">{item.quantity}×</span>
                            {item.name}
                            <span className="ml-2 text-xs text-stone-500">{item.categoryName}</span>
                          </span>
                          <span className="shrink-0 text-stone-400">
                            ETB {(item.quantity * item.unitPrice).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 border-t border-white/10 pt-3 text-right text-sm font-bold text-amber-300">
                      Total: ETB {total.toFixed(2)}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* KITCHEN & MENU MANAGEMENT SECTION */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-white">
                Kitchen Inventory & Availability
              </h2>
              <p className="text-xs text-stone-400">
                Toggle dishes in stock or mark items sold out (86) in real-time
              </p>
            </div>

            {/* Search & Category Filter */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormMessage("");
                  setShowAddForm((visible) => !visible);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400"
              >
                <Plus className="h-4 w-4" /> Add dish
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategoryMessage(null);
                  setShowAddCategoryForm((visible) => !visible);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400"
              >
                <Plus className="h-4 w-4" /> Add category
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes..."
                  className="w-48 rounded-xl border border-white/15 bg-stone-900 pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-white/15 bg-stone-900 px-3 py-1.5 text-xs text-stone-300 focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
{dbCategories.map((cat) => (
  <option key={cat.id} value={cat.name}>
    {cat.name}
  </option>
))}
              </select>
            </div>
          </div>

          {showAddCategoryForm && (
            <form
              onSubmit={handleAddCategory}
              className="grid max-w-xl gap-4 rounded-2xl border border-white/10 bg-stone-950 p-5 sm:grid-cols-[minmax(0,24rem)_auto]"
            >
              <label className="max-w-sm text-xs font-semibold text-stone-300">
                Category name
                <input
                  required
                  maxLength={80}
                  autoFocus
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="e.g. Hot Drinks"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-stone-900 px-3 py-2 text-sm text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none"
                />
              </label>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={isSavingCategory || !newCategoryName.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {isSavingCategory ? "Adding..." : "Add category"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategoryForm(false);
                    setNewCategoryName("");
                    setCategoryMessage(null);
                  }}
                  disabled={isSavingCategory}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-stone-200 hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
              {categoryMessage && (
                <p
                  role="status"
                  className={`text-sm sm:col-span-2 ${
                    categoryMessage.ok ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {categoryMessage.text}
                </p>
              )}
            </form>
          )}

          <section className="space-y-4 rounded-2xl border border-white/10 bg-stone-950 p-5">
            <div>
              <h3 className="text-sm font-bold text-white">Manage categories</h3>
              <p className="mt-1 text-xs text-stone-400">
                Deleting a category also permanently deletes all dishes in it.
              </p>
            </div>
            {!showAddCategoryForm && categoryMessage && (
              <p
                role="status"
                className={`text-sm ${categoryMessage.ok ? "text-emerald-300" : "text-rose-300"}`}
              >
                {categoryMessage.text}
              </p>
            )}
            {dbCategories.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {dbCategories.map((category) => (
                  <li
                    key={category.id}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-stone-900 px-3 py-2 text-sm text-stone-200"
                  >
                    <span>{category.name}</span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteCategory(category.id)}
                      disabled={isSavingCategory || deletingCategoryId !== null}
                      aria-label={`Delete ${category.name} category`}
                      className="font-semibold text-rose-300 hover:text-rose-200 disabled:opacity-50"
                    >
                      {deletingCategoryId === category.id ? "Deleting..." : "Delete"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {showAddForm && (
            <form
              onSubmit={handleSaveDish}
              className="grid gap-4 rounded-2xl border border-white/10 bg-stone-950 p-5 sm:grid-cols-2"
            >
              <label className="text-xs font-semibold text-stone-300">
                Dish name
                <input
                  required
                  value={newItem.name}
                  onChange={(event) => setNewItem({ ...newItem, name: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-stone-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Grilled salmon"
                />
              </label>
              <label className="text-xs font-semibold text-stone-300">
                Price (ETB)
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.price}
                  onChange={(event) => setNewItem({ ...newItem, price: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-stone-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  placeholder="0.00"
                />
              </label>
              <label className="text-xs font-semibold text-stone-300">
                Price (USD)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.priceUsd}
                  onChange={(event) => setNewItem({ ...newItem, priceUsd: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-stone-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  placeholder="Optional"
                />
                <span className="mt-1 block font-normal text-stone-500">
                  Enter the USD price separately. Leave blank to show ETB only.
                </span>
              </label>
              <label className="text-xs font-semibold text-stone-300">
                Category
                <select
                  required
                  value={newItem.category}
                  onChange={(event) => setNewItem({ ...newItem, category: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-stone-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Choose a category
                  </option>
                  {menuCategoryOptions.map((categoryName) => (
                    <option key={categoryName} value={categoryName}>
                      {categoryName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-stone-300">
                Preparation time (minutes)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newItem.prepTimeMins}
                  onChange={(event) => setNewItem({ ...newItem, prepTimeMins: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-stone-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-stone-300 sm:col-span-2">
                Description ({requiresMenuItemDescription(newItem.category) ? "required" : "optional"})
                <textarea
                  required={requiresMenuItemDescription(newItem.category)}
                  rows={3}
                  value={newItem.description}
                  onChange={(event) => setNewItem({ ...newItem, description: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-stone-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  placeholder={
                    requiresMenuItemDescription(newItem.category)
                      ? "Describe the dish and its ingredients"
                      : "Describe the drink (optional)"
                  }
                />
              </label>
              <label className="text-xs font-semibold text-stone-300 sm:col-span-2">
                Dish photo (optional)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => setSelectedPhoto(event.target.files?.[0] ?? null)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-stone-900 px-3 py-2 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-stone-950"
                />
                <span className="mt-1 block font-normal text-stone-500">
                  {selectedPhoto
                    ? `${selectedPhoto.name} selected`
                    : editingItemId
                      ? "Leave empty to keep the current photo. JPG, PNG, WebP, or GIF; maximum size: 5 MB."
                      : "You can add a photo now or leave this blank. JPG, PNG, WebP, or GIF; maximum size: 5 MB."}
                </span>
              </label>
              <div className="flex items-center gap-3 sm:col-span-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : editingItemId ? "Update dish" : "Save dish"}
                </button>
                {editingItemId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItemId(null);
                      setSelectedPhoto(null);
                      setNewItem({ name: "", description: "", category: "", price: "", priceUsd: "", prepTimeMins: "15" });
                      setFormMessage("");
                    }}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-stone-200"
                  >
                    Cancel
                  </button>
                )}
                {formMessage && (
                  <p role="status" className="text-sm text-stone-300">
                    {formMessage}
                  </p>
                )}
              </div>
            </form>
          )}
          {!showAddForm && formMessage && (
            <p role="status" className="text-sm text-emerald-300">{formMessage}</p>
          )}

          {/* Dishes Table / List */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoadingMenu ? (
              <p role="status" className="text-sm text-stone-400">Loading menu items...</p>
            ) : filteredItems.length === 0 ? (
              <p className="text-sm text-stone-400">No menu items found.</p>
            ) : filteredItems.map((item) => {
              const isAvailable = item.isAvailable;
              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-3xl border p-5 transition ${
                    isAvailable
                      ? "border-white/10 bg-stone-950"
                      : "border-rose-500/30 bg-rose-950/20"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-stone-900 shrink-0">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="line-clamp-3 flex h-full items-center justify-center px-1 text-center text-[8px] text-stone-400">
                            {item.name}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-amber-300">
                          <p>ETB {item.price.toFixed(2)}</p>
                          {item.priceUsd !== null && <p className="text-xs text-stone-300">${item.priceUsd.toFixed(2)}</p>}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {item.prepTimeMinutes} mins prep
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-base">{item.name}</h4>
                      {item.description && (
                        <p className="text-xs text-stone-400 mt-1 line-clamp-2">{item.description}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {item.dietary.map((tag: string) => (
                        <span
                          key={tag}
                          className="rounded bg-stone-900 border border-white/10 px-1.5 py-0.5 text-[9px] uppercase text-stone-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className={`text-xs font-semibold flex items-center gap-1.5 ${isAvailable ? "text-emerald-400" : "text-rose-400"}`}>
                      {isAvailable ? (
                        <>
                          <CheckCircle className="h-4 w-4" /> In Stock
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" /> 86 Sold Out
                        </>
                      )}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditingItem(item)}
                        className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-bold text-stone-200 hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteDish(item.id)}
                        className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[10px] font-bold text-rose-300 hover:bg-rose-500 hover:text-white"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleItemAvailability(item.id)}
                        disabled={availabilitySavingId === item.id}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition border ${
                          isAvailable
                            ? "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-white"
                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-stone-950"
                        }`}
                      >
                        {availabilitySavingId === item.id
                          ? "Updating..."
                          : isAvailable
                            ? "Mark Sold Out (86)"
                            : "Restock Item"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 border-t border-white/10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-white">
                Guest comments
              </h2>
              <p className="text-xs text-stone-400">
                Private messages sent from the customer menu ({feedbackItems.length})
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-stone-200 hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {feedbackMessage && (
            <p role="status" className="text-sm text-stone-300">{feedbackMessage}</p>
          )}

          {feedbackItems.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-stone-950 p-6 text-sm text-stone-400">
              <MessageSquare className="mb-2 h-5 w-5 text-stone-500" />
              No guest comments yet.
            </div>
          ) : (
            <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-stone-950 px-4">
              {feedbackItems.map((feedback) => (
                <article key={feedback.id} className="flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-sm font-semibold text-white">
                        {feedback.name || "Guest"}
                      </h3>
                      <time className="text-xs text-stone-500" dateTime={feedback.createdAt}>
                        {feedback.createdAt.slice(0, 10)}
                      </time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-300">
                      {feedback.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete guest comment"
                    title="Delete comment"
                    disabled={deletingFeedbackId === feedback.id}
                    onClick={() => void handleDeleteFeedback(feedback.id)}
                    className="shrink-0 rounded-lg p-2 text-stone-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* QR Generator Modal */}
      <QRGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
      />
    </div>
  );
}
