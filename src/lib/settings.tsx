import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppSettings = {
  theme: "dark" | "light";
  showAssistant: boolean;
  language: "ru" | "kk" | "en";
};

const STORAGE_KEY = "autofix:preferences:v1";
const DEFAULT_SETTINGS: AppSettings = { theme: "dark", showAssistant: true, language: "ru" };
const SettingsContext = createContext<{
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
} | null>(null);

function readSettings(): AppSettings {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!stored || typeof stored !== "object") return DEFAULT_SETTINGS;
    const value = stored as Partial<AppSettings>;
    return {
      theme: value.theme === "light" ? "light" : "dark",
      showAssistant: typeof value.showAssistant === "boolean" ? value.showAssistant : true,
      language: value.language === "kk" || value.language === "en" ? value.language : "ru",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(readSettings());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.lang = settings.language;
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", settings.theme === "light" ? "#f3f5f0" : "#0b1110");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Keep the current session usable if storage is disabled or full.
    }
  }, [loaded, settings]);

  function updateSettings(patch: Partial<AppSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);
  }

  return <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings must be used within SettingsProvider");
  return value;
}
