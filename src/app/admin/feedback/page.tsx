"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { formatTime, readStore } from "@/lib/store";
import type { StoreShape } from "@/lib/types";

export default function AdminFeedbackPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);
  const feedbackOrders = store.orders.filter((order) => order.status === "after_sale" || order.status === "disputed");

  return (
    <AdminLayout title="反馈 / 纠纷">
      <AdminCard className="p-5">
        <h2 className="text-xl font-black">反馈与投诉</h2>
        <p className="mt-1 text-sm font-bold text-slate-400">当前顾客端反馈入口为占位页，先聚合售后/纠纷订单。</p>
        <div className="mt-5 space-y-3">
          {feedbackOrders.map((order) => (
            <Link key={order.id} href={`/admin/order/${order.id}`} className="block rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="font-black">{order.productName ?? "订单问题"}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">{order.orderNo} · {order.customerName} · {formatTime(order.updatedAt)}</p>
            </Link>
          ))}
          {!feedbackOrders.length ? <p className="rounded-2xl bg-slate-50 p-10 text-center text-sm font-bold text-slate-400">暂无反馈/投诉，功能待接入</p> : null}
        </div>
      </AdminCard>
    </AdminLayout>
  );
}
