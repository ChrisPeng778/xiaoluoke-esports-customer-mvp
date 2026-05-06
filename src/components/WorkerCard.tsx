"use client";

import Link from "next/link";
import type { Worker } from "@/lib/types";
import { workerLevelLabel } from "@/lib/store";

export function WorkerCard({ worker, selectableHref }: { worker: Worker; selectableHref?: string }) {
  const href = selectableHref ?? `/customer/worker/${worker.id}`;
  const available = worker.status !== "frozen" && worker.onlineStatus === "online";

  return (
    <Link href={href} className="panel block p-4 active:scale-[0.995]">
      <div className="flex gap-3">
        {worker.avatarUrl ? (
          <img src={worker.avatarUrl} alt={worker.name} className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="image-placeholder h-16 w-16 shrink-0 rounded-full">头像</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-lg font-black text-slate-900">{worker.name}</h3>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
                available ? "bg-emerald-100 text-emerald-700" : worker.status === "frozen" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {available ? "可接单" : worker.status === "frozen" ? "不可接单" : "离线"}
            </span>
          </div>
          <p className="mt-1 text-xs font-black text-amber-700">{workerLevelLabel(worker.level)}</p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{worker.intro}</p>
          <div className="mt-3 flex gap-3 text-xs font-bold text-slate-500">
            <span>已完成 {worker.completedOrderCount}</span>
            <span>好评率 {worker.rating}%</span>
            {worker.ratingAvg ? <span>{worker.ratingAvg.toFixed(1)} 星</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
