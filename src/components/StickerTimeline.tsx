"use client";

import { useMemo } from "react";
import type { CategoryKey, StickerItem } from "@/types/sticker";
import { useStickerStore } from "@/context/StickerContext";
import { useUi } from "@/context/UiContext";
import { getFieldMode } from "@/lib/categoryConfig";
import { formatDateDots, formatTimeHM } from "@/lib/dateUtils";
import { TornSticker } from "@/components/TornSticker";
import { IconFood } from "@/components/icons/IconFood";
import { IconGame } from "@/components/icons/IconGame";
import { IconStudy } from "@/components/icons/IconStudy";
import { IconTag } from "@/components/icons/IconTag";

type StickerTimelineProps = {
  category: CategoryKey;
  stickers: StickerItem[];
};

function ModeIcon({ mode }: { mode: ReturnType<typeof getFieldMode> }) {
  const cls = "shrink-0 text-[color:var(--accent-label)] opacity-90";
  if (mode === "food") return <IconFood className={cls} />;
  if (mode === "game") return <IconGame className={cls} />;
  if (mode === "study") return <IconStudy className={cls} />;
  return <IconTag className={cls} />;
}

function TimelineFields({
  category,
  item,
  textOnly,
}: {
  category: CategoryKey;
  item: StickerItem;
  textOnly: boolean;
}) {
  const mode = getFieldMode(category);
  const labelCls = textOnly
    ? "text-sm font-medium text-[color:var(--accent-label)]"
    : "text-sm text-[color:var(--text-primary)]";

  if (mode === "food") {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={labelCls}>{item.name || "未命名"}</span>
        {item.amount ? (
          <span className="text-sm text-[color:var(--text-muted)]">
            {item.amount}
          </span>
        ) : null}
        {item.calories?.trim() ? (
          <span className="text-sm text-[color:var(--accent-label)]">
            {item.calories.trim()} kcal
          </span>
        ) : null}
      </div>
    );
  }
  if (mode === "game") {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={labelCls}>{item.name || "对局"}</span>
        {item.amount ? (
          <span className="text-sm text-[color:var(--accent-label)]">
            战绩 {item.amount}
          </span>
        ) : null}
        {item.hero?.trim() ? (
          <span className="text-sm text-[color:var(--text-muted)]">
            {item.hero}
          </span>
        ) : null}
      </div>
    );
  }
  if (mode === "study") {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={labelCls}>{item.name || "学习"}</span>
        {item.studyDuration?.trim() ? (
          <span className="text-sm text-[color:var(--accent-label)]">
            {item.studyDuration}
          </span>
        ) : null}
        {item.amount ? (
          <span className="text-sm text-[color:var(--text-muted)]">
            {item.amount}
          </span>
        ) : null}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className={labelCls}>{item.name || "未命名"}</span>
      {item.amount ? (
        <span className="text-sm text-[color:var(--text-muted)]">
          {item.amount}
        </span>
      ) : null}
    </div>
  );
}

export function StickerTimeline({ category, stickers }: StickerTimelineProps) {
  const { openEditSticker } = useStickerStore();
  const { theme } = useUi();

  const sorted = useMemo(() => {
    return [...stickers].sort((a, b) => {
      const ta = new Date(a.recordedAt).getTime();
      const tb = new Date(b.recordedAt).getTime();
      return tb - ta;
    });
  }, [stickers]);

  const textOnlyCapsule = theme === "apple" || theme === "dark";

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-[color:var(--text-muted)]">
        还没有贴纸，先上传一张吧。
      </p>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="mb-6 text-xl font-semibold text-[color:var(--text-primary)]">
        时间轴
      </h2>
      <div className="relative pl-3 sm:pl-4">
        <div
          className="absolute bottom-0 left-[7px] top-2 w-px bg-[color:var(--card-border)] sm:left-[9px]"
          aria-hidden
        />
        <ul className="space-y-5">
          {sorted.map((item) => {
            const mode = getFieldMode(category);
            return (
              <li key={item.id} className="relative flex gap-3 sm:gap-4">
                <div className="relative z-[1] flex w-12 shrink-0 flex-col items-center pt-1 sm:w-14">
                  <span
                    className="text-[11px] font-medium tabular-nums text-[color:var(--text-muted)] sm:text-xs"
                    title={formatDateDots(item.recordedAt)}
                  >
                    {formatTimeHM(item.recordedAt)}
                  </span>
                  <span
                    className="mt-1.5 h-2 w-2 rounded-full border-2 border-[color:var(--card-border)] bg-[color:var(--accent)]"
                    aria-hidden
                  />
                </div>
                <button
                  type="button"
                  onClick={() => openEditSticker(category, item.id)}
                  className="elevated-surface min-w-0 flex-1 rounded-[var(--radius-card-lg)] border border-[color:var(--card-border)] bg-[var(--card-bg)] p-3 text-left transition hover:brightness-[1.02] active:scale-[0.99] sm:p-4"
                >
                  <div className="flex gap-3">
                    <div className="shrink-0">
                      <TornSticker
                        src={item.src}
                        alt={item.name || ""}
                        className="scale-90"
                        edgeStyle={theme === "cute" ? "torn" : "cutout"}
                        edgeHighlight={theme === "dark"}
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start gap-2">
                        <ModeIcon mode={mode} />
                        <p className="text-xs font-medium text-[color:var(--text-muted)]">
                          {formatDateDots(item.recordedAt)}
                        </p>
                      </div>
                      <TimelineFields
                        category={category}
                        item={item}
                        textOnly={textOnlyCapsule}
                      />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
