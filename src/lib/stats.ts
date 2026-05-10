import type { CategoryKey, StickerItem } from "@/types/sticker";
import { getFieldMode } from "@/lib/categoryConfig";

/** 从「18 元」「¥12.5」等字符串中提取首个数字 */
export function parseAmount(amountStr: string): number {
  const normalized = amountStr.replace(/,/g, "").trim();
  const match = normalized.match(/[\d.]+/);
  if (!match) return 0;
  const n = parseFloat(match[0]);
  return Number.isFinite(n) ? n : 0;
}

export function parseCalories(cal?: string): number {
  if (!cal) return 0;
  const n = parseInt(cal.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export function sumAmount(stickers: StickerItem[]): number {
  return stickers.reduce((acc, s) => acc + parseAmount(s.amount), 0);
}

export function sumCalories(stickers: StickerItem[]): number {
  return stickers.reduce((acc, s) => acc + parseCalories(s.calories), 0);
}

export function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function shouldShowCaloriesRow(category: CategoryKey): boolean {
  return getFieldMode(category) === "food";
}
