"use client";

import type { CategoryId, StickerItem } from "@/types/sticker";
import {
  formatMoney,
  shouldShowCaloriesRow,
  sumAmount,
  sumCalories,
} from "@/lib/stats";

type CategorySummaryCardProps = {
  category: CategoryId;
  stickers: StickerItem[];
};

export function CategorySummaryCard({
  category,
  stickers,
}: CategorySummaryCardProps) {
  const totalAmount = sumAmount(stickers);
  const totalKcal = sumCalories(stickers);
  const showKcal = shouldShowCaloriesRow(category);

  return (
    <aside className="relative overflow-hidden rounded-lg border-2 border-amber-900/25 bg-[#fffbeb]/95 px-4 py-3 shadow-[2px_3px_0_rgba(0,0,0,0.06)]">
      <div className="pointer-events-none absolute -right-1 -top-1 h-10 w-10 rotate-12 border border-amber-800/15 bg-amber-100/40" />
      <p className="text-xs text-stone-600">当前视图汇总（纸角随手记）</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <div>
          <span className="text-xs text-stone-500">总金额</span>
          <p className="font-[family-name:var(--font-hand)] text-2xl text-amber-950">
            {formatMoney(totalAmount)}
            <span className="ml-1 text-base text-stone-600">元</span>
          </p>
        </div>
        {showKcal ? (
          <div>
            <span className="text-xs text-stone-500">总热量</span>
            <p className="font-[family-name:var(--font-hand)] text-2xl text-amber-950">
              {Math.round(totalKcal)}
              <span className="ml-1 text-base text-stone-600">kcal</span>
            </p>
          </div>
        ) : null}
      </div>
      {stickers.length === 0 ? (
        <p className="mt-1 text-xs text-stone-500">暂无记录可统计</p>
      ) : null}
    </aside>
  );
}
