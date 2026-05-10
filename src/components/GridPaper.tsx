"use client";

import { shouldDimCanvasGrid, useUi } from "@/context/UiContext";

const GRID_SIZE = 28;

export function GridPaper() {
  const { gridVisible, theme, workspaceView, canvasBackground } = useUi();

  const isCute = theme === "cute";
  const dimForCanvas = shouldDimCanvasGrid(workspaceView, canvasBackground);
  const showSquareGrid = isCute && gridVisible && !dimForCanvas;
  const showDotPattern = isCute && !gridVisible && !dimForCanvas;

  const gridLayer = showSquareGrid
    ? {
        backgroundImage: `
          linear-gradient(var(--grid-line) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
        `,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        backgroundPosition: "-1px -1px",
      }
    : {};

  const patternLayer =
    showDotPattern && !showSquareGrid
      ? {
          backgroundImage: `var(--canvas-pattern), var(--canvas-pattern)`,
          backgroundSize: "var(--canvas-pattern-size)",
          backgroundPosition: "0 0, 7px 7px",
        }
      : {};

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundColor: "var(--canvas-bg)",
        ...gridLayer,
        ...patternLayer,
      }}
    />
  );
}
