import type { Metadata } from "next";
import { Ma_Shan_Zheng, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { GridPaper } from "@/components/GridPaper";
import { CategoryNav } from "@/components/CategoryNav";
import { StickerProvider } from "@/context/StickerContext";
import { StickerMetaDialog } from "@/components/StickerMetaDialog";
const maShanZheng = Ma_Shan_Zheng({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hand",
});

const notoSansSc = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-noto",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "碎片生活",
  description: "复古方格纸上的手撕贴纸记录",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${maShanZheng.variable} ${notoSansSc.variable}`}>
      <body className="min-h-screen text-stone-800 antialiased">
        <GridPaper />
        <StickerProvider>
          <header className="sticky top-0 z-20 border-b border-stone-400/40 bg-[#f4ecd8]/85 backdrop-blur-md">
            <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4">
              <h1 className="pl-0.5 font-[family-name:var(--font-hand)] text-4xl tracking-wide text-stone-800">
                碎片生活
              </h1>
              <CategoryNav />
            </div>
          </header>
          <main className="mx-auto max-w-3xl px-4 pt-8 pb-[100px]">{children}</main>
          <StickerMetaDialog />
        </StickerProvider>
      </body>
    </html>
  );
}
