"use client";

import { useStickerStore } from "@/context/StickerContext";
import { formatDayKeyChinese } from "@/lib/dateUtils";

export function DateChangeConfirmDialog() {
  const {
    pendingDateChange,
    cancelPendingDateChange,
    confirmPendingDateChange,
  } = useStickerStore();

  if (!pendingDateChange) return null;

  const label = formatDayKeyChinese(pendingDateChange.newDayKey);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="date-change-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-[1px]"
        aria-label="关闭"
        onClick={cancelPendingDateChange}
      />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-stone-400/60 bg-[#fffdf8] p-5 shadow-xl">
        <h2
          id="date-change-title"
          className="font-[family-name:var(--font-hand)] text-xl text-stone-900"
        >
          修改记录日期
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">
          是否将这张贴纸的记录日期改为{" "}
          <span className="font-medium text-amber-900">{label}</span>？
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelPendingDateChange}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={confirmPendingDateChange}
            className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm text-white hover:bg-amber-800"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
