"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { WorkerBottomNav } from "@/components/WorkerBottomNav";
import { WorkerHeader } from "@/components/WorkerHeader";
import { useStoreSync, useWorkerSession } from "@/lib/hooks";
import { formatTime, getCurrentWorkerSupportRecords } from "@/lib/store";

export default function WorkerMessagesPage() {
  const { session, ready } = useWorkerSession();
  const [records, setRecords] = useState<ReturnType<typeof getCurrentWorkerSupportRecords>>({ complaints: [], aftersales: [], reviews: [] });
  const loadRecords = useCallback(() => setRecords(getCurrentWorkerSupportRecords()), []);
  useStoreSync(loadRecords, ready && Boolean(session), 1500);

  if (!ready) return null;

  if (!session) {
    return (
      <main className="page-shell">
        <WorkerHeader />
        <EmptyState title="请先登录接单员端" description="登录后可以查看投诉、售后和评价提醒。" />
        <Link href="/worker/login" className="primary-button mt-4 w-full">进入接单员登录</Link>
      </main>
    );
  }

  const rows = [
    ...records.complaints.map((item) => ({ id: item.id, kind: item.type === "question" ? "订单疑问" : "订单投诉", orderId: item.orderId, title: item.title, status: item.status, time: item.updatedAt, detail: item.content })),
    ...records.aftersales.map((item) => ({ id: item.id, kind: "售后申请", orderId: item.orderId, title: item.title, status: item.status, time: item.updatedAt, detail: item.reason })),
    ...records.reviews.map((item) => ({ id: item.id, kind: "订单评价", orderId: item.orderId, title: `${item.rating} 星评价`, status: item.status, time: item.updatedAt, detail: item.content || "顾客未填写文字评价" })),
  ].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <main className="page-shell">
      <WorkerHeader session={session} />

      <section className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900">消息中心</h1>
        {rows.length ? (
          <div className="space-y-3">
            {rows.map((item) => (
              <Link key={item.id} href={`/worker/order/${item.orderId}`} className="panel block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-amber-600">{item.kind}</p>
                    <h2 className="mt-1 text-base font-black text-slate-900">{item.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-slate-500">{item.detail}</p>
                    <p className="mt-2 text-xs font-bold text-slate-400">{formatTime(item.time)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">{statusText(item.status)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="暂无消息" description="与您相关的投诉、售后和评价会显示在这里。" />
        )}
      </section>

      <WorkerBottomNav />
    </main>
  );
}

function statusText(status: string) {
  if (status === "processing") return "处理中";
  if (status === "resolved") return "已解决";
  if (status === "closed") return "已关闭";
  if (status === "rejected") return "已拒绝";
  if (status === "hidden") return "已隐藏";
  if (status === "visible") return "展示中";
  return "待处理";
}
