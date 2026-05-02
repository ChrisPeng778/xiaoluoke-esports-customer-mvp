"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { useCustomerSession } from "@/lib/hooks";
import { formatRock, getRanking } from "@/lib/store";

const ranges = ["月榜", "周榜", "日榜"] as const;

const rankStyles = [
  {
    card: "border-amber-200 bg-gradient-to-r from-amber-50 to-white",
    badge: "bg-gradient-to-br from-amber-300 to-yellow-500 text-slate-950",
    label: "冠军",
  },
  {
    card: "border-slate-200 bg-gradient-to-r from-slate-50 to-white",
    badge: "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950",
    label: "亚军",
  },
  {
    card: "border-orange-200 bg-gradient-to-r from-orange-50 to-white",
    badge: "bg-gradient-to-br from-orange-200 to-orange-400 text-slate-950",
    label: "季军",
  },
] as const;

export default function RankingPage() {
  const { session, ready } = useCustomerSession();
  const [kind, setKind] = useState<"spending" | "orders">("spending");
  const [range, setRange] = useState<(typeof ranges)[number]>("月榜");
  const rows = getRanking(kind);

  if (!ready) return null;

  return (
    <main className="page-shell">
      <AppHeader session={session} />

      <section className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900">排行榜</h1>
        <div className="grid grid-cols-2 gap-2 rounded-full bg-white p-1">
          <button className={`h-10 rounded-full text-sm font-black ${kind === "spending" ? "bg-rock-gold" : ""}`} onClick={() => setKind("spending")}>
            消费榜
          </button>
          <button className={`h-10 rounded-full text-sm font-black ${kind === "orders" ? "bg-rock-gold" : ""}`} onClick={() => setKind("orders")}>
            订单榜
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ranges.map((item) => (
            <button
              key={item}
              className={`h-10 rounded-full text-sm font-black ${range === item ? "bg-slate-900 text-white" : "bg-white text-slate-500"}`}
              onClick={() => setRange(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {rows.map((row, index) => {
            const style = rankStyles[index];
            return (
              <div
                key={`${row.nickname}-${index}`}
                className={`panel flex items-center gap-3 border p-4 ${style?.card ?? "border-white"}`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black ${
                    style?.badge ?? "bg-amber-100 text-amber-700"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="image-placeholder h-11 w-11 rounded-full">头像</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-900">{row.nickname}</p>
                  <p className="text-xs font-bold text-slate-400">
                    {style?.label ?? range} · {range}
                  </p>
                </div>
                <p className="text-sm font-black text-orange-500">
                  {kind === "spending" ? `${formatRock(row.spending)} 洛克贝` : `${row.serviceOrders} 单`}
                </p>
              </div>
            );
          })}
        </div>

        <p className="rounded-[14px] bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-700">
          平台会根据排行榜情况发放相应洛克贝奖励，具体规则以后续公告为准。
        </p>
      </section>

      <BottomNav />
    </main>
  );
}
