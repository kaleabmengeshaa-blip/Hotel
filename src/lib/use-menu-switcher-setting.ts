"use client";

import { useCallback, useEffect, useState } from "react";

type MenuSettingsResponse = {
  languageSwitcherEnabled: boolean;
  newestDishesFirst: boolean;
};

function isSettingResponse(value: unknown): value is MenuSettingsResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "languageSwitcherEnabled" in value &&
    typeof value.languageSwitcherEnabled === "boolean" &&
    "newestDishesFirst" in value &&
    typeof value.newestDishesFirst === "boolean"
  );
}

export function useMenuSwitcherSetting() {
  const [enabled, setEnabledState] = useState(false);
  const [newestFirstEnabled, setNewestFirstEnabledState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSetting = async () => {
      try {
        const response = await fetch("/api/menu-settings", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load the menu settings.");

        const result: unknown = await response.json();
        if (!isSettingResponse(result)) {
          throw new Error("The menu settings response is invalid.");
        }

        if (isMounted) {
          setEnabledState(result.languageSwitcherEnabled);
          setNewestFirstEnabledState(result.newestDishesFirst);
          setError("");
        }
      } catch (loadError) {
        console.error("Could not load the admin menu settings:", loadError);
        if (isMounted) setError("Could not load the menu settings.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadSetting();
    return () => {
      isMounted = false;
    };
  }, []);

  const setEnabled = useCallback(async (nextEnabled: boolean) => {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/menu-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageSwitcherEnabled: nextEnabled }),
      });
      if (!response.ok) throw new Error("Could not update the language setting.");

      const result: unknown = await response.json();
      if (!isSettingResponse(result)) {
        throw new Error("The menu settings response is invalid.");
      }
      setEnabledState(result.languageSwitcherEnabled);
    } catch (saveError) {
      console.error("Could not save the admin language setting:", saveError);
      setError("Could not update the language setting.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const setNewestFirstEnabled = useCallback(async (nextEnabled: boolean) => {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/menu-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newestDishesFirst: nextEnabled }),
      });
      if (!response.ok) throw new Error("Could not update the menu ordering setting.");

      const result: unknown = await response.json();
      if (!isSettingResponse(result)) {
        throw new Error("The menu settings response is invalid.");
      }
      setNewestFirstEnabledState(result.newestDishesFirst);
    } catch (saveError) {
      console.error("Could not save the admin menu ordering setting:", saveError);
      setError("Could not update the menu ordering setting.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    enabled,
    newestFirstEnabled,
    isLoading,
    isSaving,
    error,
    setEnabled,
    setNewestFirstEnabled,
  };
}
