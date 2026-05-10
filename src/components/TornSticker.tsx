"use client";

import { useId, type ReactNode } from "react";

type TornStickerProps = {
  src: string;
  rotationDeg: number;
  alt?: string;
  className?: string;
  children?: ReactNode;
};

export function TornSticker({
  src,
  rotationDeg,
  alt = "",
  className = "",
  children,
}: TornStickerProps) {
  const rawId = useId().replace(/:/g, "");
  const filterId = `torn-edge-${rawId}`;

  const layeredFilter = [
    `url(#${filterId})`,
    "drop-shadow(0 0 1px rgb(255 255 255))",
    "drop-shadow(0 0 2px rgb(255 255 255))",
    "drop-shadow(0 0 4px rgb(255 255 255))",
    "drop-shadow(0 0 6px rgb(255 255 255))",
    "drop-shadow(3px 5px 10px rgba(0, 0, 0, 0.2))",
    "drop-shadow(1px 2px 3px rgba(0, 0, 0, 0.12))",
  ].join(" ");

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ transform: `rotate(${rotationDeg}deg)` }}
    >
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
      {/* Blob URLs from removeBackground; use native img */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-52 w-auto max-w-[min(100%,280px)] object-contain select-none"
        style={{ filter: layeredFilter }}
        draggable={false}
      />
      {children}
    </div>
  );
}
