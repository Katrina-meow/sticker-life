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
import type { CategoryId, StickerDialogState, StickerItem } from "@/types/sticker";
import { loadStickersFromStorage, saveStickersToStorage } from "@/lib/stickerStorage";
export type { CategoryId, StickerItem } from "@/types/sticker";

const emptyBuckets = (): Record<CategoryId, StickerItem[]> => ({
  recipes: [],
  fidget: [],
  grocery: [],
});

function defaultPositionForIndex(index: number): { x: number; y: number } {
  const col = index % 5;
  const row = Math.floor(index / 5);
  return { x: 32 + col * 56, y: 32 + row * 72 };
}

function nextGlobalZIndex(buckets: Record<CategoryId, StickerItem[]>): number {
  let m = 0;
  const cats: CategoryId[] = ["recipes", "fidget", "grocery"];
  for (const c of cats) {
    for (const s of buckets[c]) {
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

function migrateSticker(s: StickerItem, cat: CategoryId): StickerItem {
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

  if (cat === "recipes") {
    return {
      ...s,
      x,
      y,
      name,
      amount,
      recordedAt,
      scale,
      zIndex,
      calories: s.calories,
    };
  }
  const { calories: _drop, ...rest } = s;
  return {
    ...rest,
    x,
    y,
    name,
    amount,
    recordedAt,
    scale,
    zIndex,
  };
}

type StickerContextValue = {
  stickersByCategory: Record<CategoryId, StickerItem[]>;
  dialog: StickerDialogState | null;
  selectedDayKey: string | null;
  setSelectedDayKey: (key: string | null) => void;
  openCreateSticker: (
    category: CategoryId,
    src: string,
    rotationDeg: number,
  ) => void;
  openEditSticker: (category: CategoryId, id: string) => void;
  closeDialog: () => void;
  addSticker: (category: CategoryId, item: StickerItem) => void;
  removeSticker: (category: CategoryId, id: string) => void;
  bringStickerToFront: (category: CategoryId, id: string) => void;
  updateStickerMeta: (
    category: CategoryId,
    id: string,
    patch: Partial<Pick<StickerItem, "name" | "amount" | "calories">>,
  ) => void;
  updateStickerPosition: (
    category: CategoryId,
    id: string,
    x: number,
    y: number,
  ) => void;
  updateStickerRecordedAt: (
    category: CategoryId,
    id: string,
    iso: string,
  ) => void;
  updateStickerTransform: (
    category: CategoryId,
    id: string,
    patch: Partial<
      Pick<StickerItem, "x" | "y" | "rotationDeg" | "scale" | "recordedAt">
    >,
  ) => void;
};

const StickerContext = createContext<StickerContextValue | null>(null);

export function StickerProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [stickersByCategory, setStickersByCategory] =
    useState<Record<CategoryId, StickerItem[]>>(emptyBuckets);
  const [dialog, setDialog] = useState<StickerDialogState | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadStickersFromStorage();
    if (loaded) {
      setStickersByCategory({
        recipes: (loaded.recipes ?? []).map((s) => migrateSticker(s, "recipes")),
        fidget: (loaded.fidget ?? []).map((s) => migrateSticker(s, "fidget")),
        grocery: (loaded.grocery ?? []).map((s) =>
          migrateSticker(s, "grocery"),
        ),
      });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveStickersToStorage(stickersByCategory);
  }, [stickersByCategory, hydrated]);

  const openCreateSticker = useCallback(
    (category: CategoryId, src: string, rotationDeg: number) => {
      setDialog({ mode: "create", category, src, rotationDeg });
    },
    [],
  );

  const closeDialog = useCallback(() => setDialog(null), []);

  const bringStickerToFront = useCallback((category: CategoryId, id: string) => {
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
    (category: CategoryId, id: string) => {
      bringStickerToFront(category, id);
      setDialog({ mode: "edit", category, id });
    },
    [bringStickerToFront],
  );

  const addSticker = useCallback((category: CategoryId, item: StickerItem) => {
    setStickersByCategory((prev) => {
      const z = nextGlobalZIndex(prev);
      const normalized: StickerItem = {
        ...item,
        scale: item.scale ?? 1,
        zIndex: z,
      };
      return {
        ...prev,
        [category]: [normalized, ...prev[category]],
      };
    });
  }, []);

  const removeSticker = useCallback((category: CategoryId, id: string) => {
    setStickersByCategory((prev) => ({
      ...prev,
      [category]: prev[category].filter((s) => s.id !== id),
    }));
  }, []);

  const updateStickerMeta = useCallback(
    (
      category: CategoryId,
      id: string,
      patch: Partial<Pick<StickerItem, "name" | "amount" | "calories">>,
    ) => {
      setStickersByCategory((prev) => ({
        ...prev,
        [category]: prev[category].map((s) => {
          if (s.id !== id) return s;
          const merged = { ...s, ...patch };
          if (category !== "recipes") {
            const { calories: _c, ...rest } = merged;
            return rest as StickerItem;
          }
          return merged;
        }),
      }));
    },
    [],
  );

  const updateStickerPosition = useCallback(
    (category: CategoryId, id: string, x: number, y: number) => {
      setStickersByCategory((prev) => ({
        ...prev,
        [category]: prev[category].map((s) =>
          s.id === id ? { ...s, x, y } : s,
        ),
      }));
    },
    [],
  );

  const updateStickerRecordedAt = useCallback(
    (category: CategoryId, id: string, iso: string) => {
      setStickersByCategory((prev) => ({
        ...prev,
        [category]: prev[category].map((s) =>
          s.id === id ? { ...s, recordedAt: iso } : s,
        ),
      }));
    },
    [],
  );

  const updateStickerTransform = useCallback(
    (
      category: CategoryId,
      id: string,
      patch: Partial<
        Pick<StickerItem, "x" | "y" | "rotationDeg" | "scale" | "recordedAt">
      >,
    ) => {
      setStickersByCategory((prev) => ({
        ...prev,
        [category]: prev[category].map((s) =>
          s.id === id ? { ...s, ...patch } : s,
        ),
      }));
    },
    [],
  );

  const value = useMemo(
    () => ({
      stickersByCategory,
      dialog,
      selectedDayKey,
      setSelectedDayKey,
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
      stickersByCategory,
      dialog,
      selectedDayKey,
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
  category: CategoryId,
  listLength: number,
  fields: {
    src: string;
    rotationDeg: number;
    name: string;
    amount: string;
    calories?: string;
    recordedAt: string;
  },
): StickerItem {
  const pos = defaultPositionForIndex(listLength);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
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
    ...(category === "recipes"
      ? { calories: (fields.calories ?? "").trim() || undefined }
      : {}),
  };
}
