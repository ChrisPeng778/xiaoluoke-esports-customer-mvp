"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { WorkerSession } from "@/lib/types";
import { formatRock, workerLevelLabel } from "@/lib/store";

const rootPaths = new Set(["/worker", "/worker/home", "/worker/orders", "/worker/wallet", "/worker/profile", "/worker/login"]);

export function WorkerHeader({ session }: { session?: WorkerSession | null }) {
  const pathname = usePathname();
  const router = useRouter();
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
          <Link href="/worker/home" className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-slate-900 text-lg font-black text-rock-gold">
              接
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black leading-tight text-rock-ink">接单员端</p>
              <p className="text-xs font-medium text-stone-500">小洛克电竞</p>
            </div>
          </Link>
        </div>

        {session ? (
          <Link href="/worker/wallet" className="rounded-full bg-amber-100/90 px-3 py-2 text-right text-xs font-bold text-slate-700">
            <span className="block text-[10px] text-slate-500">{workerLevelLabel(session.worker.level)}</span>
            {formatRock(session.wallet.availableBalance)} 洛克贝
          </Link>
        ) : (
          <Link href="/worker/login" className="rounded-full bg-slate-900 px-3 py-2 text-xs font-black text-white">
            登录
          </Link>
        )}
      </div>
    </header>
  );
}
