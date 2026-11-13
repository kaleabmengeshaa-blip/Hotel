"use client";

import React from "react";
import Image from "next/image";
import { MenuItem } from "../data/menuData";
import RotatingPrice from "./RotatingPrice";
import { X, Clock, Flame, AlertCircle, Sparkles } from "lucide-react";
import {
  getMenuCopy,
  translateDietaryTag,
  translateMenuItem,
  type MenuCurrency,
  type MenuLanguage,
} from "../lib/menu-i18n";

interface FoodDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  language: MenuLanguage;
  currency: MenuCurrency;
}

export default function FoodDetailModal({
  item,
  isOpen,
  onClose,
  language,
  currency,
}: FoodDetailModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl my-auto overflow-hidden rounded-3xl border border-amber-500/20 bg-stone-950 text-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={getMenuCopy(language, "close")}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-stone-900/80 text-stone-300 backdrop-blur-md transition hover:bg-stone-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero Image */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-stone-900">
          <Image
            src={item.image}
            alt={translateMenuItem(item.name, language)}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />

          {/* Badges overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-stone-200 border border-white/10 backdrop-blur-md">
                <Clock className="h-3.5 w-3.5 text-amber-400" /> {item.prepTimeMinutes} {getMenuCopy(language, "mins")}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-stone-200 border border-white/10 backdrop-blur-md">
                <Flame className="h-3.5 w-3.5 text-orange-400" /> {item.calories} {getMenuCopy(language, "calories")}
              </span>
            </div>
            <RotatingPrice
              priceEtb={item.price}
              priceUsd={item.priceUsd}
              currency={currency}
              language={language}
              className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-amber-300"
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {item.dietary.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-amber-300"
                >
                  {translateDietaryTag(tag, language)}
                </span>
              ))}
            </div>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-white">
              {translateMenuItem(item.name, language)}
            </h2>
          </div>

          {/* Ingredients shown before the description */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> {getMenuCopy(language, "keyIngredients")}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {item.ingredients.map((ing) => (
                <span
                  key={ing}
                  className="rounded-lg bg-stone-900 border border-white/10 px-2.5 py-1 text-xs text-stone-300"
                >
                  {ing}
                </span>
              ))}
            </div>

            {item.allergens.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-rose-300 pt-2 border-t border-white/5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{getMenuCopy(language, "containsAllergens")} <strong>{item.allergens.join(", ")}</strong></span>
              </div>
            )}
          </div>

          <p className="text-sm leading-relaxed text-stone-300">
            {item.longDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
