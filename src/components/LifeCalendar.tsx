"use client";

import { useMemo, useState } from "react";
import type { StickerItem } from "@/types/sticker";
import { dayKeyFromDate, dayKeyFromRecordedAt } from "@/lib/dateUtils";
import { useStickerStore } from "@/context/StickerContext";

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

type LifeCalendarProps = {
  stickers: StickerItem[];
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

export function LifeCalendar({ stickers }: LifeCalendarProps) {
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

  return (
    <div className="rounded-lg border-[3px] border-double border-amber-900/35 bg-[#faf6e8]/95 p-2 shadow-[inset_0_0_0_1px_rgba(120,90,40,0.12)]">
      <div className="flex items-center justify-between border-b border-amber-900/20 pb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded px-2 py-0.5 text-sm text-stone-700 hover:bg-amber-100/80"
          aria-label="上一月"
        >
          ‹
        </button>
        <span className="font-[family-name:var(--font-hand)] text-lg text-amber-950">
          {title}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded px-2 py-0.5 text-sm text-stone-700 hover:bg-amber-100/80"
          aria-label="下一月"
        >
          ›
        </button>
      </div>
      <p className="mt-1 text-center text-[10px] uppercase tracking-widest text-stone-500">
        月计划表
      </p>

      <div className="mt-2 grid grid-cols-7 gap-px bg-amber-900/20 p-px">
        {WEEK_LABELS.map((w) => (
          <div
            key={w}
            className="bg-[#f4ecd8] py-1 text-center text-[10px] font-medium text-stone-600"
          >
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day == null) {
            return (
              <div
                key={`e-${i}`}
                className="min-h-[4.5rem] bg-[#f4ecd8]/50"
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
              onClick={() => setSelectedDayKey(dayKey)}
              className={[
                "flex min-h-[4.5rem] flex-col items-stretch border border-transparent bg-[#fffef8] p-0.5 text-left transition hover:bg-amber-50/90",
                selected ? "ring-2 ring-amber-600 ring-offset-1" : "",
              ].join(" ")}
            >
              <span className="font-[family-name:var(--font-hand)] text-sm leading-none text-stone-800">
                {day}
              </span>
              <div className="mt-auto flex flex-1 flex-wrap content-end justify-start gap-0.5">
                {preview.map((s) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={s.id}
                    src={s.src}
                    alt=""
                    className="h-5 w-5 rounded-sm border border-amber-200/60 object-cover shadow-sm"
                    draggable={false}
                  />
                ))}
                {more > 0 ? (
                  <span className="self-center text-[9px] text-stone-500">
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
        onClick={() => setSelectedDayKey(null)}
        className="mt-2 w-full rounded border border-dashed border-stone-400/70 bg-white/50 py-1.5 text-xs text-stone-700 hover:bg-white/80"
      >
        显示全部日期
      </button>
    </div>
  );
}
