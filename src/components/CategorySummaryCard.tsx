"use client";

import type { CategoryKey, StickerItem } from "@/types/sticker";
import { getFieldMode } from "@/lib/categoryConfig";
import {
  formatMoney,
  shouldShowCaloriesRow,
  sumAmount,
  sumCalories,
} from "@/lib/stats";

type CategorySummaryCardProps = {
  category: CategoryKey;
  stickers: StickerItem[];
};

export function CategorySummaryCard({
  category,
  stickers,
}: CategorySummaryCardProps) {
  const mode = getFieldMode(category);
  const totalAmount = sumAmount(stickers);
  const totalKcal = sumCalories(stickers);
  const showKcal = shouldShowCaloriesRow(category);

  return (
    <aside className="relative overflow-hidden rounded-lg border-2 border-[color:var(--card-border)] bg-[var(--card-bg)] px-4 py-3 shadow-[2px_3px_0_var(--cal-grid)]">
      <div
        className="pointer-events-none absolute -right-1 -top-1 h-10 w-10 rotate-12 border border-[color:var(--card-border)] bg-[var(--card-accent)]"
        aria-hidden
      />
      <p className="text-xs text-[color:var(--text-muted)]">
        当前视图汇总（纸角随手记）
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        {mode === "game" ? (
          <div>
            <span className="text-xs text-[color:var(--text-muted)]">记录条数</span>
            <p className="font-[family-name:var(--font-hand)] text-2xl text-[color:var(--text-primary)]">
              {stickers.length}
              <span className="ml-1 text-base text-[color:var(--text-muted)]">条</span>
            </p>
          </div>
        ) : (
          <>
            <div>
              <span className="text-xs text-[color:var(--text-muted)]">总金额</span>
              <p className="font-[family-name:var(--font-hand)] text-2xl text-[color:var(--text-primary)]">
                {formatMoney(totalAmount)}
                <span className="ml-1 text-base text-[color:var(--text-muted)]">元</span>
              </p>
            </div>
            {showKcal ? (
              <div>
                <span className="text-xs text-[color:var(--text-muted)]">总热量</span>
                <p className="font-[family-name:var(--font-hand)] text-2xl text-[color:var(--text-primary)]">
                  {Math.round(totalKcal)}
                  <span className="ml-1 text-base text-[color:var(--text-muted)]">kcal</span>
                </p>
              </div>
            ) : null}
            {mode === "study" && stickers.length > 0 ? (
              <div>
                <span className="text-xs text-[color:var(--text-muted)]">学习记录</span>
                <p className="font-[family-name:var(--font-hand)] text-xl text-[color:var(--text-primary)]">
                  {stickers.length}
                  <span className="ml-1 text-base text-[color:var(--text-muted)]">条</span>
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>
      {stickers.length === 0 ? (
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">暂无记录可统计</p>
      ) : null}
    </aside>
  );
}
