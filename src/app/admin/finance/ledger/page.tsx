"use client";

import { useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { formatRock, formatTime, readStore } from "@/lib/store";
import type { LedgerType, StoreShape } from "@/lib/types";

export default function FinanceLedgerPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [owner, setOwner] = useState<"worker" | "customer">("worker");
  const [ownerId, setOwnerId] = useState("");
  const [type, setType] = useState<"all" | LedgerType>("all");
  const rows = store.wallet_ledger
    .filter((entry) => {
      const wallet = store.wallet_accounts.find((item) => item.userId === entry.userId);
      return owner === "worker" ? wallet?.ownerType === "worker" : wallet?.ownerType === "customer";
    })
    .filter((entry) => !ownerId || entry.userId.includes(ownerId))
    .filter((entry) => type === "all" || entry.type === type)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <AdminLayout title="财务流水">
      <div className="space-y-4">
        <AdminCard className="p-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
            <button className={`rounded-xl px-4 py-2 text-sm font-black ${owner === "worker" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600"}`} onClick={() => setOwner("worker")}>接单员流水</button>
            <button className={`rounded-xl px-4 py-2 text-sm font-black ${owner === "customer" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600"}`} onClick={() => setOwner("customer")}>用户流水</button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <input className="admin-field" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} placeholder={owner === "worker" ? "接单员 ID" : "用户 ID"} />
            <select className="admin-field" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="all">全部类型</option>
              {ledgerTypes.map((item) => <option key={item} value={item}>{ledgerTypeText(item)}</option>)}
            </select>
            <button className="admin-secondary" onClick={() => { setOwnerId(""); setType("all"); setStore(readStore()); }}>重置 / 刷新</button>
          </div>
        </AdminCard>
        <AdminCard className="overflow-hidden">
          <table className="admin-table">
            <thead><tr><th>流水类型</th><th>对象</th><th>变动金额</th><th>变动前余额</th><th>变动后余额</th><th>关联类型</th><th>关联 ID</th><th>备注</th><th>时间</th></tr></thead>
            <tbody>
              {rows.map((entry) => {
                const worker = store.workers.find((item) => item.id === entry.userId);
                const user = store.users.find((item) => item.id === entry.userId);
                return (
                  <tr key={entry.id}>
                    <td><AdminBadge tone={entry.direction === "in" ? "green" : "amber"}>{ledgerTypeText(entry.type)}</AdminBadge></td>
                    <td>{worker?.name ?? user?.nickname ?? entry.userId}<p className="text-xs text-slate-400">{entry.userId}</p></td>
                    <td className={entry.direction === "in" ? "font-black text-emerald-600" : "font-black text-orange-500"}>{entry.direction === "in" ? "+" : "-"}{formatRock(entry.amount)}</td>
                    <td>{entry.beforeBalance === undefined ? "-" : formatRock(entry.beforeBalance)}</td>
                    <td>{entry.afterBalance === undefined ? "-" : formatRock(entry.afterBalance)}</td>
                    <td>{entry.relatedType ?? "-"}</td>
                    <td className="max-w-[160px] truncate">{entry.relatedOrderId ?? entry.rechargeOrderId ?? "-"}</td>
                    <td className="max-w-[260px] truncate">{entry.description}</td>
                    <td>{formatTime(entry.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length ? <p className="py-12 text-center text-sm font-bold text-slate-400">暂无流水</p> : null}
        </AdminCard>
      </div>
    </AdminLayout>
  );
}

const ledgerTypes: LedgerType[] = ["recharge_in", "mock_recharge", "order_pay", "order_freeze", "order_income", "order_refund", "refund", "tip_income", "tip_in", "tip_out", "withdraw_freeze", "withdraw_done", "withdraw_rejected", "deposit_paid", "deposit_admin_add", "deposit_admin_deduct", "deposit_refund", "admin_adjust"];

function ledgerTypeText(type: LedgerType) {
  const map: Partial<Record<LedgerType, string>> = {
    recharge_in: "充值入账",
    mock_recharge: "模拟充值",
    order_pay: "下单支付",
    order_freeze: "订单冻结",
    order_income: "接单收益",
    order_refund: "订单退款",
    refund: "退款",
    tip_income: "打赏收入",
    tip_in: "打赏收入",
    tip_out: "打赏支出",
    withdraw_freeze: "提现冻结",
    withdraw_done: "提现扣除",
    withdraw_rejected: "提现驳回返还",
    deposit_paid: "保证金缴纳",
    deposit_admin_add: "管理员代缴保证金",
    deposit_admin_deduct: "管理员代扣保证金",
    deposit_refund: "保证金退还",
    admin_adjust: "管理员调整",
  };
  return map[type] ?? type;
}
