/** 本地日历日 YYYY-MM-DD */
export function dayKeyFromRecordedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return dayKeyFromDate(new Date());
  }
  return dayKeyFromDate(d);
}

export function dayKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 标签小字：YYYY-MM-DD HH:mm（本地） */
export function formatRecordedAtLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

/** 保留 timeSource 的本地时分秒，只替换年月日为 dayKey（YYYY-MM-DD） */
export function isoFromDayKeyWithTime(
  dayKey: string,
  timeSource: Date,
): string {
  const d = new Date(timeSource.getTime());
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString();
  }
  const parts = dayKey.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return d.toISOString();
  }
  const [y, m, day] = parts;
  d.setFullYear(y, m - 1, day);
  return d.toISOString();
}

/** 保留本地时分，只替换年月日 */
export function replaceLocalCalendarDay(iso: string, newDayKey: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString();
  }
  const parts = newDayKey.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return d.toISOString();
  }
  const [y, m, day] = parts;
  d.setFullYear(y, m - 1, day);
  return d.toISOString();
}

/** 弹窗用：2026年5月10日 */
export function formatDayKeyChinese(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  if (!y || !m || !d) return dayKey;
  return `${y}年${m}月${d}日`;
}
