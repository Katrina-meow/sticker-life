"use client";

import type { StickerItem } from "@/types/sticker";
import { LifeCalendar } from "@/components/LifeCalendar";

type CalendarOverlayProps = {
  open: boolean;
  onClose: () => void;
  stickers: StickerItem[];
};

export function CalendarOverlay({
  open,
  onClose,
  stickers,
}: CalendarOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-start overflow-y-auto px-3 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-overlay-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-xl"
        aria-label="关闭日历"
        onClick={onClose}
      />
      <div className="relative z-10 mt-4 w-full max-w-md rounded-2xl border border-[color:var(--card-border)] bg-[var(--dialog-surface)] p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2
            id="calendar-overlay-title"
            className="font-[family-name:var(--font-hand)] text-xl text-[color:var(--text-primary)]"
          >
            选择日期
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="touch-no-callout rounded-lg px-3 py-1 text-sm text-[color:var(--text-muted)] hover:bg-[var(--card-accent)]"
            aria-label="关闭"
          >
            完成
          </button>
        </div>
        <p className="mb-3 text-xs text-[color:var(--text-muted)]">
          点选某一天可筛选画板；也可点「显示全部日期」恢复全览。改贴纸日期请在编辑面板中选择记录日期。
        </p>
        <LifeCalendar stickers={stickers} onAfterSelect={onClose} />
      </div>
    </div>
  );
}
