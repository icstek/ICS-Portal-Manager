import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const BrandingContext = createContext({
  companyName: "",
  companyLogoUrl: "",
  primaryColor: "",
  accentColor: "",
  loaded: false,
  refresh: () => {},
});

function hexToHSL(hex) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState({
    companyName: "",
    companyLogoUrl: "",
    primaryColor: "",
    accentColor: "",
    loaded: false,
  });

  const loadBranding = async () => {
    const records = await base44.entities.GlobalSettings.filter({ key: "global" });
    if (records.length > 0) {
      const s = records[0];
      const newBranding = {
        companyName: s.company_name || "",
        companyLogoUrl: s.company_logo_url || "",
        primaryColor: s.primary_color || "",
        accentColor: s.accent_color || "",
        loaded: true,
      };
      setBranding(newBranding);
      applyColors(newBranding.primaryColor, newBranding.accentColor);
    } else {
      setBranding((prev) => ({ ...prev, loaded: true }));
    }
  };

  const applyColors = (primary, accent) => {
    const root = document.documentElement;
    if (primary && /^#[0-9a-fA-F]{6}$/.test(primary)) {
      const hsl = hexToHSL(primary);
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
      root.style.setProperty("--chart-1", hsl);
    }
    if (accent && /^#[0-9a-fA-F]{6}$/.test(accent)) {
      const hsl = hexToHSL(accent);
      root.style.setProperty("--accent", hsl);
      root.style.setProperty("--chart-3", hsl);
    }
  };

  useEffect(() => {
    loadBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ ...branding, refresh: loadBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}