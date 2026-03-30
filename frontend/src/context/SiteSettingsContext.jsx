import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSiteSettings } from "../services/api";

const DEFAULT_SETTINGS = {
  firm_name: "Immigration Law Firm",
  phone: "(555) 123-4567",
  email: "info@immigrationfirm.com",
  office_mode: "Zoom / phone only",
  address: "",
  logo_url: "",
  hero_image_url: "/images/la-skyline.jpg",
  services_image_url: "/images/family-immigration.jpg",
  office_image_url: "/images/ny-office.jpg",
  language_mode: "english",
};

const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  async function refreshSettings() {
    setLoading(true);

    try {
      const result = await getSiteSettings();
      setSettings(result?.settings ? { ...DEFAULT_SETTINGS, ...result.settings } : DEFAULT_SETTINGS);
    } catch (error) {
      console.error("Failed to load site settings:", error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshSettings();
  }, []);

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      refreshSettings,
      loading,
    }),
    [settings, loading]
  );

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);

  if (!context) {
    throw new Error("useSiteSettings must be used inside SiteSettingsProvider");
  }

  return context;
}
