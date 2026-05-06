"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSystemSettings } from "@/lib/store";

const items = [
  { href: "/customer/home", label: "首页", icon: "⌂" },
  { href: "/customer/categories", label: "分类", icon: "▦" },
  { href: "/customer/workers", label: "接单员", icon: "☆" },
  { href: "/customer/profile", label: "我的", icon: "◇" },
];

export function BottomNav() {
  const pathname = usePathname();
  const settings = getSystemSettings();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-[#f7f1e8]/95 px-3 pb-3 pt-2 backdrop-blur">
      {(settings.basic.recordInfo || settings.basic.copyright) ? (
        <p className="mx-auto mb-1 max-w-[430px] truncate text-center text-[10px] font-bold text-stone-400">
          {[settings.basic.recordInfo, settings.basic.copyright].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      <div className="mx-auto grid max-w-[430px] grid-cols-4 gap-2">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            (item.href === "/customer/categories" && pathname.startsWith("/customer/product/")) ||
            (item.href === "/customer/categories" && pathname.startsWith("/customer/order-confirm/")) ||
            (item.href === "/customer/workers" && pathname.startsWith("/customer/worker/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`grid min-h-12 place-items-center rounded-[14px] text-xs font-bold transition ${
                active ? "bg-rock-gold text-slate-900 shadow-sm" : "text-stone-500"
              }`}
              aria-label={item.label}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
