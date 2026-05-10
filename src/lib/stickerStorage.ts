import type { CategoryKey, StickerItem } from "@/types/sticker";
import {
  PRESET_CATEGORIES,
  type CategoryEntry,
} from "@/lib/categoryConfig";

export const APP_DATA_STORAGE_KEY_V3 = "碎片生活-数据-v3";
export const STICKER_STORAGE_KEY = "碎片生活-贴纸-v2";
const LEGACY_STICKER_STORAGE_KEY = "碎片生活-贴纸-v1";

export type AppDataV3 = {
  categories: CategoryEntry[];
  stickers: Record<CategoryKey, StickerItem[]>;
};

/** v2 桶结构（迁移用） */
export type PersistedBucketsV2 = {
  recipes: StickerItem[];
  fidget: StickerItem[];
  grocery: StickerItem[];
};

function parseV2Buckets(raw: string): PersistedBucketsV2 | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    return {
      recipes: Array.isArray(o.recipes) ? (o.recipes as StickerItem[]) : [],
      fidget: Array.isArray(o.fidget) ? (o.fidget as StickerItem[]) : [],
      grocery: Array.isArray(o.grocery) ? (o.grocery as StickerItem[]) : [],
    };
  } catch {
    return null;
  }
}

function emptyStickersForPresets(): Record<CategoryKey, StickerItem[]> {
  return Object.fromEntries(
    PRESET_CATEGORIES.map(({ id }) => [id, []]),
  ) as Record<CategoryKey, StickerItem[]>;
}

function migrateV2ToV3(v2: PersistedBucketsV2): AppDataV3 {
  const categories = PRESET_CATEGORIES.map(({ id, label }) => ({ id, label }));
  const stickers = emptyStickersForPresets();
  stickers.eat = v2.recipes ?? [];
  stickers.pinch = v2.fidget ?? [];
  stickers.supermarket = v2.grocery ?? [];
  return { categories, stickers };
}

function parseAppDataV3(raw: string): AppDataV3 | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    if (!Array.isArray(o.categories) || typeof o.stickers !== "object")
      return null;
    const categories = o.categories as CategoryEntry[];
    const stickers = o.stickers as Record<CategoryKey, StickerItem[]>;
    return { categories, stickers };
  } catch {
    return null;
  }
}

/**
 * 兼容旧版 API：仅读取 `碎片生活-贴纸-v2` / v1 三桶结构。
 * 新代码请使用 {@link loadAppData}。
 */
export function loadStickersFromStorage(): PersistedBucketsV2 | null {
  return loadStickersV2FromStorage();
}

/**
 * 兼容旧版 API：仅写入 v2 三桶键（不更新 v3）。
 * 新代码请使用 {@link saveAppData}。
 */
export function saveStickersToStorage(buckets: PersistedBucketsV2): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STICKER_STORAGE_KEY, JSON.stringify(buckets));
  } catch (e) {
    console.warn("无法写入本地存储（可能超出配额）", e);
  }
}

/** 读取 v2/v1 原始桶（不写入） */
export function loadStickersV2FromStorage(): PersistedBucketsV2 | null {
  if (typeof window === "undefined") return null;
  try {
    const v2 = window.localStorage.getItem(STICKER_STORAGE_KEY);
    if (v2) return parseV2Buckets(v2);
    const v1 = window.localStorage.getItem(LEGACY_STICKER_STORAGE_KEY);
    if (v1) return parseV2Buckets(v1);
    return null;
  } catch {
    return null;
  }
}

export function loadAppData(): AppDataV3 | null {
  if (typeof window === "undefined") return null;
  try {
    const v3raw = window.localStorage.getItem(APP_DATA_STORAGE_KEY_V3);
    if (v3raw) {
      const data = parseAppDataV3(v3raw);
      if (data) return data;
    }
    const v2 = loadStickersV2FromStorage();
    if (v2) return migrateV2ToV3(v2);
    return null;
  } catch {
    return null;
  }
}

export function saveAppData(data: AppDataV3): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      APP_DATA_STORAGE_KEY_V3,
      JSON.stringify(data),
    );
    try {
      window.localStorage.removeItem(STICKER_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STICKER_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  } catch (e) {
    console.warn("无法写入本地存储（可能超出配额）", e);
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("读取失败"));
    reader.readAsDataURL(blob);
  });
}
