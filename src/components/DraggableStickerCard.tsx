"use client";

import { usePinch } from "@use-gesture/react";
import { animate, motion, useMotionValue } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { CategoryKey, StickerItem } from "@/types/sticker";
import { useStickerStore } from "@/context/StickerContext";
import {
  findCalendarDayFromPoint,
  snapStickerTopLeftToCalendarCell,
} from "@/lib/calendarHitTest";
import {
  formatRecordedAtLabel,
  replaceLocalCalendarDay,
} from "@/lib/dateUtils";
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

const dragLiftShadow =
  "0 20px 40px rgba(0, 0, 0, 0.2), 0 10px 22px rgba(0, 0, 0, 0.14), 0 4px 8px rgba(0, 0, 0, 0.08)";
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
  const segments = infoBarSegments(category, item);
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      className="pointer-events-auto absolute bottom-2 left-1/2 z-[80] flex max-w-[min(100%,20rem)] -translate-x-1/2 flex-nowrap items-center gap-2 overflow-x-auto rounded-full border border-white/50 bg-white/40 px-3 py-1.5 text-left shadow-md backdrop-blur-md"
      title="点击编辑"
    >
      {segments.map((s) => (
        <span
          key={s.key}
          className="whitespace-nowrap font-[family-name:var(--font-hand)] text-[11px] text-stone-900"
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

  const handleDragEnd = useCallback(async () => {
    const el = cardRef.current;
    const ws = workspaceRef.current;
    if (!el || !ws) {
      setDragging(false);
      updateStickerPosition(category, item.id, mx.get(), my.get());
      return;
    }
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const hit = findCalendarDayFromPoint(cx, cy);

    if (hit) {
      const snap = snapStickerTopLeftToCalendarCell({
        dayKey: hit,
        workspaceEl: ws,
        stickerWidth: r.width,
        stickerHeight: r.height,
      });
      if (snap) {
        await Promise.all([
          animate(mx, snap.x, { duration: 0.22, ease: "easeOut" }),
          animate(my, snap.y, { duration: 0.22, ease: "easeOut" }),
        ]);
        const newIso = replaceLocalCalendarDay(item.recordedAt, hit);
        updateStickerTransform(category, item.id, {
          x: snap.x,
          y: snap.y,
          recordedAt: newIso,
        });
        setDragging(false);
        return;
      }
    }
    updateStickerPosition(category, item.id, mx.get(), my.get());
    setDragging(false);
  }, [
    category,
    item.id,
    item.recordedAt,
    mx,
    my,
    updateStickerPosition,
    updateStickerTransform,
    workspaceRef,
  ]);

  const stackZ = dragging
    ? DRAG_Z_BASE + item.zIndex
    : isSelected
      ? SELECTED_Z_BASE + item.zIndex
      : item.zIndex;

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
        boxShadow: dragging ? dragLiftShadow : "0px 0px 0px rgba(0,0,0,0)",
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
        void handleDragEnd();
      }}
      className={[
        "relative select-none rounded-sm",
        isSelected
          ? "outline outline-1 outline-dashed outline-stone-400 outline-offset-2"
          : "",
      ].join(" ")}
    >
      {isSelected ? (
        <button
          type="button"
          aria-label="删除贴纸"
          className="absolute -left-0 -top-0 z-[70] flex h-6 w-6 items-center justify-center rounded-full border border-stone-600/40 bg-stone-900/80 text-sm leading-none text-white shadow-md hover:bg-red-900/90"
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
        <TornSticker src={item.src} alt={item.name || "贴纸"} className="pb-1 pr-1" />
      </motion.div>
      {isSelected ? (
        <>
          <div
            ref={pinchRef}
            role="presentation"
            className="absolute bottom-1 right-1 z-[75] h-7 w-7 touch-none rounded-full border border-stone-500/50 bg-white/70 shadow backdrop-blur-sm"
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
