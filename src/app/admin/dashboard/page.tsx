"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { formatCurrency, money, readStore } from "@/lib/store";
import type { Order, StoreShape } from "@/lib/types";

const rangeTabs = ["今日", "昨日", "近7天", "近30天", "本月", "上月", "自定义"];
const validRevenueStatuses = new Set(["settled"]);
const paidStatuses = new Set(["paid", "pending", "accepted", "worker_completed", "settled", "disputed", "after_sale", "refunded", "after_sale_refunded"]);

export default function AdminDashboardPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [range, setRange] = useState("本月");
  const [chartMetric, setChartMetric] = useState<"订单数" | "GMV" | "客单价" | "完成率">("订单数");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const scopedOrders = useMemo(() => filterOrdersByRange(store.orders, range), [store.orders, range]);
  const settledOrders = scopedOrders.filter((order) => order.status === "settled");
  const revenueOrders = scopedOrders.filter((order) => validRevenueStatuses.has(order.status) || order.orderType === "tip");
  const gmv = money(revenueOrders.reduce((sum, order) => sum + order.amountRmb, 0));
  const orderCount = scopedOrders.length;
  const average = revenueOrders.length ? money(gmv / revenueOrders.length) : 0;
  const completionRate = revenueOrders.length ? money((settledOrders.length / revenueOrders.length) * 100) : 0;
  const refunded = scopedOrders.filter((order) => order.status === "refunded" || order.status === "after_sale_refunded");
  const paidOrders = scopedOrders.filter((order) => paidStatuses.has(order.status));
  const refundRate = paidOrders.length ? money((refunded.length / paidOrders.length) * 100) : 0;
  const activeUsers = new Set(scopedOrders.map((order) => order.customerId)).size;
  const newWorkers = store.workers.filter((worker) => worker.completedOrderCount <= 60).length;
  const target = store.system_settings.businessTarget;
  const targetMonth = target.month || new Date().toISOString().slice(0, 7);
  const targetOrders = store.orders.filter((order) => order.createdAt.slice(0, 7) === targetMonth);
  const targetGmv = money(targetOrders.filter((order) => order.status === "settled").reduce((sum, order) => sum + order.amountRmb, 0));
  const targetOrderCount = targetOrders.length;

  const cards = [
    { label: "营收 GMV", value: formatCurrency(gmv), href: "/admin/orders?metric=gmv", tone: "blue" as const },
    { label: "订单数", value: `${orderCount}`, href: "/admin/orders?metric=orders", tone: "purple" as const },
    { label: "客单价", value: formatCurrency(average), href: "/admin/orders?metric=aov", tone: "amber" as const },
    { label: "订单完成率", value: `${completionRate}%`, href: "/admin/orders?status=settled", tone: "green" as const },
    { label: "退款率", value: `${refundRate}%`, href: "/admin/orders?status=refunded", tone: "rose" as const },
    { label: "活跃用户", value: `${activeUsers}`, href: "/admin/users?status=active", tone: "blue" as const },
    { label: "新增接单员", value: `${newWorkers}`, href: "/admin/workers?filter=new", tone: "purple" as const },
    { label: "访问量", value: "0", href: "/admin/dashboard", tone: "slate" as const },
  ];

  const pendingItems = [
    { label: "待接单订单", count: store.orders.filter((order) => order.status === "pending").length, href: "/admin/orders?status=pending", tone: "amber" as const },
    { label: "待结单订单", count: store.orders.filter((order) => order.status === "worker_completed").length, href: "/admin/orders?status=worker_completed", tone: "purple" as const },
    { label: "有疑问订单", count: store.orders.filter((order) => order.status === "disputed").length, href: "/admin/disputes", tone: "rose" as const },
    { label: "待处理提现", count: store.withdraw_requests.filter((item) => item.status === "pending").length, href: "/admin/withdrawals", tone: "blue" as const },
    { label: "保证金退还申请", count: store.workers.filter((worker) => worker.depositStatus === "refund_pending").length, href: "/admin/workers", tone: "amber" as const },
    { label: "反馈/投诉", count: store.feedback_tickets.length + store.order_complaints.length + store.aftersale_orders.length, href: "/admin/feedback", tone: "slate" as const },
  ];

  const chartRows = buildChartRows(scopedOrders, chartMetric);
  const maxValue = Math.max(1, ...chartRows.map((row) => row.value));

  return (
    <AdminLayout title="综合面板">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-xl font-black text-white">管</div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">早上好，管理员</h2>
              <p className="mt-1 text-sm font-bold text-slate-400">{new Date().toLocaleDateString("zh-CN")} · 小洛克电竞数据已读取</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600" onClick={refresh}>刷新</button>
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600" onClick={() => alert("导出功能后续完善。")}>导出</button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {rangeTabs.map((tab) => (
            <button key={tab} className={`rounded-lg px-4 py-2 text-sm font-black ${range === tab ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-500"}`} onClick={() => setRange(tab)}>
              {tab}
            </button>
          ))}
        </div>
      </section>

      <h2 className="mt-6 text-base font-black text-slate-900">核心指标</h2>
      <Link href="/admin/order-statistics" className="mt-3 flex items-center justify-between rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-5 py-4 text-sm font-black text-blue-700">
        <span>订单统计分析 → 深入查看趋势、热力图、生命周期漏斗、品类矩阵和接单员能力矩阵</span>
        <span className="text-slate-400">/admin/order-statistics</span>
      </Link>
      <section className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            onClick={(event) => {
              if (card.label === "访问量") {
                event.preventDefault();
                alert("访问量统计后续接入真实埋点。");
              }
            }}
          >
            <AdminCard className="p-5 transition hover:-translate-y-0.5 hover:border-blue-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-500">{card.label}</p>
                  <p className="mt-4 text-2xl font-black text-slate-900">{card.value}</p>
                  <p className="mt-3 text-xs font-bold text-emerald-500">读取共享数据</p>
                </div>
                <AdminBadge tone={card.tone}>实时</AdminBadge>
              </div>
            </AdminCard>
          </Link>
        ))}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <AdminCard className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">本月 GMV 目标</h2>
            <Link href="/admin/settings/business-target" className="text-sm font-bold text-blue-600">配置 →</Link>
          </div>
          <p className="mt-4 text-2xl font-black text-slate-900">{formatCurrency(targetGmv)} / {target.gmvTarget ? formatCurrency(target.gmvTarget) : "未设置"}</p>
          <Progress current={targetGmv} target={target.gmvTarget} />
        </AdminCard>
        <AdminCard className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">本月订单目标</h2>
            <Link href="/admin/settings/business-target" className="text-sm font-bold text-blue-600">配置 →</Link>
          </div>
          <p className="mt-4 text-2xl font-black text-slate-900">{targetOrderCount} / {target.orderCountTarget ?? "未设置"} 单</p>
          <Progress current={targetOrderCount} target={target.orderCountTarget} />
        </AdminCard>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.6fr]">
        <AdminCard className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">待处理事项</h2>
            <Link href="/admin/orders" className="text-sm font-bold text-blue-600">全部 →</Link>
          </div>
          <div className="mt-4 space-y-3">
            {pendingItems.map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-blue-200">
                <div className="flex items-center gap-3">
                  <AdminBadge tone={item.tone}>{item.count}</AdminBadge>
                  <span className="text-sm font-black text-slate-700">{item.label}</span>
                </div>
                <span className="text-slate-300">›</span>
              </Link>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black">订单趋势</h2>
            <div className="flex gap-2">
              {(["订单数", "GMV", "客单价", "完成率"] as const).map((item) => (
                <button key={item} className={`rounded-lg px-3 py-1.5 text-xs font-black ${chartMetric === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`} onClick={() => setChartMetric(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex h-72 items-end gap-2 overflow-x-auto border-b border-slate-100 pb-2">
            {chartRows.map((row) => (
              <div key={row.label} className="flex min-w-10 flex-1 flex-col items-center gap-2">
                <div className="flex h-56 w-full items-end justify-center rounded-t-lg bg-slate-50">
                  <div className="w-5 rounded-t-lg bg-blue-500" style={{ height: `${Math.max(4, (row.value / maxValue) * 100)}%` }} />
                </div>
                <span className="text-[11px] font-bold text-slate-400">{row.label}</span>
              </div>
            ))}
          </div>
        </AdminCard>
      </section>
    </AdminLayout>
  );
}

function Progress({ current, target }: { current: number; target: number | null }) {
  const percent = target && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="mt-4">
      <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} /></div>
      <p className="mt-2 text-xs font-black text-slate-400">{target ? `达成 ${percent}%` : "目标为空时不计算达成率"}</p>
    </div>
  );
}

function filterOrdersByRange(orders: Order[], range: string) {
  const nowDate = new Date();
  const start = new Date(nowDate);
  if (range === "今日") start.setHours(0, 0, 0, 0);
  else if (range === "昨日") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return orders.filter((order) => new Date(order.createdAt) >= start && new Date(order.createdAt) < end);
  } else if (range === "近7天") start.setDate(start.getDate() - 6);
  else if (range === "近30天") start.setDate(start.getDate() - 29);
  else if (range === "本月") start.setDate(1), start.setHours(0, 0, 0, 0);
  else if (range === "上月") {
    start.setMonth(start.getMonth() - 1, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return orders.filter((order) => new Date(order.createdAt) >= start && new Date(order.createdAt) < end);
  } else return orders;
  return orders.filter((order) => new Date(order.createdAt) >= start);
}

function buildChartRows(orders: Order[], metric: "订单数" | "GMV" | "客单价" | "完成率") {
  const rows = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const key = date.toISOString().slice(0, 10);
    const dayOrders = orders.filter((order) => order.createdAt.slice(0, 10) === key);
    const revenueOrders = dayOrders.filter((order) => validRevenueStatuses.has(order.status) || order.orderType === "tip");
    const settled = dayOrders.filter((order) => order.status === "settled");
    const gmv = revenueOrders.reduce((sum, order) => sum + order.amountRmb, 0);
    const value =
      metric === "订单数"
        ? dayOrders.length
        : metric === "GMV"
          ? gmv
          : metric === "客单价"
            ? revenueOrders.length ? gmv / revenueOrders.length : 0
            : dayOrders.length ? (settled.length / dayOrders.length) * 100 : 0;
    return { label: key.slice(5), value: money(value) };
  });
  return rows;
}
