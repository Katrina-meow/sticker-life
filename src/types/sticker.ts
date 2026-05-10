export type CategoryId = "recipes" | "fidget" | "grocery";

export type StickerItem = {
  id: string;
  /** data URL，便于 localStorage 持久化 */
  src: string;
  rotationDeg: number;
  /** 双指缩放，默认 1 */
  scale: number;
  x: number;
  y: number;
  /** 层级，越大越靠上 */
  zIndex: number;
  /** ISO 8601，创建或改期时更新 */
  recordedAt: string;
  /** 菜名或物品名称 */
  name: string;
  /** 金额 */
  amount: string;
  /** 热量（kcal），仅今日食谱使用 */
  calories?: string;
};

export type StickerDialogState =
  | {
      mode: "create";
      category: CategoryId;
      src: string;
      rotationDeg: number;
    }
  | {
      mode: "edit";
      category: CategoryId;
      id: string;
    };
