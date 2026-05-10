import type { StickerItem } from "@/types/sticker";

export type CategoryKey = string;

export type CategoryFieldMode = "food" | "game" | "study" | "simple";

export type CategoryEntry = { id: CategoryKey; label: string };

/** 预设分类（顺序即默认导航顺序） */
export const PRESET_CATEGORIES: CategoryEntry[] = [
  { id: "eat", label: "吃饭" },
  { id: "milktea", label: "奶茶/咖啡" },
  { id: "pinch", label: "捏捏" },
  { id: "honor", label: "王者" },
  { id: "peace", label: "和平" },
  { id: "piggie", label: "猪小屁" },
  { id: "supermarket", label: "超市" },
  { id: "study", label: "学习" },
];

export const DEFAULT_CATEGORY_ORDER = PRESET_CATEGORIES.map((c) => c.id);

/** 分类页顶部一句说明（自定义分类无预设文案） */
export const CATEGORY_INTRO: Partial<Record<string, string>> = {
  eat: "把今天想做的菜、便当灵感随手贴在这里。",
  milktea: "奶茶与咖啡，一杯一回甘。",
  pinch: "捏捏解压，随手贴一张。",
  honor: "王者对局记录。",
  peace: "和平精英战绩。",
  piggie: "猪小屁相关收藏。",
  supermarket: "超市买买买随手记。",
  study: "学习时段与笔记。",
};

const FIELD_MODE_BY_PRESET: Record<string, CategoryFieldMode> = {
  eat: "food",
  milktea: "simple",
  pinch: "simple",
  honor: "game",
  peace: "game",
  piggie: "simple",
  supermarket: "simple",
  study: "study",
};

export function isPresetKey(key: string): boolean {
  return key in FIELD_MODE_BY_PRESET;
}

export function getFieldMode(key: CategoryKey): CategoryFieldMode {
  return FIELD_MODE_BY_PRESET[key] ?? "simple";
}

export function defaultCategoriesAndBuckets(): {
  categories: CategoryEntry[];
  stickers: Record<CategoryKey, StickerItem[]>;
} {
  const categories = PRESET_CATEGORIES.map(({ id, label }) => ({ id, label }));
  const stickers = Object.fromEntries(
    PRESET_CATEGORIES.map(({ id }) => [id, []]),
  ) as Record<CategoryKey, StickerItem[]>;
  return { categories, stickers };
}
