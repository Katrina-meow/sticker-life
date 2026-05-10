"use client";

import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { CANVAS_BG_DATA_URL_MAX, useUi } from "@/context/UiContext";

const PRESET_COLORS: { hex: string; label: string }[] = [
  { hex: "#000000", label: "纯黑" },
  { hex: "#1A1A1B", label: "深灰" },
  { hex: "#F5F5F7", label: "米色" },
  { hex: "#FFF9EB", label: "纸张色" },
];

export function CanvasBackgroundPanel() {
  const {
    canvasBackground,
    setCanvasBackground,
    setCanvasBackgroundType,
  } = useUi();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageHint, setImageHint] = useState<string | null>(null);

  const mode = canvasBackground.type;

  const onPickColor = useCallback(
    (hex: string) => {
      setImageHint(null);
      setCanvasBackground({ type: "color", value: hex });
    },
    [setCanvasBackground],
  );

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) {
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      setImageHint(null);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        if (dataUrl.length <= CANVAS_BG_DATA_URL_MAX) {
          setCanvasBackground({ type: "image", value: dataUrl });
        } else {
          const blobUrl = URL.createObjectURL(file);
          setCanvasBackground({ type: "image", value: blobUrl });
          setImageHint("图片较大，已临时应用；刷新后需重新上传。");
        }
        if (fileRef.current) fileRef.current.value = "";
      };
      reader.onerror = () => {
        const blobUrl = URL.createObjectURL(file);
        setCanvasBackground({ type: "image", value: blobUrl });
        setImageHint("已用临时链接显示；刷新后需重新上传。");
        if (fileRef.current) fileRef.current.value = "";
      };
      reader.readAsDataURL(file);
    },
    [setCanvasBackground],
  );

  return (
    <aside
      className="elevated-surface rounded-[var(--radius-card-lg)] border border-[color:var(--card-border)] bg-[var(--card-bg)] p-4"
      aria-label="画布设置"
    >
      <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
        画布设置
      </h3>
      <p className="mt-1 text-xs text-[color:var(--text-muted)]">
        仅作用于自由画板区域
      </p>

      <div
        className="mt-3 flex rounded-lg border border-[color:var(--input-border)] p-0.5"
        role="tablist"
        aria-label="背景类型"
      >
        {(["color", "image"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={mode === t}
            onClick={() => setCanvasBackgroundType(t)}
            className={[
              "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition",
              mode === t
                ? "bg-[var(--nav-pill-active-bg)] text-[color:var(--nav-pill-active-text)]"
                : "text-[color:var(--text-muted)] hover:bg-[var(--card-accent)]",
            ].join(" ")}
          >
            {t === "color" ? "纯色" : "图片"}
          </button>
        ))}
      </div>

      {mode === "color" ? (
        <div className="mt-4">
          <p className="mb-2 text-xs text-[color:var(--text-muted)]">预设</p>
          <div className="flex flex-wrap gap-3">
            {PRESET_COLORS.map(({ hex, label }) => (
              <button
                key={hex}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => onPickColor(hex)}
                className={[
                  "h-8 w-8 rounded-full border-2 transition ring-offset-2 ring-offset-[var(--card-bg)]",
                  canvasBackground.value === hex && canvasBackground.type === "color"
                    ? "ring-2 ring-[color:var(--accent)]"
                    : "border-black/20",
                ].join(" ")}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onFileChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-lg border border-[color:var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[color:var(--text-primary)] hover:brightness-105"
          >
            选择背景图
          </button>
          {imageHint ? (
            <p className="text-xs text-[color:var(--accent-label)]">{imageHint}</p>
          ) : null}
        </div>
      )}

      <button
        type="button"
        className="mt-4 w-full rounded-lg border border-[color:var(--input-border)] px-3 py-2 text-xs text-[color:var(--text-muted)] hover:bg-[var(--card-accent)]"
        onClick={() => {
          setImageHint(null);
          setCanvasBackground({ type: "color", value: "" });
        }}
      >
        恢复默认（跟随主题）
      </button>
    </aside>
  );
}
