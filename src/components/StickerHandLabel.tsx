"use client";

import type { CategoryId, StickerItem } from "@/types/sticker";
import { formatRecordedAtLabel } from "@/lib/dateUtils";

type StickerHandLabelProps = {
  category: CategoryId;
  item: StickerItem;
  onEdit: () => void;
};

function labelLines(category: CategoryId, item: StickerItem): string[] {
  if (category === "recipes") {
    const k = item.calories?.trim();
    const line2 = k ? `${item.amount} · ${k} kcal` : item.amount;
    return [item.name || "未命名", line2];
  }
  return [item.name || "未命名", item.amount || "—"];
}

export function StickerHandLabel({
  category,
  item,
  onEdit,
}: StickerHandLabelProps) {
  const lines = labelLines(category, item);
  const timeLabel = formatRecordedAtLabel(item.recordedAt);

  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      className="group absolute -bottom-1 -right-1 z-10 max-w-[11rem] cursor-pointer select-none text-left"
      title="点击修改标签"
    >
      <span
        className="block origin-bottom-right rotate-[-2deg] rounded-sm border border-amber-300/50 px-2 py-1.5 shadow-[1px_2px_0_rgba(0,0,0,0.06)] transition group-hover:scale-[1.03] group-active:scale-[0.99]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,248,196,0.92) 0%, rgba(255,236,160,0.75) 45%, rgba(255,250,220,0.55) 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.65), 0 2px 6px rgba(0,0,0,0.12)",
        }}
      >
        <span className="block font-[family-name:var(--font-hand)] text-[13px] leading-snug text-amber-950">
          {lines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </span>
        <span className="mt-0.5 block font-[family-name:var(--font-hand)] text-[10px] leading-tight text-amber-900/75">
          {timeLabel}
        </span>
        <span className="mt-0.5 block text-[10px] text-amber-900/60">
          点击编辑
        </span>
      </span>
    </button>
  );
}
