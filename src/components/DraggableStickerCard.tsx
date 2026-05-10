"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { motion, useMotionValue } from "framer-motion";
import type { CategoryId, StickerItem } from "@/types/sticker";
import { useStickerStore } from "@/context/StickerContext";
import { findCalendarDayFromPoint } from "@/lib/calendarHitTest";
import { dayKeyFromRecordedAt } from "@/lib/dateUtils";
import { TornSticker } from "@/components/TornSticker";
import { StickerHandLabel } from "@/components/StickerHandLabel";

type DraggableStickerCardProps = {
  category: CategoryId;
  item: StickerItem;
  dragConstraintsRef: RefObject<HTMLDivElement | null>;
};

export function DraggableStickerCard({
  category,
  item,
  dragConstraintsRef,
}: DraggableStickerCardProps) {
  const { openEditSticker, updateStickerPosition, requestDateChange } =
    useStickerStore();
  const [dragging, setDragging] = useState(false);
  const mx = useMotionValue(item.x);
  const my = useMotionValue(item.y);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mx.set(item.x);
    my.set(item.y);
  }, [item.x, item.y, mx, my]);

  return (
    <motion.div
      ref={cardRef}
      drag
      dragMomentum={false}
      dragElastic={0.06}
      dragConstraints={dragConstraintsRef}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        x: mx,
        y: my,
        zIndex: dragging ? 50 : 1,
        cursor: "grab",
      }}
      whileDrag={{
        cursor: "grabbing",
        scale: 1.04,
        filter: "drop-shadow(4px 12px 18px rgba(0,0,0,0.22))",
      }}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => {
        setDragging(false);
        updateStickerPosition(category, item.id, mx.get(), my.get());
        const el = cardRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const hit = findCalendarDayFromPoint(cx, cy);
        if (!hit) return;
        const current = dayKeyFromRecordedAt(item.recordedAt);
        if (hit !== current) {
          requestDateChange({ category, id: item.id, newDayKey: hit });
        }
      }}
      className="touch-none"
    >
      <TornSticker
        src={item.src}
        rotationDeg={item.rotationDeg}
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
  );
}
