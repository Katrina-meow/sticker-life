"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react";
import type { CategoryId } from "@/types/sticker";
import { useStickerStore } from "@/context/StickerContext";
import { blobToDataUrl } from "@/lib/stickerStorage";
import { dayKeyFromRecordedAt } from "@/lib/dateUtils";
import { DraggableStickerCard } from "@/components/DraggableStickerCard";

function randomRotation(): number {
  return Math.random() * 6 - 3;
}

type ImageStickerUploadProps = {
  category: CategoryId;
};

export function ImageStickerUpload({ category }: ImageStickerUploadProps) {
  const { openCreateSticker } = useStickerStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file || !file.type.startsWith("image/")) return;
      setError(null);
      setBusy(true);
      try {
        const { removeBackground } = await import("@imgly/background-removal");
        const blob = await removeBackground(file, { model: "isnet" });
        const dataUrl = await blobToDataUrl(blob);
        const rotationDeg = randomRotation();
        openCreateSticker(category, dataUrl, rotationDeg);
      } catch (e) {
        console.error(e);
        setError("抠图失败，请换一张图或稍后再试。");
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
        accept="image/*"
        className="hidden"
        onChange={onChange}
        disabled={busy}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex max-w-xs items-center justify-center rounded-lg border-2 border-dashed border-stone-500/50 bg-white/50 px-4 py-3 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-white/80 disabled:cursor-wait disabled:opacity-70"
      >
        {busy ? "正在抠图…" : "上传图片，生成手撕贴纸"}
      </button>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type StickerBoardProps = {
  category: CategoryId;
  workspaceRef: RefObject<HTMLDivElement | null>;
};

export function StickerBoard({ category, workspaceRef }: StickerBoardProps) {
  const { stickersByCategory, selectedDayKey } = useStickerStore();
  const raw = stickersByCategory[category];

  const list = useMemo(() => {
    if (!selectedDayKey) return raw;
    return raw.filter(
      (s) => dayKeyFromRecordedAt(s.recordedAt) === selectedDayKey,
    );
  }, [raw, selectedDayKey]);

  const filterHint =
    selectedDayKey && raw.length > 0 && list.length === 0 ? (
      <p className="text-sm text-amber-900/90">
        选中的这一天还没有记录。可上传新贴纸，或点击日历下方「显示全部日期」。
      </p>
    ) : null;

  return (
    <section className="mt-8">
      <h2 className="mb-4 font-[family-name:var(--font-hand)] text-xl text-stone-700">
        我的贴纸
      </h2>
      {raw.length === 0 ? (
        <p className="text-sm text-stone-600">还没有贴纸，先上传一张吧。</p>
      ) : (
        <>
          {filterHint}
          {list.length === 0 ? null : (
            <div
              className="relative mt-3 min-h-[680px] w-full touch-none rounded-xl border border-dashed border-stone-400/35 bg-white/25 px-2 py-3 shadow-inner"
            >
              {list.map((item) => (
                <DraggableStickerCard
                  key={item.id}
                  category={category}
                  item={item}
                  dragConstraintsRef={workspaceRef}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
