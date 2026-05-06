"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { statusText } from "@/lib/status";
import { formatCurrency, formatTime, money, readStore } from "@/lib/store";
import type { Order, StoreShape } from "@/lib/types";

const tabs: Array<{ label: string; value: string }> = [
  { label: "全部", value: "all" },
  { label: "待支付", value: "unpaid" },
  { label: "待接单", value: "pending" },
  { label: "待开始", value: "accepted" },
  { label: "服务中", value: "accepted" },
  { label: "待确认 / 待结单", value: "worker_completed" },
  { label: "已完成", value: "settled" },
  { label: "已取消", value: "cancelled" },
  { label: "已退款", value: "refunded" },
  { label: "有疑问", value: "disputed" },
  { label: "打赏订单", value: "tip" },
];

const validAovStatuses = new Set(["paid", "pending", "accepted", "worker_completed", "settled"]);

export default function AdminOrdersPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [status, setStatus] = useState("all");
  const [metric, setMetric] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [filters, setFilters] = useState({
    orderNo: "",
    user: "",
    worker: "",
    product: "",
    gameId: "",
    gameNickname: "",
    minAmount: "",
    maxAmount: "",
    createdAt: "",
    status: "",
  });
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextStatus = params.get("status");
    const nextMetric = params.get("metric");
    if (nextStatus) setStatus(nextStatus);
    if (nextMetric) setMetric(nextMetric);
  }, []);

  const orders = useMemo(() => {
    let rows = store.orders.filter((order) => status === "all" || (status === "tip" ? order.orderType === "tip" : order.status === status));
    if (metric === "gmv") rows = rows.filter((order) => validAovStatuses.has(order.status));
    if (metric === "aov") rows = rows.filter((order) => validAovStatuses.has(order.status)).sort((a, b) => b.amountRmb - a.amountRmb);
    if (filters.status) rows = rows.filter((order) => order.status === filters.status);
    if (filters.orderNo.trim()) rows = rows.filter((order) => order.orderNo.includes(filters.orderNo.trim()));
    if (filters.user.trim()) rows = rows.filter((order) => order.customerName.includes(filters.user.trim()) || order.customerId.includes(filters.user.trim()));
    if (filters.worker.trim()) rows = rows.filter((order) => (order.workerName ?? "").includes(filters.worker.trim()));
    if (filters.product.trim()) rows = rows.filter((order) => (order.productName ?? "").includes(filters.product.trim()));
    if (filters.gameId.trim()) rows = rows.filter((order) => (order.gameId ?? "").includes(filters.gameId.trim()));
    if (filters.gameNickname.trim()) rows = rows.filter((order) => (order.gameNickname ?? "").includes(filters.gameNickname.trim()));
    if (filters.minAmount) rows = rows.filter((order) => order.amountRmb >= Number(filters.minAmount));
    if (filters.maxAmount) rows = rows.filter((order) => order.amountRmb <= Number(filters.maxAmount));
    if (filters.createdAt) rows = rows.filter((order) => order.createdAt.slice(0, 10) === filters.createdAt);
    return rows;
  }, [filters, metric, status, store.orders]);

  const validOrders = orders.filter((order) => validAovStatuses.has(order.status));
  const aovTotal = money(validOrders.reduce((sum, order) => sum + order.amountRmb, 0));
  const aov = validOrders.length ? money(aovTotal / validOrders.length) : 0;

  const reset = () => {
    setFilters({ orderNo: "", user: "", worker: "", product: "", gameId: "", gameNickname: "", minAmount: "", maxAmount: "", createdAt: "", status: "" });
    setStatus("all");
    setMetric("");
  };

  return (
    <AdminLayout title="订单列表">
      <AdminCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">订单管理</h2>
            <p className="mt-1 text-sm font-bold text-slate-400">读取顾客端创建、接单员端处理、后台派单创建的真实订单</p>
          </div>
          <Link href="/admin/orders/create" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">后台派单</Link>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto border-b border-slate-100 pb-2">
          {tabs.map((tab) => (
            <button key={`${tab.label}-${tab.value}`} className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black ${status === tab.value ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-500"}`} onClick={() => setStatus(tab.value)}>
              {tab.label}
            </button>
          ))}
        </div>

        <section className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="订单号" value={filters.orderNo} onChange={(value) => setFilters({ ...filters, orderNo: value })} />
            <Field label="用户昵称 / 用户 ID" value={filters.user} onChange={(value) => setFilters({ ...filters, user: value })} />
            <Field label="接单员昵称" value={filters.worker} onChange={(value) => setFilters({ ...filters, worker: value })} />
            <Field label="商品名称" value={filters.product} onChange={(value) => setFilters({ ...filters, product: value })} />
            {expanded ? (
              <>
                <Field label="游戏 ID" value={filters.gameId} onChange={(value) => setFilters({ ...filters, gameId: value })} />
                <Field label="游戏昵称" value={filters.gameNickname} onChange={(value) => setFilters({ ...filters, gameNickname: value })} />
                <Field label="最低金额" value={filters.minAmount} onChange={(value) => setFilters({ ...filters, minAmount: value })} />
                <Field label="最高金额" value={filters.maxAmount} onChange={(value) => setFilters({ ...filters, maxAmount: value })} />
                <label className="text-xs font-black text-slate-500">创建时间<input type="date" className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={filters.createdAt} onChange={(event) => setFilters({ ...filters, createdAt: event.target.value })} /></label>
                <label className="text-xs font-black text-slate-500">订单状态<select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">全部状态</option>{Object.entries(statusText).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
              </>
            ) : null}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600" onClick={reset}>重置</button>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white" onClick={refresh}>查询</button>
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-blue-600" onClick={() => setExpanded(!expanded)}>{expanded ? "收起筛选" : "展开筛选"}</button>
          </div>
        </section>

        {metric === "aov" ? (
          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <h3 className="font-black text-amber-900">客单价分析提示卡片</h3>
            <p className="mt-2 text-sm font-bold text-amber-700">当前客单价：{formatCurrency(aov)}；参与计算订单：{validOrders.length} 单；参与计算总金额：{formatCurrency(aovTotal)}。列表已按金额从高到低展示。</p>
            <div className="mt-3 flex gap-2">
              <button className="rounded-lg bg-white px-3 py-1.5 text-xs font-black text-amber-700" onClick={() => setFilters({ ...filters, minAmount: String(aov || "") })}>筛选高客单订单</button>
              <button className="rounded-lg bg-white px-3 py-1.5 text-xs font-black text-amber-700" onClick={() => setFilters({ ...filters, maxAmount: String(aov || "") })}>筛选低客单订单</button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>{["订单号", "订单商品", "用户", "状态", "接单员", "总金额", "实付金额", "服务端口", "创建时间", "操作"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-black text-slate-500">{order.orderNo}</td>
                  <td className="px-4 py-4"><p className="font-black">{order.productName ?? "打赏接单员"}</p><p className="text-xs font-bold text-slate-400">{order.orderType === "tip" ? "打赏订单" : "服务订单"} · x{order.quantity ?? 1}</p></td>
                  <td className="px-4 py-4">{order.customerName}</td>
                  <td className="px-4 py-4"><AdminBadge>{statusText[order.status]}</AdminBadge></td>
                  <td className="px-4 py-4">{order.workerName ?? "未接单"}</td>
                  <td className="px-4 py-4 font-black text-amber-600">{formatCurrency(order.amountRmb)}</td>
                  <td className="px-4 py-4">{formatCurrency(order.amountRmb)}</td>
                  <td className="px-4 py-4">{servicePortText(order.servicePort)}</td>
                  <td className="px-4 py-4 text-slate-500">{formatTime(order.createdAt)}</td>
                  <td className="px-4 py-4"><Link href={`/admin/order/${order.id}`} className="font-black text-blue-600">详情</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders.length ? <p className="py-10 text-center text-sm font-bold text-slate-400">暂无订单</p> : null}
        </div>
      </AdminCard>
    </AdminLayout>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-xs font-black text-slate-500">{label}<input className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function servicePortText(port: Order["servicePort"]) {
  if (port === "pc") return "PC端";
  if (port === "both") return "双端";
  return "手游";
}
