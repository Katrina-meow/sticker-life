/** 从视口坐标命中带 data-calendar-day 的日历格 */
export function findCalendarDayFromPoint(
  clientX: number,
  clientY: number,
): string | null {
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const el of stack) {
    if (el instanceof HTMLElement) {
      const key = el.dataset.calendarDay;
      if (key) return key;
    }
  }
  return null;
}

export function getCalendarDayElement(dayKey: string): HTMLElement | null {
  return document.querySelector(`[data-calendar-day="${CSS.escape(dayKey)}"]`);
}

/**
 * 将贴纸左上角移动到 workspace 坐标系，使贴纸中心对齐日历格中心。
 */
export function snapStickerTopLeftToCalendarCell(args: {
  dayKey: string;
  workspaceEl: HTMLElement;
  stickerWidth: number;
  stickerHeight: number;
}): { x: number; y: number } | null {
  const cell = getCalendarDayElement(args.dayKey);
  if (!cell) return null;
  const wr = args.workspaceEl.getBoundingClientRect();
  const cr = cell.getBoundingClientRect();
  const cx = cr.left + cr.width / 2 - wr.left;
  const cy = cr.top + cr.height / 2 - wr.top;
  return {
    x: cx - args.stickerWidth / 2,
    y: cy - args.stickerHeight / 2,
  };
}
