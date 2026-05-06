"use client";

import { useCallback, useMemo, useState } from "react";
import { AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { formatCurrency, money, readStore } from "@/lib/store";
import type { StoreShape } from "@/lib/types";

export default function AdminFinancePage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date().toISOString().slice(0, 7);
    const serviceOrders = store.orders.filter((order) => order.orderType === "service");
    const settled = store.orders.filter((order) => order.status === "settled");
    const rechargeTotal = store.recharge_orders.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amountRmb, 0);
    const tipTotal = store.orders.filter((order) => order.orderType === "tip" && order.status === "settled").reduce((sum, order) => sum + order.amountRmb, 0);
    const refundTotal = store.wallet_ledger.filter((entry) => (entry.type === "refund" || entry.type === "order_refund") && entry.direction === "in").reduce((sum, entry) => sum + entry.amount, 0);
    const withdrawPending = store.withdraw_requests.filter((item) => item.status === "pending" || item.status === "approved").reduce((sum, item) => sum + item.amountLockeCoin, 0);
    const workerSettled = store.wallet_ledger.filter((entry) => entry.type === "order_income" && entry.direction === "in").reduce((sum, entry) => sum + entry.amount, 0);
    const frozen = store.wallet_accounts.reduce((sum, wallet) => sum + wallet.frozenBalance, 0);
    const unsettledStatuses = new Set(["pending", "accepted", "worker_completed", "disputed", "after_sale"]);
    return [
      ["总 GMV", settled.reduce((sum, order) => sum + order.amountRmb, 0)],
      ["今日 GMV", settled.filter((order) => order.createdAt.slice(0, 10) === today).reduce((sum, order) => sum + order.amountRmb, 0)],
      ["本月 GMV", settled.filter((order) => order.createdAt.slice(0, 7) === month).reduce((sum, order) => sum + order.amountRmb, 0)],
      ["充值总额", rechargeTotal],
      ["打赏总额", tipTotal],
      ["退款总额", refundTotal],
      ["待提现金额", withdrawPending],
      ["平台留存金额", money(rechargeTotal - workerSettled - refundTotal)],
      ["已结算给接单员", workerSettled],
      ["未结算金额", frozen + serviceOrders.filter((order) => unsettledStatuses.has(order.status)).reduce((sum, order) => sum + order.amountRmb, 0)],
    ];
  }, [store]);

  return (
    <AdminLayout title="财务管理">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map(([label, value]) => (
          <AdminCard key={label} className="p-5">
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <p className="mt-4 text-2xl font-black text-slate-900">{formatCurrency(Number(value))}</p>
          </AdminCard>
        ))}
      </section>
    </AdminLayout>
  );
}
