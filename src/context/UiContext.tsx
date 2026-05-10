"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppTheme = "apple" | "cute" | "dark";

const STORAGE_KEY = "碎片生活-ui-v1";

type UiPreferences = {
  theme: AppTheme;
  gridVisible: boolean;
};

function readStored(): Partial<UiPreferences> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<UiPreferences>;
  } catch {
    return {};
  }
}

type UiContextValue = {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  gridVisible: boolean;
  setGridVisible: (v: boolean) => void;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("cute");
  const [gridVisible, setGridVisibleState] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = readStored();
    if (s.theme === "apple" || s.theme === "cute" || s.theme === "dark") {
      setThemeState(s.theme);
    }
    if (typeof s.gridVisible === "boolean") {
      setGridVisibleState(s.gridVisible);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ theme, gridVisible }),
      );
    } catch {
      /* ignore */
    }
  }, [theme, gridVisible, hydrated]);

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t);
  }, []);

  const setGridVisible = useCallback((v: boolean) => {
    setGridVisibleState(v);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, gridVisible, setGridVisible }),
    [theme, setTheme, gridVisible, setGridVisible],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) {
    throw new Error("useUi must be used within UiProvider");
  }
  return ctx;
}
