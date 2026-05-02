"use client";

import Link from "next/link";
import type { CustomerSession } from "@/lib/types";
import { formatRock } from "@/lib/store";

export function AppHeader({ session }: { session?: CustomerSession | null }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 border-b border-white/55 bg-[#f5efe4]/90 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[430px] items-center justify-between gap-3">
        <Link href="/customer/home" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-rock-gold text-lg font-black text-slate-900">
            洛
          </span>
          <div>
            <p className="text-base font-black leading-tight text-rock-ink">小洛克电竞</p>
            <p className="text-xs font-medium text-stone-500">H5 Customer</p>
          </div>
        </Link>

        {session ? (
          <Link
            href="/customer/recharge"
            className="rounded-full bg-amber-100/90 px-3 py-2 text-right text-xs font-bold text-slate-700"
          >
            <span className="block text-[10px] text-slate-500">洛克贝</span>
            {formatRock(session.wallet.availableBalance)}
          </Link>
        ) : (
          <Link href="/login" className="rounded-full bg-slate-900 px-3 py-2 text-xs font-black text-white">
            微信登录
          </Link>
        )}
      </div>
    </header>
  );
}
