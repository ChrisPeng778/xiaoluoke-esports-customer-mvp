"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AuthPrompt } from "@/components/AuthPrompt";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { useCustomerSession, useStoreSync } from "@/lib/hooks";
import { formatCurrency, formatRock, formatTime, getCurrentCustomerOrders } from "@/lib/store";
import type { Order, OrderStatus } from "@/lib/types";

type TabKey = "all" | "unpaid" | "pending" | "accepted" | "worker_completed" | "settled" | "disputed" | "after_sale";

const tabs: Array<{ key: TabKey; label: string; statuses?: OrderStatus[] }> = [
  { key: "all", label: "全部" },
  { key: "unpaid", label: "待付款", statuses: ["unpaid"] },
  { key: "pending", label: "待接单", statuses: ["pending"] },
  { key: "accepted", label: "服务中", statuses: ["accepted"] },
  { key: "worker_completed", label: "待结单", statuses: ["worker_completed"] },
  { key: "settled", label: "已完成", statuses: ["settled", "paid"] },
  { key: "disputed", label: "有疑问", statuses: ["disputed"] },
  { key: "after_sale", label: "售后", statuses: ["refunded", "after_sale"] },
];

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const { session, ready, refresh } = useCustomerSession();
  const initialTab = (searchParams.get("tab") as TabKey) || "all";
  const [activeTab, setActiveTab] = useState<TabKey>(tabs.some((tab) => tab.key === initialTab) ? initialTab : "all");
  const [loginOpen, setLoginOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const loadOrders = useCallback(() => setOrders(getCurrentCustomerOrders()), []);
  useStoreSync(loadOrders, ready && Boolean(session), 1500);

  const visibleOrders = useMemo(() => {
    const tab = tabs.find((item) => item.key === activeTab) ?? tabs[0];
    if (!tab.statuses) return orders;
    return orders.filter((order) => tab.statuses?.includes(order.status));
  }, [activeTab, orders]);

  if (!ready) return null;

  if (!session) {
    return (
      <main className="page-shell">
        <AppHeader />
        <EmptyState title="请先微信登录" description="登录后可以查看我的订单、打赏记录和售后状态。" />
        <button className="primary-button mt-4 w-full" onClick={() => setLoginOpen(true)}>微信一键登录</button>
        <AuthPrompt open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={refresh} />
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="page-shell">
      <AppHeader session={session} />

      <section className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900">我的订单</h1>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`h-10 shrink-0 rounded-full px-4 text-sm font-black ${
                activeTab === tab.key ? "bg-rock-gold text-slate-900" : "bg-white text-slate-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {visibleOrders.length ? (
          <div className="space-y-3">
            {visibleOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <EmptyState title="这里还没有订单" description="下单或打赏成功后，对应订单会显示在这里。" />
        )}
      </section>

      <BottomNav />
    </main>
  );
}

function OrderCard({ order }: { order: Order }) {
  const title = order.orderType === "tip" ? `打赏接单员：${order.workerName}` : order.productName;

  return (
    <Link href={`/customer/order/${order.id}`} className="panel block p-4 active:scale-[0.995]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-400">{order.orderNo}</p>
          <h2 className="mt-1 text-lg font-black text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">下单时间：{formatTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
          {order.orderType === "tip" ? "打赏订单" : "服务订单"}
        </span>
        <span className="text-lg font-black text-orange-500">
          {order.paymentMethod === "locke_coin" ? `${formatRock(order.amountLockeCoin)} 洛克贝` : formatCurrency(order.amountRmb)}
        </span>
      </div>
    </Link>
  );
}
