"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  buildNewStickerItem,
  useStickerStore,
} from "@/context/StickerContext";
import { TornSticker } from "@/components/TornSticker";
import { formatRecordedAtLabel } from "@/lib/dateUtils";
import { getFieldMode } from "@/lib/categoryConfig";

export function StickerMetaDialog() {
  const {
    dialog,
    closeDialog,
    stickersByCategory,
    addSticker,
    updateStickerMeta,
  } = useStickerStore();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [calories, setCalories] = useState("");
  const [hero, setHero] = useState("");
  const [studyDuration, setStudyDuration] = useState("");

  const editingSticker = useMemo(() => {
    if (!dialog || dialog.mode !== "edit") return null;
    return (
      stickersByCategory[dialog.category]?.find((s) => s.id === dialog.id) ??
      null
    );
  }, [dialog, stickersByCategory]);

  useEffect(() => {
    if (!dialog) return;
    if (dialog.mode === "create") {
      setName("");
      setAmount("");
      setCalories("");
      setHero("");
      setStudyDuration("");
      return;
    }
    if (editingSticker) {
      setName(editingSticker.name);
      setAmount(editingSticker.amount);
      setCalories(editingSticker.calories ?? "");
      setHero(editingSticker.hero ?? "");
      setStudyDuration(editingSticker.studyDuration ?? "");
    }
  }, [dialog, editingSticker]);

  useEffect(() => {
    if (dialog?.mode === "edit" && !editingSticker) {
      closeDialog();
    }
  }, [dialog, editingSticker, closeDialog]);

  if (!dialog) return null;

  if (dialog.mode === "edit" && !editingSticker) return null;

  const fieldMode = getFieldMode(dialog.category);
  const title =
    dialog.mode === "create" ? "为这张贴纸写上备注" : "修改贴纸信息";

  const previewSrc =
    dialog.mode === "create"
      ? dialog.src
      : editingSticker?.src ?? "";
  const previewRotation =
    dialog.mode === "create"
      ? dialog.rotationDeg
      : editingSticker?.rotationDeg ?? 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (dialog.mode === "create") {
      const listLen = stickersByCategory[dialog.category]?.length ?? 0;
      const item = buildNewStickerItem(dialog.category, listLen, {
        src: dialog.src,
        rotationDeg: dialog.rotationDeg,
        name,
        amount,
        calories: fieldMode === "food" ? calories : undefined,
        hero: fieldMode === "game" ? hero : undefined,
        studyDuration: fieldMode === "study" ? studyDuration : undefined,
        recordedAt: new Date().toISOString(),
      });
      addSticker(dialog.category, item);
      closeDialog();
      return;
    }
    const patch: Parameters<typeof updateStickerMeta>[2] = {
      name,
      amount,
    };
    if (fieldMode === "food") {
      patch.calories = calories.trim() || undefined;
    }
    if (fieldMode === "game") {
      patch.hero = hero.trim() || undefined;
    }
    if (fieldMode === "study") {
      patch.studyDuration = studyDuration.trim() || undefined;
    }
    updateStickerMeta(dialog.category, dialog.id, patch);
    closeDialog();
  };

  const handleBackdrop = () => closeDialog();

  const nameLabel =
    fieldMode === "food"
      ? "这是什么（菜名）"
      : fieldMode === "study"
        ? "学习内容"
        : fieldMode === "game"
          ? "对局备注"
          : "名称";

  const namePlaceholder =
    fieldMode === "food"
      ? "例如：番茄炒蛋"
      : fieldMode === "game"
        ? "例如：排位"
        : fieldMode === "study"
          ? "例如：高数第 3 章"
          : "例如：减压捏捏球";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sticker-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/35 backdrop-blur-[2px]"
        aria-label="关闭"
        onClick={handleBackdrop}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-amber-200/80 bg-[#fffdf6] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
        <div className="border-b border-amber-100/90 bg-gradient-to-r from-amber-50/90 to-[#fff9e6] px-5 py-4">
          <h2
            id="sticker-dialog-title"
            className="font-[family-name:var(--font-hand)] text-2xl text-amber-950"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            选中贴纸时，可点底部信息条随时修改。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {dialog.mode === "edit" && editingSticker ? (
            <p className="rounded-lg bg-stone-100/80 px-3 py-2 text-xs text-stone-600">
              记录时间（只读，改日期可将贴纸拖到日历格子上）：{" "}
              <span className="font-[family-name:var(--font-hand)] text-stone-800">
                {formatRecordedAtLabel(editingSticker.recordedAt)}
              </span>
            </p>
          ) : null}
          {previewSrc ? (
            <div className="flex justify-center rounded-xl bg-stone-100/60 py-4">
              <div
                style={{
                  transform: `rotate(${previewRotation}deg) scale(0.9)`,
                }}
              >
                <TornSticker src={previewSrc} alt="预览" />
              </div>
            </div>
          ) : null}

          <label className="block text-sm font-medium text-stone-800">
            {nameLabel}
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-stone-300/80 bg-white/90 px-3 py-2 text-stone-900 shadow-inner outline-none ring-amber-300/40 focus:ring-2"
              placeholder={namePlaceholder}
            />
          </label>

          {fieldMode === "game" ? (
            <>
              <label className="block text-sm font-medium text-stone-800">
                战绩
                <input
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-stone-300/80 bg-white/90 px-3 py-2 text-stone-900 shadow-inner outline-none ring-amber-300/40 focus:ring-2"
                  placeholder="例如：胜利 / MVP"
                />
              </label>
              <label className="block text-sm font-medium text-stone-800">
                英雄
                <input
                  value={hero}
                  onChange={(e) => setHero(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-stone-300/80 bg-white/90 px-3 py-2 text-stone-900 shadow-inner outline-none ring-amber-300/40 focus:ring-2"
                  placeholder="例如：妲己"
                />
              </label>
            </>
          ) : fieldMode === "study" ? (
            <>
              <label className="block text-sm font-medium text-stone-800">
                学习时长
                <input
                  required
                  value={studyDuration}
                  onChange={(e) => setStudyDuration(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-stone-300/80 bg-white/90 px-3 py-2 text-stone-900 shadow-inner outline-none ring-amber-300/40 focus:ring-2"
                  placeholder="例如：2 小时 / 90 分钟"
                />
              </label>
              <label className="block text-sm font-medium text-stone-800">
                金额（可选）
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-stone-300/80 bg-white/90 px-3 py-2 text-stone-900 shadow-inner outline-none ring-amber-300/40 focus:ring-2"
                  placeholder="例如：教材 38 元"
                  inputMode="decimal"
                />
              </label>
            </>
          ) : (
            <>
              <label className="block text-sm font-medium text-stone-800">
                金额
                <input
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-stone-300/80 bg-white/90 px-3 py-2 text-stone-900 shadow-inner outline-none ring-amber-300/40 focus:ring-2"
                  placeholder="例如：18 元"
                  inputMode="decimal"
                />
              </label>
              {fieldMode === "food" ? (
                <label className="block text-sm font-medium text-stone-800">
                  热量（kcal）
                  <input
                    required
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-stone-300/80 bg-white/90 px-3 py-2 text-stone-900 shadow-inner outline-none ring-amber-300/40 focus:ring-2"
                    placeholder="例如：320"
                    inputMode="numeric"
                  />
                </label>
              ) : null}
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleBackdrop}
              className="rounded-lg border border-stone-300/80 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-amber-700"
            >
              完成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
