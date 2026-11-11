"use client";

import { useCallback, useEffect, useState } from "react";

type MenuSwitcherSettingResponse = {
  languageSwitcherEnabled: boolean;
};

function isSettingResponse(value: unknown): value is MenuSwitcherSettingResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "languageSwitcherEnabled" in value &&
    typeof value.languageSwitcherEnabled === "boolean"
  );
}

export function useMenuSwitcherSetting() {
  const [enabled, setEnabledState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSetting = async () => {
      try {
        const response = await fetch("/api/menu-settings", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load the language setting.");

        const result: unknown = await response.json();
        if (!isSettingResponse(result)) {
          throw new Error("The language setting response is invalid.");
        }

        if (isMounted) {
          setEnabledState(result.languageSwitcherEnabled);
          setError("");
        }
      } catch (loadError) {
        console.error("Could not load the admin language setting:", loadError);
        if (isMounted) setError("Could not load the language setting.");
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
        throw new Error("The language setting response is invalid.");
      }
      setEnabledState(result.languageSwitcherEnabled);
    } catch (saveError) {
      console.error("Could not save the admin language setting:", saveError);
      setError("Could not update the language setting.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { enabled, isLoading, isSaving, error, setEnabled };
}
