"use client";

import { useId, type ReactNode } from "react";

export type StickerEdgeStyle = "torn" | "cutout";

type TornStickerProps = {
  src: string;
  alt?: string;
  className?: string;
  children?: ReactNode;
  /** 撕纸齿边（cute） vs 平滑剪贴轮廓 + 实心白边（Apple / Dark） */
  edgeStyle?: StickerEdgeStyle;
  /** 深色画板：白边改为 1px 四向（默认 0.5px） */
  edgeHighlight?: boolean;
};

/** 零 blur：仅上下左右四向，比对角叠层更细；沿透明 Alpha 硬边 */
function hardWhiteCardinalRim(radiusPx: number): string {
  const r = radiusPx;
  return [
    `drop-shadow(${r}px 0 0 #fff)`,
    `drop-shadow(-${r}px 0 0 #fff)`,
    `drop-shadow(0 ${r}px 0 #fff)`,
    `drop-shadow(0 -${r}px 0 #fff)`,
  ].join(" ");
}

/** 轻微浮起：仅位移、blur=0，避免柔边 */
const HARD_DEPTH_SHADOW =
  "drop-shadow(3px 5px 0 rgba(0, 0, 0, 0.14)) drop-shadow(1px 2px 0 rgba(0, 0, 0, 0.08))";

/** 撕边与图像；旋转与缩放由外层 motion 负责 */
export function TornSticker({
  src,
  alt = "",
  className = "",
  children,
  edgeStyle = "torn",
  edgeHighlight = false,
}: TornStickerProps) {
  const rawId = useId().replace(/:/g, "");
  const filterId = `torn-edge-${rawId}`;

  const whiteRim = edgeHighlight
    ? hardWhiteCardinalRim(1)
    : hardWhiteCardinalRim(0.5);

  const layeredFilter =
    edgeStyle === "cutout"
      ? [whiteRim, HARD_DEPTH_SHADOW].join(" ")
      : [`url(#${filterId})`, whiteRim, HARD_DEPTH_SHADOW].join(" ");

  return (
    <div className={`relative inline-block ${className}`}>
      {edgeStyle === "torn" ? (
        <svg width="0" height="0" className="absolute overflow-hidden" aria-hidden>
          <defs>
            <filter
              id={filterId}
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.035"
                numOctaves="3"
                seed="7"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="3.5"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="sticker-img-touch max-h-40 w-auto max-w-[220px] object-contain select-none"
        style={{ filter: layeredFilter }}
        draggable={false}
      />
      {children}
    </div>
  );
}
