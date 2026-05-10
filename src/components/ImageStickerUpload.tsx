"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react";
import type { CategoryKey } from "@/types/sticker";
import { useStickerStore } from "@/context/StickerContext";
import { dayKeyFromRecordedAt } from "@/lib/dateUtils";
import { processStickerImage } from "@/lib/processStickerImage";
import { DraggableStickerCard } from "@/components/DraggableStickerCard";

function randomRotation(): number {
  return Math.random() * 6 - 3;
}

function isImageLikeFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const n = file.name.toLowerCase();
  return n.endsWith(".heic") || n.endsWith(".heif");
}

type ImageStickerUploadProps = {
  category: CategoryKey;
};

export function ImageStickerUpload({ category }: ImageStickerUploadProps) {
  const { openCreateSticker } = useStickerStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [fallbackHint, setFallbackHint] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file || !isImageLikeFile(file)) return;
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
      setFallbackHint(false);
      setBusy(true);
      try {
        const { dataUrl, usedFallback } = await processStickerImage(file);
        const rotationDeg = randomRotation();
        openCreateSticker(category, dataUrl, rotationDeg);
        if (usedFallback) {
          setFallbackHint(true);
          hintTimerRef.current = setTimeout(() => setFallbackHint(false), 6000);
        }
      } catch (e) {
        console.error(e);
        try {
          const { blobToDataUrl } = await import("@/lib/stickerStorage");
          const dataUrl = await blobToDataUrl(file);
          openCreateSticker(category, dataUrl, randomRotation());
        } catch {
          /* ignore */
        }
        setFallbackHint(true);
        hintTimerRef.current = setTimeout(() => setFallbackHint(false), 6000);
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [openCreateSticker, category],
  );

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    void onFile(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={onChange}
        disabled={busy}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex max-w-xs items-center justify-center rounded-lg border-2 border-dashed border-[color:var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm font-medium text-[color:var(--text-primary)] shadow-sm transition hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
      >
        {busy ? "AI 正在抠图中…" : "上传图片，生成手撕贴纸"}
      </button>
      {fallbackHint ? (
        <p className="max-w-md rounded-lg border border-[color:var(--card-border)] bg-[var(--card-accent)] px-3 py-2 text-sm text-[color:var(--text-primary)]">
          由于性能限制，已为您生成原图贴纸。
        </p>
      ) : null}
    </div>
  );
}

type StickerBoardProps = {
  category: CategoryKey;
  workspaceRef: RefObject<HTMLDivElement | null>;
};

export function StickerBoard({ category, workspaceRef }: StickerBoardProps) {
  const { stickersByCategory, selectedDayKey, clearSelection } =
    useStickerStore();
  const raw = useMemo(
    () => stickersByCategory[category] ?? [],
    [stickersByCategory, category],
  );

  const list = useMemo(() => {
    if (!selectedDayKey) return raw;
    return raw.filter(
      (s) => dayKeyFromRecordedAt(s.recordedAt) === selectedDayKey,
    );
  }, [raw, selectedDayKey]);

  const filterHint =
    selectedDayKey && raw.length > 0 && list.length === 0 ? (
      <p className="text-sm text-[color:var(--text-primary)]">
        选中的这一天还没有记录。可上传新贴纸，或打开顶部导航「日历」选择其它日期或「显示全部日期」。
      </p>
    ) : null;

  return (
    <section className="mt-8">
      <h2 className="mb-4 font-[family-name:var(--font-hand)] text-xl text-[color:var(--text-primary)]">
        我的贴纸
      </h2>
      {raw.length === 0 ? (
        <p className="text-sm text-[color:var(--text-muted)]">
          还没有贴纸，先上传一张吧。
        </p>
      ) : (
        <>
          {filterHint}
          {list.length === 0 ? null : (
            <div
              className="relative mt-3 min-h-[min(680px,calc(100vh-12rem))] w-full rounded-xl border border-dashed border-[color:var(--board-border)] bg-[var(--board-bg)] px-2 py-3 shadow-inner touch-no-callout"
              onPointerDown={(e) => {
                const t = e.target as HTMLElement;
                if (!t.closest("[data-sticker-card]")) clearSelection();
              }}
            >
              {list.map((item) => (
                <DraggableStickerCard
                  key={item.id}
                  category={category}
                  item={item}
                  workspaceRef={workspaceRef}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
