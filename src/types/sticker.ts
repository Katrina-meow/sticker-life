/** 稳定 slug：预设如 eat、honor；自定义如 custom-1730xxxx */
export type CategoryKey = string;

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
  /** 金额；游戏模式下展示为「战绩」 */
  amount: string;
  /** 热量（kcal），仅 food 模式 */
  calories?: string;
  /** 王者/和平等：英雄 */
  hero?: string;
  /** 学习分类：时长文案 */
  studyDuration?: string;
};

export type StickerDialogState =
  | {
      mode: "create";
      category: CategoryKey;
      src: string;
      rotationDeg: number;
    }
  | {
      mode: "edit";
      category: CategoryKey;
      id: string;
    };
