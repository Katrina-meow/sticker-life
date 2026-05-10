"use client";

import type { CategoryKey, StickerItem } from "@/types/sticker";
import { useUi } from "@/context/UiContext";
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
  const { theme } = useUi();
  const mode = getFieldMode(category);
  const totalAmount = sumAmount(stickers);
  const totalKcal = sumCalories(stickers);
  const showKcal = shouldShowCaloriesRow(category);
  const premium = theme === "apple" || theme === "dark";

  const valueCls = premium
    ? "text-2xl font-semibold tabular-nums tracking-tight text-[color:var(--text-primary)]"
    : "font-[family-name:var(--font-hand)] text-2xl text-[color:var(--text-primary)]";

  return (
    <aside
      className={[
        "relative overflow-hidden border border-[color:var(--card-border)] bg-[var(--card-bg)] px-4 py-3",
        premium
          ? "elevated-surface rounded-[var(--radius-card-lg)]"
          : "rounded-lg border-2 shadow-[2px_3px_0_var(--cal-grid)]",
      ].join(" ")}
    >
      {!premium ? (
        <div
          className="pointer-events-none absolute -right-1 -top-1 h-10 w-10 rotate-12 border border-[color:var(--card-border)] bg-[var(--card-accent)]"
          aria-hidden
        />
      ) : null}
      <p
        className={[
          "text-xs text-[color:var(--text-muted)]",
          premium ? "font-medium uppercase tracking-wide" : "",
        ].join(" ")}
      >
        当前视图汇总
        {!premium ? "（纸角随手记）" : null}
      </p>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-8 gap-y-3 border-t border-[color:var(--card-border)] pt-3">
        {mode === "game" ? (
          <div>
            <span className="text-[11px] font-medium text-[color:var(--text-muted)]">
              记录条数
            </span>
            <p className={valueCls}>
              {stickers.length}
              <span className="ml-1 text-base font-normal text-[color:var(--text-muted)]">
                条
              </span>
            </p>
          </div>
        ) : (
          <>
            <div>
              <span className="text-[11px] font-medium text-[color:var(--text-muted)]">
                总金额
              </span>
              <p className={valueCls}>
                {formatMoney(totalAmount)}
                <span className="ml-1 text-base font-normal text-[color:var(--text-muted)]">
                  元
                </span>
              </p>
            </div>
            {showKcal ? (
              <div>
                <span className="text-[11px] font-medium text-[color:var(--text-muted)]">
                  总热量
                </span>
                <p className={valueCls}>
                  {Math.round(totalKcal)}
                  <span className="ml-1 text-base font-normal text-[color:var(--text-muted)]">
                    kcal
                  </span>
                </p>
              </div>
            ) : null}
            {mode === "study" && stickers.length > 0 ? (
              <div>
                <span className="text-[11px] font-medium text-[color:var(--text-muted)]">
                  学习记录
                </span>
                <p className={valueCls}>
                  {stickers.length}
                  <span className="ml-1 text-base font-normal text-[color:var(--text-muted)]">
                    条
                  </span>
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>
      {stickers.length === 0 ? (
        <p className="mt-2 text-xs text-[color:var(--text-muted)]">
          暂无记录可统计
        </p>
      ) : null}
    </aside>
  );
}
