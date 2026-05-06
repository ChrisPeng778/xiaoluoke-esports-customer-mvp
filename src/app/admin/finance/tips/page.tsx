"use client";

import { useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { formatCurrency, formatTime, readStore } from "@/lib/store";
import type { Order, StoreShape } from "@/lib/types";

const tabs = [
  ["all", "全部"],
  ["unpaid", "待支付"],
  ["settled", "已支付"],
  ["failed", "失败"],
] as const;

export default function FinanceTipsPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("all");
  const [userId, setUserId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const rows = store.orders
    .filter((order) => order.orderType === "tip")
    .filter((order) => tab === "all" || (tab === "settled" ? order.status === "settled" || order.status === "paid" : order.status === tab))
    .filter((order) => !userId || order.customerId.includes(userId))
    .filter((order) => !workerId || (order.workerId ?? "").includes(workerId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <AdminLayout title="打赏记录">
      <div className="space-y-4">
        <AdminCard className="p-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
            {tabs.map(([value, label]) => <button key={value} className={`rounded-xl px-4 py-2 text-sm font-black ${tab === value ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600"}`} onClick={() => setTab(value)}>{label}</button>)}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <input className="admin-field" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="用户 ID" />
            <input className="admin-field" value={workerId} onChange={(e) => setWorkerId(e.target.value)} placeholder="接单员 ID" />
            <button className="admin-secondary" onClick={() => { setUserId(""); setWorkerId(""); setStore(readStore()); }}>重置 / 刷新</button>
          </div>
        </AdminCard>
        <AdminCard className="overflow-hidden">
          <table className="admin-table">
            <thead><tr><th>ID</th><th>打赏用户</th><th>被打赏接单员</th><th>金额</th><th>留言</th><th>关联订单</th><th>状态</th><th>支付时间</th><th>创建时间</th><th>操作</th></tr></thead>
            <tbody>
              {rows.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono text-xs">{order.orderNo}</td>
                  <td>{order.customerName}<p className="text-xs text-slate-400">{order.customerId}</p></td>
                  <td>{order.workerName ?? "-"}<p className="text-xs text-slate-400">{order.workerId ?? "-"}</p></td>
                  <td className="font-black">{formatCurrency(order.amountRmb)}</td>
                  <td className="max-w-[180px] truncate">{order.remark || "-"}</td>
                  <td>{order.orderNo}</td>
                  <td><AdminBadge tone={order.status === "settled" || order.status === "paid" ? "green" : order.status === "failed" ? "rose" : "slate"}>{order.status === "settled" || order.status === "paid" ? "已支付" : order.status === "failed" ? "失败" : "待支付"}</AdminBadge></td>
                  <td>{order.paidAt ? formatTime(order.paidAt) : "-"}</td>
                  <td>{formatTime(order.createdAt)}</td>
                  <td><button className="admin-link" onClick={() => setSelected(order)}>详情</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? <p className="py-12 text-center text-sm font-bold text-slate-400">暂无打赏记录</p> : null}
        </AdminCard>
      </div>
      {selected ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal w-full max-w-xl p-5">
            <div className="mb-4 flex justify-between"><h2 className="text-xl font-black">打赏详情</h2><button className="admin-close" onClick={() => setSelected(null)}>×</button></div>
            <div className="space-y-2 text-sm font-bold text-slate-600">
              <p>打赏单号：{selected.orderNo}</p>
              <p>打赏用户：{selected.customerName}</p>
              <p>被打赏接单员：{selected.workerName}</p>
              <p>金额：{formatCurrency(selected.amountRmb)}</p>
              <p>留言：{selected.remark || "-"}</p>
              <p>创建时间：{formatTime(selected.createdAt)}</p>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
