"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { AppTheme } from "@/context/UiContext";
import { useUi } from "@/context/UiContext";
import { useStickerStore } from "@/context/StickerContext";
import { CalendarOverlay } from "@/components/CalendarOverlay";
import { IconCalendar } from "@/components/icons/IconCalendar";
import { IconCanvas } from "@/components/icons/IconCanvas";
import { IconGrid } from "@/components/icons/IconGrid";
import { IconTimeline } from "@/components/icons/IconTimeline";

const navScrollClass =
  "flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x touch-no-callout [&::-webkit-scrollbar]:hidden";

const iconBtnBase =
  "shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--nav-pill-idle-border)] bg-[var(--nav-pill-idle-bg)] text-[color:var(--text-primary)] hover:brightness-105";

export function CategoryNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { categories, addCategory, stickersByCategory } = useStickerStore();
  const {
    theme,
    setTheme,
    gridVisible,
    setGridVisible,
    workspaceView,
    setWorkspaceView,
  } = useUi();
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const categoryId = useMemo(() => {
    const m = pathname.match(/^\/c\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  const calendarStickers = useMemo(
    () => (categoryId ? stickersByCategory[categoryId] ?? [] : []),
    [categoryId, stickersByCategory],
  );

  const onConfirmAdd = useCallback(() => {
    const label = newLabel.trim();
    if (!label) {
      setAdding(false);
      return;
    }
    const id = addCategory(label);
    setNewLabel("");
    setAdding(false);
    router.push(`/c/${id}`);
  }, [addCategory, newLabel, router]);

  const themeDots: { id: AppTheme; label: string; className: string }[] = [
    {
      id: "apple",
      label: "苹果模式",
      className: "bg-[#f5f5f7] ring-1 ring-black/15",
    },
    {
      id: "cute",
      label: "可爱模式",
      className: "bg-[#ffd6e8] ring-1 ring-pink-400/50",
    },
    {
      id: "dark",
      label: "深色模式",
      className: "bg-[#1c1c1e] ring-1 ring-white/25",
    },
  ];

  return (
    <>
      <nav className={navScrollClass} aria-label="分类与工具">
        {categories.map(({ id, label }) => {
          const href = `/c/${id}`;
          const active = pathname === href;
          return (
            <Link
              key={id}
              href={href}
              className={[
                "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
                active
                  ? "shadow-sm border-[color:var(--nav-pill-active-border)] bg-[var(--nav-pill-active-bg)] text-[color:var(--nav-pill-active-text)]"
                  : "border-[color:var(--nav-pill-idle-border)] bg-[var(--nav-pill-idle-bg)] text-[color:var(--text-primary)] hover:brightness-105",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="shrink-0 rounded-full border border-dashed border-[color:var(--nav-pill-idle-border)] bg-[var(--nav-pill-idle-bg)] px-3 py-1.5 text-sm text-[color:var(--text-primary)] hover:brightness-105"
          aria-label="添加分类"
        >
          ＋
        </button>

        <span
          className="mx-1 shrink-0 self-center text-[color:var(--text-muted)]"
          aria-hidden
        >
          |
        </span>

        <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label="风格">
          {themeDots.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setTheme(d.id)}
              aria-label={d.label}
              aria-pressed={theme === d.id}
              className={[
                "h-6 w-6 shrink-0 rounded-full transition",
                d.className,
                theme === d.id
                  ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--header-bg)]"
                  : "",
              ].join(" ")}
            />
          ))}
        </div>

        <div className="flex shrink-0 gap-1" role="group" aria-label="视图">
          <button
            type="button"
            onClick={() => setWorkspaceView("timeline")}
            aria-label="时间轴视图"
            aria-pressed={workspaceView === "timeline"}
            className={[
              iconBtnBase,
              workspaceView === "timeline"
                ? "border-[color:var(--nav-pill-active-border)] bg-[var(--nav-pill-active-bg)] text-[color:var(--nav-pill-active-text)]"
                : "",
            ].join(" ")}
          >
            <IconTimeline className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceView("canvas")}
            aria-label="画板视图"
            aria-pressed={workspaceView === "canvas"}
            className={[
              iconBtnBase,
              workspaceView === "canvas"
                ? "border-[color:var(--nav-pill-active-border)] bg-[var(--nav-pill-active-bg)] text-[color:var(--nav-pill-active-text)]"
                : "",
            ].join(" ")}
          >
            <IconCanvas className="h-[18px] w-[18px]" />
          </button>
        </div>

        {theme === "cute" ? (
          <button
            type="button"
            onClick={() => setGridVisible(!gridVisible)}
            aria-pressed={gridVisible}
            aria-label={gridVisible ? "隐藏背景网格" : "显示背景网格"}
            className={[
              iconBtnBase,
              gridVisible
                ? "border-[color:var(--nav-pill-active-border)] bg-[var(--nav-pill-active-bg)]"
                : "",
            ].join(" ")}
          >
            <IconGrid className="h-[18px] w-[18px]" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          aria-label="打开日历"
          className={iconBtnBase}
        >
          <IconCalendar className="h-[18px] w-[18px]" />
        </button>
      </nav>

      <CalendarOverlay
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        stickers={calendarStickers}
      />

      {adding ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-cat-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-[1px]"
            aria-label="关闭"
            onClick={() => {
              setAdding(false);
              setNewLabel("");
            }}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-[color:var(--card-border)] bg-[var(--dialog-surface)] p-5 shadow-lg">
            <h2
              id="add-cat-title"
              className="text-xl font-semibold text-[color:var(--text-primary)]"
            >
              新建分类
            </h2>
            <label className="mt-3 block text-sm text-[color:var(--text-muted)]">
              名称
              <input
                autoFocus
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onConfirmAdd();
                  }
                }}
                className="mt-1 w-full rounded-lg border border-[color:var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[color:var(--text-primary)] outline-none ring-[var(--accent)]/30 focus:ring-2"
                placeholder="例如：健身"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setNewLabel("");
                }}
                className="rounded-lg border border-[color:var(--input-border)] bg-[var(--input-bg)] px-3 py-1.5 text-sm text-[color:var(--text-primary)]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={onConfirmAdd}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--accent-fg)]"
                style={{ backgroundColor: "var(--accent)" }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
