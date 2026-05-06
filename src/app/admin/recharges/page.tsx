"use client";

import { useCallback, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { formatCurrency, formatRock, formatTime, readStore } from "@/lib/store";
import type { StoreShape } from "@/lib/types";

export default function AdminRechargesPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  return (
    <AdminLayout title="充值记录">
      <AdminCard className="p-5">
        <h2 className="text-xl font-black">顾客充值记录</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>{["充值编号", "顾客昵称", "充值金额", "获得洛克贝", "支付方式", "状态", "创建时间", "支付时间"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {store.recharge_orders.map((order) => {
                const user = store.users.find((item) => item.id === order.userId);
                return (
                  <tr key={order.id}>
                    <td className="px-4 py-4 font-black text-slate-500">{order.rechargeNo}</td>
                    <td className="px-4 py-4 font-black">{user?.nickname ?? order.userId}</td>
                    <td className="px-4 py-4">{formatCurrency(order.amountRmb)}</td>
                    <td className="px-4 py-4">{formatRock(order.amountLockeCoin)}</td>
                    <td className="px-4 py-4">{order.paymentMethod}</td>
                    <td className="px-4 py-4"><AdminBadge>{order.status}</AdminBadge></td>
                    <td className="px-4 py-4 text-slate-500">{formatTime(order.createdAt)}</td>
                    <td className="px-4 py-4 text-slate-500">{formatTime(order.paidAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!store.recharge_orders.length ? <p className="py-10 text-center text-sm font-bold text-slate-400">暂无充值记录</p> : null}
        </div>
      </AdminCard>
    </AdminLayout>
  );
}
