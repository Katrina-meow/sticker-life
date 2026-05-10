"use client";

import { useEffect, useMemo, useRef } from "react";
import type { CategoryId } from "@/types/sticker";
import { useStickerStore } from "@/context/StickerContext";
import { dayKeyFromRecordedAt } from "@/lib/dateUtils";
import { CategorySummaryCard } from "@/components/CategorySummaryCard";
import { LifeCalendar } from "@/components/LifeCalendar";
import { ImageStickerUpload, StickerBoard } from "@/components/ImageStickerUpload";

type CategoryWorkspaceProps = {
  category: CategoryId;
};

export function CategoryWorkspace({ category }: CategoryWorkspaceProps) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { stickersByCategory, selectedDayKey, setSelectedDayKey } =
    useStickerStore();
  const raw = stickersByCategory[category];

  useEffect(() => {
    setSelectedDayKey(null);
  }, [category, setSelectedDayKey]);

  const visible = useMemo(() => {
    if (!selectedDayKey) return raw;
    return raw.filter(
      (s) => dayKeyFromRecordedAt(s.recordedAt) === selectedDayKey,
    );
  }, [raw, selectedDayKey]);

  return (
    <div
      ref={workspaceRef}
      className="relative space-y-4 lg:grid lg:grid-cols-[1fr_minmax(0,15.75rem)] lg:items-start lg:gap-4 lg:space-y-0"
    >
      <div className="min-w-0 space-y-4">
        <CategorySummaryCard category={category} stickers={visible} />
        <ImageStickerUpload category={category} />
        <StickerBoard
          category={category}
          workspaceRef={workspaceRef}
        />
      </div>
      <aside className="lg:sticky lg:top-24">
        <LifeCalendar stickers={raw} />
      </aside>
    </div>
  );
}
