"use client";

import { usePinch } from "@use-gesture/react";
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { CategoryId, StickerItem } from "@/types/sticker";
import { useStickerStore } from "@/context/StickerContext";
import {
  findCalendarDayFromPoint,
  snapStickerTopLeftToCalendarCell,
} from "@/lib/calendarHitTest";
import { replaceLocalCalendarDay } from "@/lib/dateUtils";
import { TornSticker } from "@/components/TornSticker";
import { StickerHandLabel } from "@/components/StickerHandLabel";

type DraggableStickerCardProps = {
  category: CategoryId;
  item: StickerItem;
  workspaceRef: RefObject<HTMLDivElement | null>;
};

const LONG_PRESS_MS = 500;
const MOVE_CANCEL_PX = 10;

/** 拖拽时保证盖过所有贴纸（普通 zIndex 为递增整数） */
const DRAG_Z_BASE = 1_000_000;

const dragLiftShadow =
  "0 20px 40px rgba(0, 0, 0, 0.2), 0 10px 22px rgba(0, 0, 0, 0.14), 0 4px 8px rgba(0, 0, 0, 0.08)";
const dragLiftTransition = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const };

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
  } = useStickerStore();
  const [dragging, setDragging] = useState(false);
  const mx = useMotionValue(item.x);
  const my = useMotionValue(item.y);
  const scaleMv = useMotionValue(item.scale);
  const rotateMv = useMotionValue(item.rotationDeg);
  const cardRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStart = useRef({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);
  const pinchBase = useRef({ scale: 1, rotation: 0 });

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  useEffect(() => {
    mx.set(item.x);
    my.set(item.y);
  }, [item.x, item.y, mx, my]);

  useEffect(() => {
    scaleMv.set(item.scale);
    rotateMv.set(item.rotationDeg);
  }, [item.scale, item.rotationDeg, item.id, scaleMv, rotateMv]);

  useEffect(() => () => clearLongPress(), [clearLongPress]);

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

  const onPointerDown = (e: React.PointerEvent) => {
    if (!e.isPrimary) {
      clearLongPress();
      return;
    }
    if (e.button !== 0 && e.pointerType === "mouse") return;
    clearLongPress();
    pointerStart.current = { x: e.clientX, y: e.clientY };
    activePointerId.current = e.pointerId;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== activePointerId.current) return;
      const dx = ev.clientX - pointerStart.current.x;
      const dy = ev.clientY - pointerStart.current.y;
      if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
        clearLongPress();
      }
    };

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== activePointerId.current) return;
      window.removeEventListener("pointermove", onMove);
      clearLongPress();
      activePointerId.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    window.addEventListener("pointercancel", onUp, { once: true });

    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      window.removeEventListener("pointermove", onMove);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
      bringStickerToFront(category, item.id);
      dragControls.start(e);
    }, LONG_PRESS_MS);
  };

  return (
    <motion.div
      ref={cardRef}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.06}
      dragConstraints={workspaceRef}
      onPointerDown={onPointerDown}
      animate={{
        scale: dragging ? 1.1 : 1,
        opacity: dragging ? 0.8 : 1,
        boxShadow: dragging ? dragLiftShadow : "0px 0px 0px rgba(0,0,0,0)",
      }}
      transition={dragLiftTransition}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        x: mx,
        y: my,
        zIndex: dragging ? DRAG_Z_BASE + item.zIndex : item.zIndex,
        cursor: "grab",
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
      className="relative select-none rounded-sm"
    >
      <button
        type="button"
        aria-label="删除贴纸"
        className="absolute -right-0 -top-0 z-[70] flex h-6 w-6 items-center justify-center rounded-full border border-stone-600/40 bg-stone-900/80 text-sm leading-none text-white shadow-md hover:bg-red-900/90"
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
      <motion.div
        ref={pinchRef}
        style={{
          scale: scaleMv,
          rotate: rotateMv,
          transformOrigin: "center center",
        }}
        className="relative inline-block touch-none"
      >
        <TornSticker
          src={item.src}
          alt={item.name || "贴纸"}
          className="pb-10 pr-8"
        >
          <StickerHandLabel
            category={category}
            item={item}
            onEdit={() => openEditSticker(category, item.id)}
          />
        </TornSticker>
      </motion.div>
    </motion.div>
  );
}
