"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items: { href: string; label: string }[] = [
  { href: "/recipes", label: "今日食谱" },
  { href: "/fidget", label: "捏捏/解压" },
  { href: "/grocery", label: "超市买买" },
];

export function CategoryNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="分类">
      {items.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={[
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              active
                ? "border-amber-800/50 bg-amber-100/90 text-amber-950 shadow-sm"
                : "border-stone-400/50 bg-white/40 text-stone-700 hover:bg-white/70",
            ].join(" ")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
