import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const DEFAULTS = {
  darkMode: false,
  dashboardLayout: "grid", // "grid" | "list"
};

export function useUserSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then((user) => {
      if (user?.settings) {
        setSettings({ ...DEFAULTS, ...user.settings });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkMode]);

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await base44.auth.updateMe({ settings: newSettings });
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  };

  return { settings, updateSetting, loading };
}