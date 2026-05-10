"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { CategoryKey } from "@/types/sticker";
import { useStickerStore } from "@/context/StickerContext";
import { dayKeyFromRecordedAt } from "@/lib/dateUtils";
import { CategorySummaryCard } from "@/components/CategorySummaryCard";
import { ImageStickerUpload, StickerBoard } from "@/components/ImageStickerUpload";

type CategoryWorkspaceProps = {
  categoryId: CategoryKey;
};

export function CategoryWorkspace({ categoryId }: CategoryWorkspaceProps) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const {
    stickersByCategory,
    selectedDayKey,
    setSelectedDayKey,
    categories,
    clearSelection,
  } = useStickerStore();

  const categoryIdSet = useMemo(
    () => new Set(categories.map((c) => c.id)),
    [categories],
  );

  useEffect(() => {
    if (categories.length === 0) return;
    if (!categoryIdSet.has(categoryId)) {
      router.replace(`/c/${categories[0].id}`);
    }
  }, [categoryId, categoryIdSet, categories, router]);

  useEffect(() => {
    setSelectedDayKey(null);
    clearSelection();
  }, [categoryId, setSelectedDayKey, clearSelection]);

  const raw = useMemo(
    () => stickersByCategory[categoryId] ?? [],
    [stickersByCategory, categoryId],
  );

  const visible = useMemo(() => {
    if (!selectedDayKey) return raw;
    return raw.filter(
      (s) => dayKeyFromRecordedAt(s.recordedAt) === selectedDayKey,
    );
  }, [raw, selectedDayKey]);

  return (
    <div ref={workspaceRef} className="relative space-y-4">
      <CategorySummaryCard category={categoryId} stickers={visible} />
      <ImageStickerUpload category={categoryId} />
      <StickerBoard
        category={categoryId}
        workspaceRef={workspaceRef}
      />
    </div>
  );
}
