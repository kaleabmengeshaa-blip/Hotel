"use client";

import type { CSSProperties } from "react";
import {
  formatMenuPrice,
  type MenuCurrency,
  type MenuLanguage,
} from "../lib/menu-i18n";

interface RotatingPriceProps {
  priceEtb: number;
  priceUsd?: number | null;
  currency: MenuCurrency;
  language: MenuLanguage;
  className?: string;
  style?: CSSProperties;
}

export default function RotatingPrice({
  priceEtb,
  priceUsd,
  currency,
  language,
  className,
  style,
}: RotatingPriceProps) {
  const formattedPrice = formatMenuPrice(priceEtb, priceUsd, currency, language);
  const priceLabel =
    language === "am"
      ? currency === "USD"
        ? "ዋጋ በዶላር"
        : "ዋጋ በኢትዮጵያ ብር"
      : currency === "USD"
        ? "Price in US dollars"
        : "Price in Ethiopian birr";

  return (
    <span className={className} style={style} aria-label={priceLabel}>
      {formattedPrice}
    </span>
  );
}
