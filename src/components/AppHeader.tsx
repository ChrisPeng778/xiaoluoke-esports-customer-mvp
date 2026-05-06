"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CustomerSession } from "@/lib/types";
import { formatRock, getSystemSettings } from "@/lib/store";

const rootPaths = new Set(["/customer", "/customer/home", "/customer/categories", "/customer/workers", "/customer/profile", "/login"]);

export function AppHeader({ session }: { session?: CustomerSession | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const settings = getSystemSettings();
  const showBack = !rootPaths.has(pathname);

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 border-b border-white/55 bg-[#f5efe4]/90 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[430px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {showBack ? (
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-xl font-black text-slate-700 shadow-sm"
              onClick={() => router.back()}
              aria-label="返回上一级"
            >
              ‹
            </button>
          ) : null}
          <Link href="/customer/home" className="flex min-w-0 items-center gap-2">
            {settings.basic.appLogo ? <img src={settings.basic.appLogo} alt={settings.basic.appName} className="h-9 w-9 shrink-0 rounded-[12px] object-cover" /> : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-rock-gold text-lg font-black text-slate-900">洛</span>}
            <div className="min-w-0">
              <p className="truncate text-base font-black leading-tight text-rock-ink">{settings.basic.appName}</p>
              <p className="text-xs font-medium text-stone-500">H5 Customer</p>
            </div>
          </Link>
        </div>

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
