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
import type { CategoryKey, StickerDialogState, StickerItem } from "@/types/sticker";
import {
  defaultCategoriesAndBuckets,
  getFieldMode,
  type CategoryEntry,
} from "@/lib/categoryConfig";
import { loadAppData, saveAppData } from "@/lib/stickerStorage";

export type { CategoryKey, StickerItem } from "@/types/sticker";

function defaultPositionForIndex(index: number): { x: number; y: number } {
  const col = index % 5;
  const row = Math.floor(index / 5);
  return { x: 32 + col * 56, y: 32 + row * 72 };
}

function nextGlobalZIndex(
  buckets: Record<CategoryKey, StickerItem[]>,
): number {
  let m = 0;
  for (const list of Object.values(buckets)) {
    for (const s of list) {
      if (typeof s.zIndex === "number" && s.zIndex > m) m = s.zIndex;
    }
  }
  return m + 1;
}

function inferRecordedAt(s: StickerItem): string {
  if (s.recordedAt) {
    const t = new Date(s.recordedAt).getTime();
    if (!Number.isNaN(t)) return s.recordedAt;
  }
  const prefix = s.id.split("-")[0];
  const ts = parseInt(prefix, 10);
  if (Number.isFinite(ts) && ts > 1e12) {
    return new Date(ts).toISOString();
  }
  return new Date().toISOString();
}

function normalizeStickerFields(s: StickerItem, cat: CategoryKey): StickerItem {
  const mode = getFieldMode(cat);
  const {
    calories: c,
    hero: h,
    studyDuration: sd,
    ...rest
  } = s;
  if (mode === "food") {
    return { ...rest, calories: c };
  }
  if (mode === "game") {
    return { ...rest, hero: h };
  }
  if (mode === "study") {
    return { ...rest, studyDuration: sd };
  }
  return rest;
}

function migrateSticker(s: StickerItem, cat: CategoryKey): StickerItem {
  const pos = defaultPositionForIndex(0);
  const x =
    typeof s.x === "number" && !Number.isNaN(s.x) ? s.x : pos.x;
  const y =
    typeof s.y === "number" && !Number.isNaN(s.y) ? s.y : pos.y;
  const name = s.name ?? "";
  const amount = s.amount ?? "";
  const recordedAt = inferRecordedAt(s);
  const scale =
    typeof s.scale === "number" && s.scale > 0 && Number.isFinite(s.scale)
      ? s.scale
      : 1;
  const zIndex =
    typeof s.zIndex === "number" && Number.isFinite(s.zIndex) ? s.zIndex : 0;

  const merged: StickerItem = {
    ...s,
    x,
    y,
    name,
    amount,
    recordedAt,
    scale,
    zIndex,
  };
  return normalizeStickerFields(merged, cat);
}

function ensureBucketsForCategories(
  categories: CategoryEntry[],
  stickers: Record<CategoryKey, StickerItem[]>,
): Record<CategoryKey, StickerItem[]> {
  const next = { ...stickers };
  for (const { id } of categories) {
    if (!Array.isArray(next[id])) next[id] = [];
  }
  return next;
}

function migrateAllStickers(
  stickers: Record<CategoryKey, StickerItem[]>,
  categories: CategoryEntry[],
): Record<CategoryKey, StickerItem[]> {
  const buckets = ensureBucketsForCategories(categories, stickers);
  const out: Record<CategoryKey, StickerItem[]> = {};
  for (const { id } of categories) {
    out[id] = (buckets[id] ?? []).map((s) => migrateSticker(s, id));
  }
  return out;
}

export type SelectedSticker = { category: CategoryKey; id: string };

type StickerContextValue = {
  categories: CategoryEntry[];
  addCategory: (label: string) => CategoryKey;
  stickersByCategory: Record<CategoryKey, StickerItem[]>;
  dialog: StickerDialogState | null;
  selectedDayKey: string | null;
  setSelectedDayKey: (key: string | null) => void;
  selectedSticker: SelectedSticker | null;
  setSelectedSticker: (sel: SelectedSticker | null) => void;
  clearSelection: () => void;
  openCreateSticker: (
    category: CategoryKey,
    src: string,
    rotationDeg: number,
  ) => void;
  openEditSticker: (category: CategoryKey, id: string) => void;
  closeDialog: () => void;
  addSticker: (category: CategoryKey, item: StickerItem) => void;
  removeSticker: (category: CategoryKey, id: string) => void;
  bringStickerToFront: (category: CategoryKey, id: string) => void;
  updateStickerMeta: (
    category: CategoryKey,
    id: string,
    patch: Partial<
      Pick<StickerItem, "name" | "amount" | "calories" | "hero" | "studyDuration">
    >,
  ) => void;
  updateStickerPosition: (
    category: CategoryKey,
    id: string,
    x: number,
    y: number,
  ) => void;
  updateStickerRecordedAt: (
    category: CategoryKey,
    id: string,
    iso: string,
  ) => void;
  updateStickerTransform: (
    category: CategoryKey,
    id: string,
    patch: Partial<
      Pick<StickerItem, "x" | "y" | "rotationDeg" | "scale" | "recordedAt">
    >,
  ) => void;
};

const StickerContext = createContext<StickerContextValue | null>(null);

export function StickerProvider({ children }: { children: ReactNode }) {
  const defaults = useMemo(() => defaultCategoriesAndBuckets(), []);
  const [hydrated, setHydrated] = useState(false);
  const [categories, setCategories] = useState<CategoryEntry[]>(
    () => defaults.categories,
  );
  const [stickersByCategory, setStickersByCategory] = useState<
    Record<CategoryKey, StickerItem[]>
  >(() => defaults.stickers);
  const [dialog, setDialog] = useState<StickerDialogState | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedSticker, setSelectedSticker] =
    useState<SelectedSticker | null>(null);

  useEffect(() => {
    const loaded = loadAppData();
    if (loaded) {
      const cats = loaded.categories.length
        ? loaded.categories
        : defaults.categories;
      const stickers = migrateAllStickers(loaded.stickers, cats);
      setCategories(cats);
      setStickersByCategory(stickers);
    }
    setHydrated(true);
  }, [defaults]);

  useEffect(() => {
    if (!hydrated) return;
    saveAppData({ categories, stickers: stickersByCategory });
  }, [categories, stickersByCategory, hydrated]);

  const clearSelection = useCallback(() => setSelectedSticker(null), []);

  const addCategory = useCallback((label: string) => {
    const id = `custom-${Date.now()}`;
    const trimmed = label.trim();
    setCategories((prev) => [
      ...prev,
      { id, label: trimmed || "未命名" },
    ]);
    setStickersByCategory((prev) => ({ ...prev, [id]: [] }));
    return id;
  }, []);

  const openCreateSticker = useCallback(
    (category: CategoryKey, src: string, rotationDeg: number) => {
      setDialog({ mode: "create", category, src, rotationDeg });
    },
    [],
  );

  const closeDialog = useCallback(() => setDialog(null), []);

  const bringStickerToFront = useCallback((category: CategoryKey, id: string) => {
    setStickersByCategory((prev) => {
      const z = nextGlobalZIndex(prev);
      return {
        ...prev,
        [category]: prev[category].map((s) =>
          s.id === id ? { ...s, zIndex: z } : s,
        ),
      };
    });
  }, []);

  const openEditSticker = useCallback(
    (category: CategoryKey, id: string) => {
      bringStickerToFront(category, id);
      setDialog({ mode: "edit", category, id });
    },
    [bringStickerToFront],
  );

  const addSticker = useCallback((category: CategoryKey, item: StickerItem) => {
    setStickersByCategory((prev) => {
      const z = nextGlobalZIndex(prev);
      const normalized: StickerItem = normalizeStickerFields(
        {
          ...item,
          scale: item.scale ?? 1,
          zIndex: z,
        },
        category,
      );
      return {
        ...prev,
        [category]: [normalized, ...(prev[category] ?? [])],
      };
    });
  }, []);

  const removeSticker = useCallback((category: CategoryKey, id: string) => {
    setStickersByCategory((prev) => ({
      ...prev,
      [category]: (prev[category] ?? []).filter((s) => s.id !== id),
    }));
    setSelectedSticker((sel) =>
      sel?.category === category && sel.id === id ? null : sel,
    );
  }, []);

  const updateStickerMeta = useCallback(
    (
      category: CategoryKey,
      id: string,
      patch: Partial<
        Pick<StickerItem, "name" | "amount" | "calories" | "hero" | "studyDuration">
      >,
    ) => {
      setStickersByCategory((prev) => ({
        ...prev,
        [category]: (prev[category] ?? []).map((s) => {
          if (s.id !== id) return s;
          const merged = { ...s, ...patch };
          return normalizeStickerFields(merged, category);
        }),
      }));
    },
    [],
  );

  const updateStickerPosition = useCallback(
    (category: CategoryKey, id: string, x: number, y: number) => {
      setStickersByCategory((prev) => ({
        ...prev,
        [category]: (prev[category] ?? []).map((s) =>
          s.id === id ? { ...s, x, y } : s,
        ),
      }));
    },
    [],
  );

  const updateStickerRecordedAt = useCallback(
    (category: CategoryKey, id: string, iso: string) => {
      setStickersByCategory((prev) => ({
        ...prev,
        [category]: (prev[category] ?? []).map((s) =>
          s.id === id ? { ...s, recordedAt: iso } : s,
        ),
      }));
    },
    [],
  );

  const updateStickerTransform = useCallback(
    (
      category: CategoryKey,
      id: string,
      patch: Partial<
        Pick<StickerItem, "x" | "y" | "rotationDeg" | "scale" | "recordedAt">
      >,
    ) => {
      setStickersByCategory((prev) => ({
        ...prev,
        [category]: (prev[category] ?? []).map((s) =>
          s.id === id ? { ...s, ...patch } : s,
        ),
      }));
    },
    [],
  );

  const value = useMemo(
    () => ({
      categories,
      addCategory,
      stickersByCategory,
      dialog,
      selectedDayKey,
      setSelectedDayKey,
      selectedSticker,
      setSelectedSticker,
      clearSelection,
      openCreateSticker,
      openEditSticker,
      closeDialog,
      addSticker,
      removeSticker,
      bringStickerToFront,
      updateStickerMeta,
      updateStickerPosition,
      updateStickerRecordedAt,
      updateStickerTransform,
    }),
    [
      categories,
      addCategory,
      stickersByCategory,
      dialog,
      selectedDayKey,
      selectedSticker,
      clearSelection,
      openCreateSticker,
      openEditSticker,
      closeDialog,
      addSticker,
      removeSticker,
      bringStickerToFront,
      updateStickerMeta,
      updateStickerPosition,
      updateStickerRecordedAt,
      updateStickerTransform,
    ],
  );

  return (
    <StickerContext.Provider value={value}>{children}</StickerContext.Provider>
  );
}

export function useStickerStore() {
  const ctx = useContext(StickerContext);
  if (!ctx) {
    throw new Error("useStickerStore must be used within StickerProvider");
  }
  return ctx;
}

export function buildNewStickerItem(
  category: CategoryKey,
  listLength: number,
  fields: {
    src: string;
    rotationDeg: number;
    name: string;
    amount: string;
    calories?: string;
    hero?: string;
    studyDuration?: string;
    recordedAt: string;
  },
): StickerItem {
  const pos = defaultPositionForIndex(listLength);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const mode = getFieldMode(category);
  const base: StickerItem = {
    id,
    src: fields.src,
    rotationDeg: fields.rotationDeg,
    scale: 1,
    x: pos.x,
    y: pos.y,
    zIndex: 0,
    recordedAt: fields.recordedAt,
    name: fields.name.trim(),
    amount: fields.amount.trim(),
  };
  if (mode === "food") {
    return {
      ...base,
      calories: (fields.calories ?? "").trim() || undefined,
    };
  }
  if (mode === "game") {
    return {
      ...base,
      hero: (fields.hero ?? "").trim() || undefined,
    };
  }
  if (mode === "study") {
    return {
      ...base,
      studyDuration: (fields.studyDuration ?? "").trim() || undefined,
    };
  }
  return base;
}
