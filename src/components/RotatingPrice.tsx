"use client";

import { useEffect, useState, type CSSProperties } from "react";

interface RotatingPriceProps {
  priceEtb: number;
  priceUsd?: number | null;
  className?: string;
  style?: CSSProperties;
}

const etbFormatter = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function RotatingPrice({
  priceEtb,
  priceUsd,
  className,
  style,
}: RotatingPriceProps) {
  const [showUsd, setShowUsd] = useState(false);
  const hasUsdPrice = typeof priceUsd === "number" && Number.isFinite(priceUsd);

  useEffect(() => {
    if (!hasUsdPrice) return;

    const intervalId = window.setInterval(() => {
      setShowUsd((visible) => !visible);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [hasUsdPrice]);

  const displayUsd = hasUsdPrice && showUsd;
  const formattedPrice = displayUsd
    ? usdFormatter.format(priceUsd)
    : etbFormatter.format(priceEtb);

  return (
    <span className={className} style={style} aria-label={displayUsd ? "Price in US dollars" : "Price in Ethiopian birr"}>
      {formattedPrice}
    </span>
  );
}
