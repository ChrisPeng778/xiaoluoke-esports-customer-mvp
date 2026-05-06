"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/worker/home", label: "首页", icon: "⌂" },
  { href: "/worker/orders", label: "订单", icon: "▤" },
  { href: "/worker/wallet", label: "钱包", icon: "◇" },
  { href: "/worker/profile", label: "我的", icon: "☆" },
];

export function WorkerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-[#f7f1e8]/95 px-3 pb-3 pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-[430px] grid-cols-4 gap-2">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            (item.href === "/worker/orders" && pathname.startsWith("/worker/order/")) ||
            (item.href === "/worker/orders" && pathname.startsWith("/worker/chat/"));
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
