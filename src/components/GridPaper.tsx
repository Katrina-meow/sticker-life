"use client";

import { useUi } from "@/context/UiContext";

const GRID_SIZE = 28;

export function GridPaper() {
  const { gridVisible } = useUi();

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundColor: "var(--canvas-bg)",
        ...(gridVisible
          ? {
              backgroundImage: `
          linear-gradient(var(--grid-line) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
        `,
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
              backgroundPosition: "-1px -1px",
            }
          : {}),
      }}
    />
  );
}
