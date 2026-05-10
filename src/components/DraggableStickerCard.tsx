"use client";

import { usePinch } from "@use-gesture/react";
import { motion, useMotionValue } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { CategoryKey, StickerItem } from "@/types/sticker";
import { useStickerStore } from "@/context/StickerContext";
import { useUi } from "@/context/UiContext";
import { formatRecordedAtLabel } from "@/lib/dateUtils";
import { getFieldMode } from "@/lib/categoryConfig";
import { TornSticker } from "@/components/TornSticker";

type DraggableStickerCardProps = {
  category: CategoryKey;
  item: StickerItem;
  workspaceRef: RefObject<HTMLDivElement | null>;
};

/** 拖拽时保证盖过所有贴纸（普通 zIndex 为递增整数） */
const DRAG_Z_BASE = 1_000_000;
const SELECTED_Z_BASE = 900_000;

const dragLiftTransition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

function infoBarSegments(
  category: CategoryKey,
  item: StickerItem,
): { key: string; text: string }[] {
  const mode = getFieldMode(category);
  const time = formatRecordedAtLabel(item.recordedAt);
  const out: { key: string; text: string }[] = [{ key: "t", text: time }];

  if (mode === "food") {
    if (item.amount) out.push({ key: "a", text: item.amount });
    if (item.calories?.trim())
      out.push({ key: "c", text: `${item.calories.trim()} kcal` });
    return out;
  }
  if (mode === "game") {
    if (item.amount) out.push({ key: "score", text: `战绩 ${item.amount}` });
    if (item.hero?.trim()) out.push({ key: "h", text: item.hero.trim() });
    return out;
  }
  if (mode === "study") {
    if (item.name?.trim()) out.push({ key: "n", text: item.name.trim() });
    if (item.studyDuration?.trim())
      out.push({ key: "d", text: item.studyDuration.trim() });
    if (item.amount) out.push({ key: "a", text: item.amount });
    return out;
  }
  if (item.amount) out.push({ key: "a", text: item.amount });
  return out;
}

function StickerSelectedInfoBar({
  category,
  item,
  onEdit,
}: {
  category: CategoryKey;
  item: StickerItem;
  onEdit: () => void;
}) {
  const { theme } = useUi();
  const segments = infoBarSegments(category, item);

  const barClass =
    theme === "apple"
      ? "rounded-lg border border-black/10 bg-white/80 px-3 py-2 backdrop-blur-xl"
      : theme === "cute"
        ? "torn-pill-label border border-amber-400/50 bg-gradient-to-r from-amber-100/95 via-rose-50/88 to-amber-50/90 px-5 py-2 backdrop-blur-sm"
        : "rounded-lg border border-white/18 bg-[rgba(28,28,30,0.88)] px-3 py-2 backdrop-blur-xl";

  const textClass =
    theme === "dark"
      ? "text-white/90"
      : theme === "apple"
        ? "text-[#1D1D1F]"
        : "text-amber-950";

  const fontCls =
    theme === "cute"
      ? "font-[family-name:var(--font-hand)]"
      : "font-sans text-[11px] font-normal";

  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      className={`pointer-events-auto absolute bottom-3 left-1/2 z-[90] flex w-max max-w-[min(92vw,24rem)] -translate-x-1/2 flex-nowrap items-center gap-2 overflow-visible whitespace-nowrap text-left ${barClass}`}
      title="点击编辑"
    >
      {segments.map((s) => (
        <span
          key={s.key}
          className={`shrink-0 whitespace-nowrap ${fontCls} ${textClass}`}
        >
          {s.text}
        </span>
      ))}
    </button>
  );
}

export function DraggableStickerCard({
  category,
  item,
  workspaceRef,
}: DraggableStickerCardProps) {
  const { theme } = useUi();
  const {
    openEditSticker,
    updateStickerPosition,
    updateStickerTransform,
    removeSticker,
    bringStickerToFront,
    selectedSticker,
    setSelectedSticker,
  } = useStickerStore();
  const [dragging, setDragging] = useState(false);
  const mx = useMotionValue(item.x);
  const my = useMotionValue(item.y);
  const scaleMv = useMotionValue(item.scale);
  const rotateMv = useMotionValue(item.rotationDeg);
  const cardRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<HTMLDivElement>(null);
  const pinchBase = useRef({ scale: 1, rotation: 0 });

  const isSelected =
    selectedSticker?.category === category && selectedSticker.id === item.id;

  const selectedOutline = useMemo(() => {
    if (!isSelected) return "";
    if (theme === "cute") {
      return "outline outline-2 outline-dashed outline-amber-600 outline-offset-2";
    }
    /* Apple/Dark：選中邊框在 motion.div className（!border / !shadow-none / !outline-none） */
    return "";
  }, [isSelected, theme]);

  useEffect(() => {
    mx.set(item.x);
    my.set(item.y);
  }, [item.x, item.y, mx, my]);

  useEffect(() => {
    scaleMv.set(item.scale);
    rotateMv.set(item.rotationDeg);
  }, [item.scale, item.rotationDeg, item.id, scaleMv, rotateMv]);

  usePinch(
    ({ offset: [distScale, angleDelta], first, last }) => {
      if (first) {
        pinchBase.current = {
          scale: scaleMv.get(),
          rotation: rotateMv.get(),
        };
        bringStickerToFront(category, item.id);
      }
      const b = pinchBase.current;
      const ns = Math.min(3.5, Math.max(0.35, b.scale * distScale));
      const nr = b.rotation + angleDelta;
      scaleMv.set(ns);
      rotateMv.set(nr);
      if (last) {
        updateStickerTransform(category, item.id, {
          scale: ns,
          rotationDeg: nr,
        });
      }
    },
    {
      target: pinchRef,
      pinch: { scaleBounds: { min: 0.35, max: 3.5 }, rubberband: true },
    },
  );

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    updateStickerPosition(category, item.id, mx.get(), my.get());
  }, [category, item.id, mx, my, updateStickerPosition]);

  const stackZ = dragging
    ? DRAG_Z_BASE + item.zIndex
    : isSelected
      ? SELECTED_Z_BASE + item.zIndex
      : item.zIndex;

  const pinchSurface =
    theme === "dark"
      ? "border-white/35 bg-white/12"
      : theme === "apple"
        ? "border-black/15 bg-white/85"
        : "border-stone-500/50 bg-white/70";

  const deleteBtn =
    theme === "dark"
      ? "border-white/25 bg-zinc-900/90 text-white"
      : "border-stone-600/40 bg-stone-900/80 text-white";

  const premiumSelectedChrome =
    isSelected && (theme === "apple" || theme === "dark");

  return (
    <motion.div
      ref={cardRef}
      data-sticker-card
      drag={isSelected}
      dragMomentum={false}
      dragElastic={0.06}
      dragConstraints={workspaceRef}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedSticker({ category, id: item.id });
        bringStickerToFront(category, item.id);
      }}
      animate={{
        scale: dragging ? 1.1 : 1,
        opacity: dragging ? 0.6 : 1,
      }}
      transition={dragLiftTransition}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        x: mx,
        y: my,
        zIndex: stackZ,
        cursor: isSelected ? "grab" : "pointer",
        touchAction: "manipulation",
      }}
      whileDrag={{
        cursor: "grabbing",
      }}
      onDragStart={() => {
        setDragging(true);
        bringStickerToFront(category, item.id);
      }}
      onDragEnd={() => {
        handleDragEnd();
      }}
      className={[
        "relative box-border select-none touch-no-callout",
        premiumSelectedChrome
          ? "rounded-xl !border-2 !border-white !shadow-none !outline-none"
          : "rounded-sm border-2 border-transparent",
        selectedOutline,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isSelected ? (
        <button
          type="button"
          aria-label="删除贴纸"
          className={`absolute -left-0 -top-0 z-[70] flex h-6 w-6 items-center justify-center rounded-full border text-sm leading-none hover:bg-red-900/90 ${deleteBtn}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (
              typeof window !== "undefined" &&
              window.confirm("确定删除这张贴纸？")
            ) {
              removeSticker(category, item.id);
            }
          }}
        >
          ×
        </button>
      ) : null}
      <motion.div
        style={{
          scale: scaleMv,
          rotate: rotateMv,
          transformOrigin: "center center",
        }}
        className="relative inline-block"
      >
        <TornSticker
          src={item.src}
          alt={item.name || "贴纸"}
          className="pb-1 pr-1"
          edgeStyle={theme === "cute" ? "torn" : "cutout"}
          edgeHighlight={theme === "dark"}
        />
      </motion.div>
      {isSelected ? (
        <>
          <div
            ref={pinchRef}
            role="presentation"
            className={`absolute bottom-1 right-1 z-[75] h-7 w-7 touch-none rounded-full border backdrop-blur-sm ${pinchSurface}`}
            aria-label="双指缩放与旋转"
          />
          <StickerSelectedInfoBar
            category={category}
            item={item}
            onEdit={() => openEditSticker(category, item.id)}
          />
        </>
      ) : null}
    </motion.div>
  );
}
