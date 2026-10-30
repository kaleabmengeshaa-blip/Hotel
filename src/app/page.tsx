"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CATEGORIES,
  MENU_ITEMS,
  MenuItem,
} from "../data/menuData";
import FoodDetailModal from "../components/FoodDetailModal";
import GuestFeedbackPopover from "../components/GuestFeedbackPopover";


import {
  Search,
  Star,
  Clock,
  Sparkles,
  Flame,
  Plus,
  Utensils,
  Coffee,
  ArrowLeft,
} from "lucide-react";

type ApiMenuCategory = {
  id: string;
  hotelId: string;
  name: string;
  items: {
    id: string;
    name: string;
    description: string;
    price: number | string;
    imageUrl: string | null;
    prepTimeMins: number;
    isAvailable: boolean;
    dietaryTags: string[];
  }[];
};

const supportedDietaryTags = new Set<MenuItem["dietary"][number]>([
  "vegetarian",
  "vegan",
  "gluten-free",
  "spicy",
  "chef-special",
  "halal",
]);

export default function Home() {
  const [showAdminReturn, setShowAdminReturn] = useState(false);
  const [databaseCategories, setDatabaseCategories] = useState<ApiMenuCategory[]>([]);
  const [databaseMenuLoaded, setDatabaseMenuLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (typeof window !== "undefined") {
      if (new URLSearchParams(window.location.search).get("from") === "admin") {
        fetch("/api/admin/session", { cache: "no-store" })
          .then((response) => (response.ok ? response.json() : null))
          .then((data) => {
            if (isMounted && data?.authenticated === true) setShowAdminReturn(true);
          })
          .catch(() => undefined);
      }
    }

    const loadMenu = async () => {
      try {
        const response = await fetch("/api/menu", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load the latest menu.");
        const categories = (await response.json()) as ApiMenuCategory[];
        if (!Array.isArray(categories)) {
          throw new Error("The menu response has an invalid format.");
        }
        if (isMounted) setDatabaseCategories(categories);
        if (isMounted) setDatabaseMenuLoaded(true);
      } catch (error) {
        console.error("Could not load the latest menu:", error);
      }
    };

    void loadMenu();
    const refreshTimer = window.setInterval(() => void loadMenu(), 10000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const databaseItems: MenuItem[] = databaseCategories.flatMap((category) =>
    category.items.filter((item) => item.isAvailable).map((item) => ({
      id: item.id,
      name: item.name,
      category: category.id,
      description: item.description,
      longDescription: item.description,
      price: Number(item.price),
      image: item.imageUrl || "/images/burrata_salad.png",
      rating: 0,
      reviewsCount: 0,
      prepTimeMinutes: item.prepTimeMins,
      calories: 0,
      dietary: item.dietaryTags.filter(
        (tag): tag is MenuItem["dietary"][number] => supportedDietaryTags.has(tag as MenuItem["dietary"][number])
      ),
      ingredients: [],
      allergens: [],
    }))
  );
  const menuItems = databaseMenuLoaded ? databaseItems : MENU_ITEMS;
  const menuCategories = databaseMenuLoaded
    ? [
        { id: "all", name: "All Dishes" },
        ...databaseCategories.map((category) => ({ id: category.id, name: category.name })),
      ]
    : CATEGORIES;

  // Modals state
  const [selectedFood, setSelectedFood] = useState<MenuItem | null>(null);


  // Category & Filter state
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

  // Filter menu items based on category, search, and dietary tags
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category match
      if (activeCategory !== "all" && item.category !== activeCategory) {
        if (activeCategory === "chef-special") {
          if (!item.dietary.includes("chef-special")) return false;
        } else {
          return false;
        }
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesIng = item.ingredients.some((ing) => ing.toLowerCase().includes(query));
        if (!matchesName && !matchesDesc && !matchesIng) return false;
      }

      // Dietary filter match
      if (selectedDietary.length > 0) {
        const matchesAllDietary = selectedDietary.every((tag) =>
          item.dietary.some((dietaryTag) => dietaryTag === tag)
        );
        if (!matchesAllDietary) return false;
      }

      return true;
    });
  }, [activeCategory, menuItems, searchQuery, selectedDietary]);

  const toggleDietaryFilter = (tag: string) => {
    setSelectedDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <main className="min-h-screen bg-[#0d0f12] text-stone-100 selection:bg-amber-500 selection:text-stone-950 pb-28">
      
      {/* CENTERED HEADER: NAME + TAGLINE */}
      <header className="border-b border-white/10 bg-gradient-to-b from-stone-950 to-[#0d0f12] px-4 py-8 text-center sm:py-10">
        {showAdminReturn && (
          <div className="mx-auto mb-4 flex max-w-3xl justify-end">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-stone-200 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Admin
            </Link>
          </div>
        )}
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <Coffee className="h-6 w-6" />
          </div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Classic Cafe and Restaurant
          </h1>
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-amber-500/50" />
            <span className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
              Menu
            </span>
            <span className="h-px w-10 bg-amber-500/50" />
          </div>
          <p className="text-sm text-stone-300 sm:text-base">
            Coffee, breakfast, meals & fresh juice
          </p>
        </div>
      </header>

      {/* STICKY CATEGORY & SEARCH NAVIGATION */}
      <section className="sticky top-0 z-30 border-b border-white/10 bg-[#0d0f12]/95 backdrop-blur-md py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          
          {/* Search Bar & Dietary Chips */}
               <div className="flex flex-col md:flex-row gap-3 md:gap-30 items-stretch md:items-center justify-start">
            
            {/* Search Input */}
              <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coffee, breakfast, juice..."
                className="w-full rounded-2xl border border-white/15 bg-stone-900/90 pl-10 pr-4 py-2.5 text-xs text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {databaseCategories[0]?.hotelId && (
              <GuestFeedbackPopover hotelId={databaseCategories[0].hotelId} />
            )}

            {/* Dietary Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider shrink-0 mr-1">
                Filter:
              </span>
              {[
                { tag: "chef-special", label: "Chef's Specia ⭐" },
                { tag: "vegetarian", label: "Vegetarian 🌿" },
                { tag: "vegan", label: "Vegan 🌱" },
                { tag: "gluten-free", label: "Gluten-Free 🌾" },
                { tag: "halal", label: "Halal 🌙" },
              ].map(({ tag, label }) => {
                const isActive = selectedDietary.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleDietaryFilter(tag)}
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      isActive
                        ? "border-amber-500 bg-amber-500 text-stone-950 shadow-md"
                        : "border-white/10 bg-stone-900 text-stone-300 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {menuCategories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? "border-amber-500 bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20"
                      : "border-white/10 bg-white/5 text-stone-300 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOD MENU ITEMS GRID */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Results Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-white">
              {menuCategories.find((c) => c.id === activeCategory)?.name || "All Dishes"}
            </h3>
            <p className="text-xs text-stone-400">
              Showing {filteredItems.length} curated item{filteredItems.length === 1 ? "" : "s"}
            </p>
          </div>

          {(searchQuery || selectedDietary.length > 0) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDietary([]);
                setActiveCategory("all");
              }}
              className="text-xs font-semibold text-amber-400 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Grid */}
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-stone-950 p-12 text-center space-y-3">
            <Utensils className="h-12 w-12 text-stone-600 mx-auto" />
            <h4 className="text-lg font-bold text-white">No dishes match your criteria</h4>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Try adjusting your search keywords or clearing dietary filters to view all menu selections.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDietary([]);
                setActiveCategory("all");
              }}
              className="mt-2 inline-flex rounded-full bg-amber-500 px-5 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400"
            >
              Show Full Menu
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedFood(item)}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-stone-950/80 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-[0_20px_50px_rgba(212,175,55,0.12)] cursor-pointer"
              >
                {/* Food Image */}
                <div className="relative h-52 w-full overflow-hidden bg-stone-900">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    {item.dietary.includes("chef-special") ? (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-950 shadow-md">
                        <Sparkles className="h-3 w-3" /> Chef&apos;s Special
                      </span>
                    ) : (
                      <span />
                    )}

                    <span className="flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-md border border-white/10">
                      <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /> {item.rating}
                    </span>
                  </div>

                  {/* Price Tag */}
                  <div className="absolute bottom-3 right-3 rounded-2xl bg-stone-950/90 border border-amber-500/30 px-3.5 py-1 text-base font-extrabold text-amber-300 backdrop-blur-md">
                    ${item.price}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  <div>
                    {/* Dietary Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {item.dietary.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-stone-900 border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-stone-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-white group-hover:text-amber-300 transition">
                      {item.name}
                    </h4>

                    <p className="mt-2 text-xs leading-relaxed text-stone-400 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3 text-[11px] text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-amber-400" /> {item.prepTimeMinutes}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-orange-400" /> {item.calories} kcal
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFood(item);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-stone-950 font-bold transition hover:bg-amber-400 group-hover:scale-105"
                      title="View details"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODALS */}
      <FoodDetailModal
        item={selectedFood}
        isOpen={!!selectedFood}
        onClose={() => setSelectedFood(null)}
      />
    </main>
  );
}
