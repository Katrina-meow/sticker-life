"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AppTheme = "apple" | "cute" | "dark";
export type WorkspaceView = "timeline" | "canvas";
export type CanvasBackgroundType = "color" | "image";

export type CanvasBackground = {
  type: CanvasBackgroundType;
  /** 空字符串表示使用主题默认画板背景 */
  value: string;
};

const STORAGE_KEY = "碎片生活-ui-v1";

/** data URL 写入 localStorage 的上限（约 1.2MB 字符） */
export const CANVAS_BG_DATA_URL_MAX = 1_200_000;

type UiPreferences = {
  theme: AppTheme;
  gridVisible: boolean;
  workspaceView: WorkspaceView;
  canvasBackground?: CanvasBackground;
};

const defaultCanvasBackground: CanvasBackground = {
  type: "color",
  value: "",
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

function defaultViewForTheme(theme: AppTheme): WorkspaceView {
  return theme === "apple" || theme === "dark" ? "timeline" : "canvas";
}

function parseCanvasBackground(raw: unknown): CanvasBackground {
  if (!raw || typeof raw !== "object") return { ...defaultCanvasBackground };
  const o = raw as Record<string, unknown>;
  const type = o.type === "image" ? "image" : "color";
  const value = typeof o.value === "string" ? o.value : "";
  return { type, value };
}

/** 画板为深色或图片时，淡化全页网格（与 GridPaper 共用） */
export function shouldDimCanvasGrid(
  workspaceView: WorkspaceView,
  bg: CanvasBackground,
): boolean {
  if (workspaceView !== "canvas" || !bg.value) return false;
  if (bg.type === "image") return true;
  const hex = bg.value.trim().replace(/^#/, "");
  if (hex.length !== 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return false;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum < 0.45;
}

type UiContextValue = {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  gridVisible: boolean;
  setGridVisible: (v: boolean) => void;
  workspaceView: WorkspaceView;
  setWorkspaceView: (v: WorkspaceView) => void;
  canvasBackground: CanvasBackground;
  setCanvasBackground: (bg: CanvasBackground) => void;
  setCanvasBackgroundType: (t: CanvasBackgroundType) => void;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("cute");
  const [gridVisible, setGridVisibleState] = useState(true);
  const [workspaceView, setWorkspaceViewState] = useState<WorkspaceView>(
    "canvas",
  );
  const [canvasBackground, setCanvasBackgroundState] = useState<CanvasBackground>(
    { ...defaultCanvasBackground },
  );
  const [hydrated, setHydrated] = useState(false);
  const blobUnmountRef = useRef<string | null>(null);

  useEffect(() => {
    blobUnmountRef.current = canvasBackground.value.startsWith("blob:")
      ? canvasBackground.value
      : null;
  }, [canvasBackground.value]);

  useEffect(() => {
    return () => {
      if (blobUnmountRef.current) {
        URL.revokeObjectURL(blobUnmountRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const s = readStored();
    let nextTheme: AppTheme = "cute";
    if (s.theme === "apple" || s.theme === "cute" || s.theme === "dark") {
      nextTheme = s.theme;
    }
    setThemeState(nextTheme);

    if (typeof s.gridVisible === "boolean") {
      setGridVisibleState(s.gridVisible);
    }

    if (s.workspaceView === "timeline" || s.workspaceView === "canvas") {
      setWorkspaceViewState(s.workspaceView);
    } else {
      setWorkspaceViewState(defaultViewForTheme(nextTheme));
    }

    setCanvasBackgroundState(parseCanvasBackground(s.canvasBackground));

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      const persistBg = { ...canvasBackground };
      if (
        persistBg.type === "image" &&
        persistBg.value.startsWith("blob:") &&
        persistBg.value.length > 0
      ) {
        persistBg.value = "";
      }
      if (
        persistBg.type === "image" &&
        persistBg.value.startsWith("data:") &&
        persistBg.value.length > CANVAS_BG_DATA_URL_MAX
      ) {
        persistBg.value = "";
      }
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          theme,
          gridVisible,
          workspaceView,
          canvasBackground: persistBg,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [theme, gridVisible, workspaceView, canvasBackground, hydrated]);

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t);
  }, []);

  const setGridVisible = useCallback((v: boolean) => {
    setGridVisibleState(v);
  }, []);

  const setWorkspaceView = useCallback((v: WorkspaceView) => {
    setWorkspaceViewState(v);
  }, []);

  const setCanvasBackground = useCallback((bg: CanvasBackground) => {
    setCanvasBackgroundState((prev) => {
      if (prev.value.startsWith("blob:") && prev.value !== bg.value) {
        URL.revokeObjectURL(prev.value);
      }
      return bg;
    });
  }, []);

  const setCanvasBackgroundType = useCallback((t: CanvasBackgroundType) => {
    setCanvasBackgroundState((prev) => {
      if (prev.value.startsWith("blob:")) {
        URL.revokeObjectURL(prev.value);
      }
      if (t === prev.type) return prev;
      return { type: t, value: "" };
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      gridVisible,
      setGridVisible,
      workspaceView,
      setWorkspaceView,
      canvasBackground,
      setCanvasBackground,
      setCanvasBackgroundType,
    }),
    [
      theme,
      setTheme,
      gridVisible,
      setGridVisible,
      workspaceView,
      setWorkspaceView,
      canvasBackground,
      setCanvasBackground,
      setCanvasBackgroundType,
    ],
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
