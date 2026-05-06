"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { formatCurrency, formatTime, readStore } from "@/lib/store";
import type { StoreShape } from "@/lib/types";

export default function AdminDisputesPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);
  const disputes = store.orders.filter((order) => order.status === "disputed");

  return (
    <AdminLayout title="纠纷订单">
      <AdminCard className="p-5">
        <h2 className="text-xl font-black">纠纷处理</h2>
        <div className="mt-5 grid gap-3">
          {disputes.map((order) => (
            <Link key={order.id} href={`/admin/order/${order.id}`} className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 hover:border-rose-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-rose-400">{order.orderNo}</p>
                  <h3 className="mt-1 text-lg font-black">{order.productName ?? "服务订单"}</h3>
                  <p className="mt-2 text-sm font-bold text-slate-500">顾客：{order.customerName} · 接单员：{order.workerName ?? "未接单"}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">提交时间：{formatTime(order.updatedAt)}</p>
                </div>
                <div className="text-right">
                  <AdminBadge tone="rose">有疑问</AdminBadge>
                  <p className="mt-3 text-lg font-black text-amber-600">{formatCurrency(order.amountRmb)}</p>
                </div>
              </div>
            </Link>
          ))}
          {!disputes.length ? <p className="rounded-2xl bg-slate-50 p-10 text-center text-sm font-bold text-slate-400">暂无纠纷订单</p> : null}
        </div>
      </AdminCard>
    </AdminLayout>
  );
}
