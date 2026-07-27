"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { readStorage, writeStorage } from "@/lib/storage";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";

export type Theme = "light" | "dark";
export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  /** Resolved light/dark value actually applied to the page. */
  theme: Theme;
  /** What the user picked — "system" follows the OS preference. */
  themePreference: ThemePreference;
  /** Toggles between light/dark (ignores "system"), used by Sidebar/Header. */
  toggleTheme: () => void;
  setThemePreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(preference: ThemePreference): Theme {
  if (preference === "system") return getSystemPrefersDark() ? "dark" : "light";
  return preference;
}

const SETTINGS_STORAGE_KEY = "planly:settings";

/**
 * Writes just `appearance.theme` into the same `planly:settings` blob the
 * Settings page saves, merging into whatever is already stored (or into
 * DEFAULT_SETTINGS if nothing has been saved yet) so no other category is
 * ever touched or lost. This makes the Sidebar/Header quick toggle persist
 * on its own — previously only a Settings-page save wrote this key, so a
 * theme picked via the toggle was silently forgotten on reload.
 */
function persistThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") return;
  const stored = readStorage<Record<string, unknown> | null>(SETTINGS_STORAGE_KEY, null);
  const base = stored ?? (DEFAULT_SETTINGS as unknown as Record<string, unknown>);
  const appearance = (base.appearance as Record<string, unknown> | undefined) ?? {};
  writeStorage(SETTINGS_STORAGE_KEY, { ...base, appearance: { ...appearance, theme: preference } });
}

/**
 * Light/dark toggle, local state only for the resolved value, but the
 * user's *preference* (including "system") is read once from the same
 * `planly:settings` blob the Settings page writes to — so a saved choice
 * there survives reload on every page, not just Settings itself.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    const stored = readStorage<{ appearance?: { theme?: ThemePreference } } | null>("planly:settings", null);
    return stored?.appearance?.theme ?? "light";
  });
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(themePreference));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    setTheme(resolveTheme(themePreference));

    if (themePreference !== "system" || typeof window === "undefined" || !window.matchMedia) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setTheme(resolveTheme("system"));
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [themePreference]);

  const setThemePreference = (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    persistThemePreference(preference);
  };

  const toggleTheme = () => {
    const next = resolveTheme(themePreference) === "dark" ? "light" : "dark";
    setThemePreferenceState(next);
    persistThemePreference(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, themePreference, toggleTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
