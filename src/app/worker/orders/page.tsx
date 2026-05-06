"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkerBottomNav } from "@/components/WorkerBottomNav";
import { WorkerHeader } from "@/components/WorkerHeader";
import { useStoreSync, useWorkerSession } from "@/lib/hooks";
import { acceptOrderAsCurrentWorker, formatRock, formatTime, getCurrentWorkerOrders } from "@/lib/store";
import type { Order } from "@/lib/types";

type TabKey = "pending" | "active" | "completed" | "tips";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "pending", label: "待接单" },
  { key: "active", label: "进行中" },
  { key: "completed", label: "已完成" },
  { key: "tips", label: "打赏" },
];

export default function WorkerOrdersPage() {
  return (
    <Suspense fallback={null}>
      <WorkerOrdersContent />
    </Suspense>
  );
}

function WorkerOrdersContent() {
  const searchParams = useSearchParams();
  const { session, ready, refresh } = useWorkerSession();
  const initialTab = (searchParams.get("tab") as TabKey) || "pending";
  const [activeTab, setActiveTab] = useState<TabKey>(tabs.some((tab) => tab.key === initialTab) ? initialTab : "pending");
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const loadOrders = useCallback(() => setOrders(getCurrentWorkerOrders()), []);
  useStoreSync(loadOrders, ready && Boolean(session), 1500);

  const visibleOrders = useMemo(() => {
    if (activeTab === "pending") return orders.filter((order) => order.orderType === "service" && order.status === "pending");
    if (activeTab === "active") return orders.filter((order) => order.orderType === "service" && ["accepted", "worker_completed", "disputed"].includes(order.status));
    if (activeTab === "completed") return orders.filter((order) => order.orderType === "service" && ["settled", "refunded", "after_sale"].includes(order.status));
    return orders.filter((order) => order.orderType === "tip");
  }, [orders, activeTab]);

  if (!ready) return null;

  if (!session) {
    return (
      <main className="page-shell">
        <WorkerHeader />
        <EmptyState title="请先登录接单员端" description="登录后可以查看待接订单和我的订单。" />
        <Link href="/worker/login" className="primary-button mt-4 w-full">进入接单员登录</Link>
      </main>
    );
  }

  const accept = (orderId: string) => {
    try {
      acceptOrderAsCurrentWorker(orderId);
      refresh();
      setMessage("已接单，可以进入订单详情。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "接单失败");
    }
  };

  return (
    <main className="page-shell">
      <WorkerHeader session={session} />

      <section className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900">接单员订单</h1>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`h-10 shrink-0 rounded-full px-4 text-sm font-black ${
                activeTab === tab.key ? "bg-rock-gold text-slate-900" : "bg-white text-stone-500"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {message ? <p className="rounded-[14px] bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-700">{message}</p> : null}

        {visibleOrders.length ? (
          <div className="space-y-3">
            {visibleOrders.map((order) => (
              <WorkerOrderCard key={order.id} order={order} onAccept={accept} />
            ))}
          </div>
        ) : (
          <EmptyState title="暂无订单" description="符合当前分类的订单会显示在这里。" />
        )}
      </section>

      <WorkerBottomNav />
    </main>
  );
}

function WorkerOrderCard({ order, onAccept }: { order: Order; onAccept: (orderId: string) => void }) {
  const title = order.orderType === "tip" ? `收到打赏：${order.customerName}` : order.productName;

  return (
    <div className="panel p-4">
      <Link href={order.orderType === "tip" ? "/worker/wallet" : `/worker/order/${order.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-stone-400">{order.orderNo}</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">{title}</h2>
            <p className="mt-2 text-sm font-bold text-stone-500">顾客：{order.customerName}</p>
            <p className="mt-1 text-xs font-bold text-stone-400">{formatTime(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
            {order.orderType === "tip" ? "打赏订单" : order.assignmentType === "specified" ? "指定接单员" : "随机派单"}
          </span>
          <span className="text-lg font-black text-orange-500">{formatRock(order.amountLockeCoin)} 洛克贝</span>
        </div>
      </Link>
      {order.orderType === "service" && order.status === "pending" ? (
        <button className="primary-button mt-3 w-full" onClick={() => onAccept(order.id)}>立即接单</button>
      ) : null}
    </div>
  );
}
