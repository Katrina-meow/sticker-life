import { blobToDataUrl } from "@/lib/stickerStorage";

const REMOVE_BG_TIMEOUT_MS = 50_000;

function timeoutReject(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("remove-background-timeout")), ms),
  );
}

function isHeicFile(file: File): boolean {
  const t = file.type.toLowerCase();
  const n = file.name.toLowerCase();
  return (
    t === "image/heic" ||
    t === "image/heif" ||
    n.endsWith(".heic") ||
    n.endsWith(".heif")
  );
}

/** HEIC → JPEG File；失败则抛错由上层降级 */
async function heicToJpegFile(file: File): Promise<File> {
  const mod = (await import("heic2any")) as {
    default: (opts: {
      blob: Blob;
      toType: string;
      quality?: number;
    }) => Promise<Blob | Blob[]>;
  };
  const heic2any = mod.default;
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  });
  const blob = Array.isArray(result) ? result[0] : result;
  const name = file.name.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg");
  return new File([blob], name || "photo.jpg", { type: "image/jpeg" });
}

async function toDisplayableFile(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;
  return heicToJpegFile(file);
}

export type ProcessStickerImageResult = {
  dataUrl: string;
  usedFallback: boolean;
};

/**
 * 抠图；超时/失败/HEIC 异常时降级为原图（或转换后的 JPEG）data URL。
 */
export async function processStickerImage(
  file: File,
): Promise<ProcessStickerImageResult> {
  try {
    let working: File = file;
    try {
      working = await toDisplayableFile(file);
    } catch (e) {
      console.warn("HEIC 转换失败，尝试直接使用原图", e);
      try {
        const dataUrl = await blobToDataUrl(file);
        return { dataUrl, usedFallback: true };
      } catch {
        working = file;
      }
    }

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await Promise.race([
        removeBackground(working, { model: "isnet" }),
        timeoutReject(REMOVE_BG_TIMEOUT_MS),
      ]);
      const dataUrl = await blobToDataUrl(blob);
      return { dataUrl, usedFallback: false };
    } catch (e) {
      console.warn("抠图降级为原图", e);
      const dataUrl = await blobToDataUrl(working);
      return { dataUrl, usedFallback: true };
    }
  } catch (e) {
    console.warn("图片处理失败，使用原文件", e);
    const dataUrl = await blobToDataUrl(file);
    return { dataUrl, usedFallback: true };
  }
}
