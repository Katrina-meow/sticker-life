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
