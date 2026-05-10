import type { CategoryId, StickerItem } from "@/types/sticker";

export const STICKER_STORAGE_KEY = "碎片生活-贴纸-v2";
const LEGACY_STICKER_STORAGE_KEY = "碎片生活-贴纸-v1";

export type PersistedBuckets = Record<CategoryId, StickerItem[]>;

function parseBuckets(raw: string): PersistedBuckets | null {
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

export function loadStickersFromStorage(): PersistedBuckets | null {
  if (typeof window === "undefined") return null;
  try {
    const v2 = window.localStorage.getItem(STICKER_STORAGE_KEY);
    if (v2) return parseBuckets(v2);
    const v1 = window.localStorage.getItem(LEGACY_STICKER_STORAGE_KEY);
    if (v1) return parseBuckets(v1);
    return null;
  } catch {
    return null;
  }
}

export function saveStickersToStorage(buckets: PersistedBuckets): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STICKER_STORAGE_KEY, JSON.stringify(buckets));
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
