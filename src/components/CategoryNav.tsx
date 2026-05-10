"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useStickerStore } from "@/context/StickerContext";

export function CategoryNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { categories, addCategory } = useStickerStore();
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");

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

  return (
    <>
      <nav
        className="flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x [&::-webkit-scrollbar]:hidden"
        aria-label="分类"
      >
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
                  ? "border-amber-800/50 bg-amber-100/90 text-amber-950 shadow-sm"
                  : "border-stone-400/50 bg-white/40 text-stone-700 hover:bg-white/70",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="shrink-0 rounded-full border border-dashed border-stone-500/60 bg-white/30 px-3 py-1.5 text-sm text-stone-700 hover:bg-white/60"
          aria-label="添加分类"
        >
          ＋
        </button>
      </nav>

      {adding ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-cat-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-stone-900/30 backdrop-blur-[1px]"
            aria-label="关闭"
            onClick={() => {
              setAdding(false);
              setNewLabel("");
            }}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-amber-200/80 bg-[#fffdf6] p-5 shadow-lg">
            <h2
              id="add-cat-title"
              className="font-[family-name:var(--font-hand)] text-xl text-amber-950"
            >
              新建分类
            </h2>
            <label className="mt-3 block text-sm text-stone-700">
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
                className="mt-1 w-full rounded-lg border border-stone-300/80 bg-white px-3 py-2 text-stone-900 outline-none ring-amber-300/40 focus:ring-2"
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
                className="rounded-lg border border-stone-300/80 bg-white px-3 py-1.5 text-sm text-stone-700"
              >
                取消
              </button>
              <button
                type="button"
                onClick={onConfirmAdd}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700"
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
