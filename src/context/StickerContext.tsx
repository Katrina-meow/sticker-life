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
import type {
  CategoryId,
  PendingDateChange,
  StickerDialogState,
  StickerItem,
} from "@/types/sticker";
import { loadStickersFromStorage, saveStickersToStorage } from "@/lib/stickerStorage";
import { replaceLocalCalendarDay } from "@/lib/dateUtils";

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

  if (cat === "recipes") {
    return {
      ...s,
      x,
      y,
      name,
      amount,
      recordedAt,
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
  };
}

type StickerContextValue = {
  stickersByCategory: Record<CategoryId, StickerItem[]>;
  dialog: StickerDialogState | null;
  selectedDayKey: string | null;
  setSelectedDayKey: (key: string | null) => void;
  pendingDateChange: PendingDateChange | null;
  requestDateChange: (payload: PendingDateChange) => void;
  cancelPendingDateChange: () => void;
  confirmPendingDateChange: () => void;
  openCreateSticker: (
    category: CategoryId,
    src: string,
    rotationDeg: number,
  ) => void;
  openEditSticker: (category: CategoryId, id: string) => void;
  closeDialog: () => void;
  addSticker: (category: CategoryId, item: StickerItem) => void;
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
};

const StickerContext = createContext<StickerContextValue | null>(null);

export function StickerProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [stickersByCategory, setStickersByCategory] =
    useState<Record<CategoryId, StickerItem[]>>(emptyBuckets);
  const [dialog, setDialog] = useState<StickerDialogState | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [pendingDateChange, setPendingDateChange] =
    useState<PendingDateChange | null>(null);

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

  const openEditSticker = useCallback((category: CategoryId, id: string) => {
    setDialog({ mode: "edit", category, id });
  }, []);

  const closeDialog = useCallback(() => setDialog(null), []);

  const addSticker = useCallback((category: CategoryId, item: StickerItem) => {
    setStickersByCategory((prev) => ({
      ...prev,
      [category]: [item, ...prev[category]],
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

  const requestDateChange = useCallback((payload: PendingDateChange) => {
    setPendingDateChange(payload);
  }, []);

  const cancelPendingDateChange = useCallback(() => {
    setPendingDateChange(null);
  }, []);

  const confirmPendingDateChange = useCallback(() => {
    setPendingDateChange((pending) => {
      if (!pending) return null;
      const { category, id, newDayKey } = pending;
      setStickersByCategory((prev) => ({
        ...prev,
        [category]: prev[category].map((s) => {
          if (s.id !== id) return s;
          return {
            ...s,
            recordedAt: replaceLocalCalendarDay(s.recordedAt, newDayKey),
          };
        }),
      }));
      return null;
    });
  }, []);

  const value = useMemo(
    () => ({
      stickersByCategory,
      dialog,
      selectedDayKey,
      setSelectedDayKey,
      pendingDateChange,
      requestDateChange,
      cancelPendingDateChange,
      confirmPendingDateChange,
      openCreateSticker,
      openEditSticker,
      closeDialog,
      addSticker,
      updateStickerMeta,
      updateStickerPosition,
      updateStickerRecordedAt,
    }),
    [
      stickersByCategory,
      dialog,
      selectedDayKey,
      setSelectedDayKey,
      pendingDateChange,
      openCreateSticker,
      openEditSticker,
      closeDialog,
      addSticker,
      updateStickerMeta,
      updateStickerPosition,
      updateStickerRecordedAt,
      requestDateChange,
      cancelPendingDateChange,
      confirmPendingDateChange,
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
    x: pos.x,
    y: pos.y,
    recordedAt: fields.recordedAt,
    name: fields.name.trim(),
    amount: fields.amount.trim(),
    ...(category === "recipes"
      ? { calories: (fields.calories ?? "").trim() || undefined }
      : {}),
  };
}
