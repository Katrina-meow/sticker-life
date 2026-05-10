"use client";

import { useMemo, useState } from "react";
import type { StickerItem } from "@/types/sticker";
import { dayKeyFromDate, dayKeyFromRecordedAt } from "@/lib/dateUtils";
import { useStickerStore } from "@/context/StickerContext";

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

type LifeCalendarProps = {
  stickers: StickerItem[];
  /** 选日或「显示全部」后回调（用于关闭 Overlay） */
  onAfterSelect?: () => void;
};

function monthMatrix(year: number, monthIndex: number): (number | null)[] {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function LifeCalendar({ stickers, onAfterSelect }: LifeCalendarProps) {
  const { selectedDayKey, setSelectedDayKey } = useStickerStore();
  const [cursor, setCursor] = useState(() => new Date());

  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();
  const cells = useMemo(
    () => monthMatrix(year, monthIndex),
    [year, monthIndex],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, StickerItem[]>();
    for (const s of stickers) {
      const key = dayKeyFromRecordedAt(s.recordedAt);
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [stickers]);

  const title = `${year}年${monthIndex + 1}月`;

  const prevMonth = () => {
    setCursor(new Date(year, monthIndex - 1, 1));
  };
  const nextMonth = () => {
    setCursor(new Date(year, monthIndex + 1, 1));
  };

  const pickDay = (dayKey: string) => {
    setSelectedDayKey(dayKey);
    onAfterSelect?.();
  };

  const showAll = () => {
    setSelectedDayKey(null);
    onAfterSelect?.();
  };

  return (
    <div className="rounded-lg border-2 border-[color:var(--card-border)] bg-[var(--card-bg)] p-2 shadow-[inset_0_0_0_1px_var(--cal-grid)]">
      <div className="flex items-center justify-between border-b border-[color:var(--cal-grid)] pb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="touch-no-callout rounded px-2 py-0.5 text-sm text-[color:var(--text-primary)] hover:bg-[var(--card-accent)]"
          aria-label="上一月"
        >
          ‹
        </button>
        <span className="font-[family-name:var(--font-hand)] text-lg text-[color:var(--text-primary)]">
          {title}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="touch-no-callout rounded px-2 py-0.5 text-sm text-[color:var(--text-primary)] hover:bg-[var(--card-accent)]"
          aria-label="下一月"
        >
          ›
        </button>
      </div>
      <p className="mt-1 text-center text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">
        月计划表
      </p>

      <div
        className="mt-2 grid grid-cols-7 gap-px p-px"
        style={{ backgroundColor: "var(--cal-grid)" }}
      >
        {WEEK_LABELS.map((w) => (
          <div
            key={w}
            className="py-1 text-center text-[10px] font-medium text-[color:var(--text-muted)]"
            style={{ backgroundColor: "var(--cal-cell-empty)" }}
          >
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day == null) {
            return (
              <div
                key={`e-${i}`}
                className="min-h-[4.5rem]"
                style={{ backgroundColor: "var(--cal-cell-empty)" }}
              />
            );
          }
          const dayKey = dayKeyFromDate(new Date(year, monthIndex, day));
          const dayStickers = byDay.get(dayKey) ?? [];
          const selected = selectedDayKey === dayKey;
          const preview = dayStickers.slice(0, 3);
          const more = dayStickers.length - preview.length;

          return (
            <button
              key={dayKey}
              type="button"
              data-calendar-day={dayKey}
              onClick={() => pickDay(dayKey)}
              className={[
                "touch-no-callout flex min-h-[4.5rem] flex-col items-stretch border border-transparent p-0.5 text-left transition",
                selected
                  ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--dialog-surface)]"
                  : "hover:brightness-[1.02]",
              ].join(" ")}
              style={{ backgroundColor: "var(--cal-cell-bg)" }}
            >
              <span className="font-[family-name:var(--font-hand)] text-sm leading-none text-[color:var(--text-primary)]">
                {day}
              </span>
              <div className="mt-auto flex flex-1 flex-wrap content-end justify-start gap-0.5">
                {preview.map((s) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={s.id}
                    src={s.src}
                    alt=""
                    className="h-5 w-5 rounded-sm border border-[color:var(--input-border)] object-cover shadow-sm"
                    draggable={false}
                  />
                ))}
                {more > 0 ? (
                  <span className="self-center text-[9px] text-[color:var(--text-muted)]">
                    +{more}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={showAll}
        className="touch-no-callout mt-2 w-full rounded border border-dashed border-[color:var(--input-border)] bg-[var(--board-bg)] py-1.5 text-xs text-[color:var(--text-primary)] hover:brightness-110"
      >
        显示全部日期
      </button>
    </div>
  );
}
