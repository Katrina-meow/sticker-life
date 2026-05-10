"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
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
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      style={{
        minHeight: "100dvh",
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-overlay-title"
    >
      {/* 全屏毛玻璃遮罩：点击关闭 */}
      <button
        type="button"
        className="absolute inset-0 border-0 bg-black/30"
        style={{
          backdropFilter: "blur(var(--glass-blur))",
          WebkitBackdropFilter: "blur(var(--glass-blur))",
        }}
        aria-label="关闭日历"
        onClick={onClose}
      />
      {/* 日历卡片：毛玻璃面板 + 居中 */}
      <div
        className="pointer-events-auto elevated-surface relative z-10 flex max-h-[min(90dvh,44rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[color:var(--card-border)] shadow-2xl"
        style={{
          background: "var(--dialog-glass-bg)",
          backdropFilter: "blur(var(--glass-blur))",
          WebkitBackdropFilter: "blur(var(--glass-blur))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-[color:var(--dialog-header-border)] p-4">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="calendar-overlay-title"
              className="text-xl font-semibold text-[color:var(--text-primary)]"
            >
              选择日期
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="touch-no-callout rounded-lg px-3 py-1.5 text-sm font-medium text-[color:var(--accent)] hover:bg-[var(--card-accent)]"
              aria-label="完成并关闭"
            >
              完成
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[color:var(--text-muted)]">
            点选某一天可筛选画板；也可点「显示全部日期」恢复全览。改贴纸日期请在编辑面板中选择记录日期。
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 pb-4">
          <LifeCalendar stickers={stickers} onAfterSelect={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
