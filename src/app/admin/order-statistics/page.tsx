"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { formatCurrency, formatRock, money, readStore } from "@/lib/store";
import type { Order, ProductCategory, ServicePort, StoreShape, Worker } from "@/lib/types";

type OrderCompat = Order & {
  paidAmount?: number;
  totalAmount?: number;
  acceptedAt?: string;
  completedAt?: string;
  workerCompletedAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  deadline?: string;
  aftersaleDeadline?: string;
  afterSaleDeadline?: string;
  platform?: ServicePort;
};

type RangeKey = "今日" | "昨日" | "近7天" | "近30天" | "本月" | "上月" | "自定义";
type CompareMode = "环比" | "同比" | "不对比";
type TrendMode = "订单数" | "GMV" | "全部";
type HeatMetric = "订单量" | "GMV";

const rangeTabs: RangeKey[] = ["今日", "昨日", "近7天", "近30天", "本月", "上月", "自定义"];
const platformTabs: Array<{ label: string; value: "all" | ServicePort }> = [
  { label: "全部", value: "all" },
  { label: "手游端", value: "mobile" },
  { label: "PC端", value: "pc" },
  { label: "双端", value: "both" },
];
const categories: ProductCategory[] = ["PVP专区", "陪玩专区", "资源专区", "异色专区"];
const validStatuses = new Set(["paid", "pending", "assigned", "accepted", "in_service", "worker_completed", "settled", "completed"]);
const noGmvStatuses = new Set(["unpaid", "cancelled", "refunded", "after_sale_refunded", "closed", "failed"]);
const weekLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function AdminOrderStatisticsPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [range, setRange] = useState<RangeKey>("近7天");
  const [platform, setPlatform] = useState<"all" | ServicePort>("all");
  const [compareMode, setCompareMode] = useState<CompareMode>("环比");
  const [trendMode, setTrendMode] = useState<TrendMode>("全部");
  const [heatMetric, setHeatMetric] = useState<HeatMetric>("订单量");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const rangeWindow = useMemo(() => getRangeWindow(range), [range]);
  const scopedOrders = useMemo(
    () => filterOrders(store.orders as OrderCompat[], rangeWindow.start, rangeWindow.end, platform),
    [platform, rangeWindow.end, rangeWindow.start, store.orders],
  );
  const previousOrders = useMemo(
    () => filterOrders(store.orders as OrderCompat[], rangeWindow.prevStart, rangeWindow.prevEnd, platform),
    [platform, rangeWindow.prevEnd, rangeWindow.prevStart, store.orders],
  );

  const currentStats = useMemo(() => summarizeOrders(scopedOrders, store), [scopedOrders, store]);
  const previousStats = useMemo(() => summarizeOrders(previousOrders, store), [previousOrders, store]);
  const trendRows = useMemo(() => buildTrendRows(scopedOrders), [scopedOrders]);
  const heatRows = useMemo(() => buildHeatRows(scopedOrders, heatMetric), [heatMetric, scopedOrders]);
  const funnelRows = useMemo(() => buildFunnelRows(scopedOrders), [scopedOrders]);
  const categoryRows = useMemo(() => buildCategoryRows(scopedOrders, previousOrders), [previousOrders, scopedOrders]);
  const workerRows = useMemo(() => buildWorkerRows(scopedOrders, store), [scopedOrders, store]);
  const risks = useMemo(() => buildRisks(scopedOrders, store), [scopedOrders, store]);
  const insights = useMemo(() => buildInsights(currentStats, previousStats, categoryRows, workerRows, heatRows), [categoryRows, currentStats, heatRows, previousStats, workerRows]);

  const kpis = [
    { label: "订单总数", value: `${currentStats.totalOrders} 单`, previous: previousStats.totalOrders, current: currentStats.totalOrders, href: "/admin/orders?metric=order_count", spark: trendRows.map((row) => row.orderCount), tone: "blue" as const },
    { label: "GMV 成交金额", value: formatCurrency(currentStats.gmv), previous: previousStats.gmv, current: currentStats.gmv, href: "/admin/orders?metric=gmv", spark: trendRows.map((row) => row.gmv), tone: "green" as const },
    { label: "客单价", value: formatCurrency(currentStats.aov), previous: previousStats.aov, current: currentStats.aov, href: "/admin/orders?metric=aov", spark: trendRows.map((row) => row.aov), tone: "amber" as const },
    { label: "成交率", value: `${currentStats.completionRate}%`, previous: previousStats.completionRate, current: currentStats.completionRate, href: "/admin/orders?status=settled", spark: trendRows.map((row) => row.completionRate), tone: "green" as const },
    { label: "取消率", value: `${currentStats.cancelRate}%`, previous: previousStats.cancelRate, current: currentStats.cancelRate, href: "/admin/orders?status=cancelled", spark: trendRows.map((row) => row.cancelRate), tone: "rose" as const },
    { label: "投诉率", value: `${currentStats.complaintRate}%`, previous: previousStats.complaintRate, current: currentStats.complaintRate, href: "/admin/disputes", spark: trendRows.map((row) => row.complaintRate), tone: "rose" as const },
    { label: "平均派单时长", value: `${currentStats.avgDispatchMinutes} 分钟`, previous: previousStats.avgDispatchMinutes, current: currentStats.avgDispatchMinutes, href: "/admin/orders?metric=dispatch_time", spark: trendRows.map((row) => row.avgDispatchMinutes), tone: "purple" as const },
    { label: "订单人均产能", value: `${currentStats.workerCapacity} 单/人`, previous: previousStats.workerCapacity, current: currentStats.workerCapacity, href: "/admin/workers?metric=capacity", spark: trendRows.map((row) => row.workerCapacity), tone: "blue" as const },
  ];

  return (
    <AdminLayout title="订单统计">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">订单统计分析</h2>
            <p className="mt-1 text-sm font-bold text-slate-400">基于 orders、products、users、workers、wallet_ledger、chat_messages 的共享数据计算</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600" onClick={refresh}>刷新</button>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white" onClick={() => alert("导出功能后续完善")}>导出</button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Segment label="时间筛选" items={rangeTabs.map((item) => ({ label: item, value: item }))} value={range} onChange={(value) => setRange(value as RangeKey)} />
          <Segment label="平台筛选" items={platformTabs} value={platform} onChange={(value) => setPlatform(value as "all" | ServicePort)} />
          <Segment label="对比方式" items={["环比", "同比", "不对比"].map((item) => ({ label: item, value: item }))} value={compareMode} onChange={(value) => setCompareMode(value as CompareMode)} />
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <AdminBadge tone={risks.some((risk) => risk.severity === "高") ? "rose" : "blue"}>规则洞察</AdminBadge>
          <p className="text-sm font-black text-slate-700">{insights[0]?.title ?? "当前订单数据平稳"}</p>
          <p className="text-sm font-bold text-slate-500">{insights[0]?.detail ?? "继续观察 GMV、派单时长和投诉率变化。"}</p>
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <Link key={item.label} href={item.href}>
            <AdminCard className="p-4 transition hover:-translate-y-0.5 hover:border-blue-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-500">{item.label}</p>
                  <p className="mt-3 text-2xl font-black text-slate-900">{item.value}</p>
                </div>
                <AdminBadge tone={item.tone}>{compareMode === "不对比" ? "实时" : compareText(item.current, item.previous)}</AdminBadge>
              </div>
              <Sparkline values={item.spark} />
            </AdminCard>
          </Link>
        ))}
      </section>

      <section className="mt-4">
        <AdminCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-black">订单量 & GMV 趋势</h3>
            <div className="flex gap-2">
              {(["订单数", "GMV", "全部"] as const).map((item) => <button key={item} className={`rounded-lg px-3 py-1.5 text-xs font-black ${trendMode === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`} onClick={() => setTrendMode(item)}>{item}</button>)}
            </div>
          </div>
          <TrendChart rows={trendRows} mode={trendMode} />
        </AdminCard>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <AdminCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-black">下单时段热力图</h3>
            <div className="flex gap-2">
              {(["订单量", "GMV"] as const).map((item) => <button key={item} className={`rounded-lg px-3 py-1.5 text-xs font-black ${heatMetric === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`} onClick={() => setHeatMetric(item)}>{item}</button>)}
            </div>
          </div>
          <HeatMap rows={heatRows} />
        </AdminCard>

        <AdminCard className="p-5">
          <h3 className="text-lg font-black">订单生命周期漏斗</h3>
          <div className="mt-4 space-y-3">
            {funnelRows.map((row, index) => (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between text-sm font-bold">
                  <span>{index + 1}. {row.label}</span>
                  <span>{row.count} 单 · {row.rate}%</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${row.warning ? "bg-rose-500" : "bg-blue-500"}`} style={{ width: `${Math.max(2, row.rate)}%` }} />
                </div>
                {row.warning ? <p className="mt-1 text-xs font-bold text-rose-500">{row.warning}</p> : null}
              </div>
            ))}
          </div>
        </AdminCard>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <AdminCard className="p-5">
          <h3 className="text-lg font-black">品类经营矩阵</h3>
          <CategoryMatrix rows={categoryRows} />
        </AdminCard>

        <AdminCard className="p-5">
          <h3 className="text-lg font-black">接单员能力矩阵</h3>
          <WorkerMatrix rows={workerRows} />
        </AdminCard>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <AdminCard className="p-5">
          <h3 className="text-lg font-black">接单员综合排行</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black text-slate-500">
                <tr>{["排名", "接单员昵称", "接单量", "完成率", "平均评分", "准时率", "洛克贝收益", "综合分", "等级标签", "操作"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workerRows.map((row, index) => (
                  <tr key={row.worker.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-black text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3 font-black">{row.worker.name}</td>
                    <td className="px-4 py-3">{row.orderCount}</td>
                    <td className="px-4 py-3">{row.completionRate}%</td>
                    <td className="px-4 py-3">★ {row.rating.toFixed(1)}</td>
                    <td className="px-4 py-3">{row.onTimeRate}%</td>
                    <td className="px-4 py-3">{formatRock(row.earned)} 洛克贝</td>
                    <td className="px-4 py-3 font-black text-emerald-600">{row.score}</td>
                    <td className="px-4 py-3"><AdminBadge tone={row.layer === "风险" ? "rose" : row.layer === "明星" ? "green" : row.layer === "潜力" ? "amber" : "blue"}>{row.layer}</AdminBadge></td>
                    <td className="px-4 py-3"><Link href={`/admin/worker/${row.worker.id}`} className="font-black text-blue-600">查看详情</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>

        <div className="space-y-4">
          <AdminCard className="p-5">
            <h3 className="text-lg font-black">风险告警</h3>
            <div className="mt-4 space-y-3">
              {risks.map((risk) => (
                <Link key={`${risk.title}-${risk.href}`} href={risk.href} className="block rounded-xl border border-slate-100 bg-slate-50 p-3 hover:border-blue-200">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{risk.title}</p>
                    <AdminBadge tone={risk.severity === "高" ? "rose" : risk.severity === "中" ? "amber" : "slate"}>{risk.severity}</AdminBadge>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">{risk.reason}</p>
                  <p className="mt-2 text-xs font-black text-blue-600">去处理 →</p>
                </Link>
              ))}
              {!risks.length ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">暂无触发风险。</p> : null}
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <h3 className="text-lg font-black">智能洞察</h3>
            <div className="mt-4 space-y-3">
              {insights.map((item) => (
                <div key={item.title} className="rounded-xl bg-blue-50 p-3">
                  <p className="font-black text-slate-800">{item.title}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </section>

      <AdminCard className="mt-4 p-5">
        <h3 className="text-lg font-black">数据来源映射</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <tbody className="divide-y divide-slate-100">
              {[
                ["订单状态", "orders.status"],
                ["成交金额", "orders.paidAmount / orders.amount / orders.totalAmount / orders.amountRmb"],
                ["生命周期时间戳", "orders.createdAt / paidAt / assignedAt / acceptedAt / startedAt / submittedAt / settledAt / cancelledAt / refundedAt"],
                ["商品分类", "products.category / order.productCategory / order.customProductInfo.category"],
                ["平台 / 端口", "order.platform / order.servicePort"],
                ["用户会员", "users.memberLevel / users.totalSpent"],
                ["接单员维度", "orders.workerId / workers.rating / workers.completedOrderCount / wallet_ledger"],
                ["投诉 / 纠纷", "orders.status = disputed / after_sale，后续兼容 feedback/disputes"],
                ["售后", "after_sale / refunded / disputed 状态"],
                ["评价", "orders.customerRating，缺失时兼容 workers.rating"],
              ].map(([label, source]) => <tr key={label}><td className="w-48 px-4 py-3 font-black text-slate-600">{label}</td><td className="px-4 py-3 font-bold text-slate-500">{source}</td></tr>)}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminLayout>
  );
}

function Segment({ label, items, value, onChange }: { label: string; items: Array<{ label: string; value: string }>; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2">
      <span className="px-2 text-xs font-black text-slate-400">{label}</span>
      {items.map((item) => <button key={item.value} className={`rounded-lg px-3 py-1.5 text-xs font-black ${value === item.value ? "bg-blue-600 text-white" : "bg-white text-slate-500"}`} onClick={() => onChange(item.value)}>{item.label}</button>)}
    </div>
  );
}

function getRangeWindow(range: RangeKey) {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);
  if (range === "今日") start.setHours(0, 0, 0, 0);
  else if (range === "昨日") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(end.getDate() + 1);
  } else if (range === "近7天") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (range === "近30天") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else if (range === "本月") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === "上月") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    start = new Date(0);
  }
  const duration = Math.max(86400000, end.getTime() - start.getTime());
  const prevEnd = new Date(start);
  const prevStart = new Date(start.getTime() - duration);
  return { start, end, prevStart, prevEnd };
}

function filterOrders(orders: OrderCompat[], start: Date, end: Date, platform: "all" | ServicePort) {
  return orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    const port = order.platform ?? order.servicePort ?? "mobile";
    return createdAt >= start && createdAt < end && (platform === "all" || port === platform);
  });
}

function orderAmount(order: OrderCompat) {
  return money(Number(order.paidAmount ?? order.amount ?? order.totalAmount ?? order.amountRmb ?? order.amountLockeCoin ?? 0));
}

function isEffective(order: OrderCompat) {
  return validStatuses.has(String(order.status)) || (order.orderType === "tip" && order.status === "settled");
}

function isGmvOrder(order: OrderCompat) {
  return isEffective(order) && !noGmvStatuses.has(String(order.status));
}

function isCompleted(order: OrderCompat) {
  return order.status === "settled" || String(order.status) === "completed";
}

function summarizeOrders(orders: OrderCompat[], store: StoreShape) {
  const effective = orders.filter(isEffective);
  const gmvOrders = orders.filter(isGmvOrder);
  const gmv = money(gmvOrders.reduce((sum, order) => sum + orderAmount(order), 0));
  const completed = orders.filter(isCompleted);
  const cancelled = orders.filter((order) => order.status === "cancelled");
  const complaints = orders.filter((order) => order.status === "disputed" || order.status === "after_sale");
  const dispatchSamples = orders
    .map((order) => {
      const from = new Date(order.paidAt ?? order.createdAt).getTime();
      const to = new Date(order.assignedAt ?? order.acceptedAt ?? order.startedAt ?? "").getTime();
      return Number.isFinite(to) && to >= from ? (to - from) / 60000 : null;
    })
    .filter((value): value is number => value !== null);
  const activeWorkers = new Set(effective.map((order) => order.workerId).filter(Boolean)).size || store.workers.filter((worker) => worker.onlineStatus === "online").length || 1;
  return {
    totalOrders: orders.length,
    validOrders: effective.length,
    gmv,
    aov: effective.length ? money(gmv / effective.length) : 0,
    completionRate: effective.length ? money((completed.length / effective.length) * 100) : 0,
    cancelRate: orders.length ? money((cancelled.length / orders.length) * 100) : 0,
    complaintRate: effective.length ? money((complaints.length / effective.length) * 100) : 0,
    avgDispatchMinutes: dispatchSamples.length ? money(dispatchSamples.reduce((sum, value) => sum + value, 0) / dispatchSamples.length) : 0,
    workerCapacity: money(effective.length / activeWorkers),
  };
}

function buildTrendRows(orders: OrderCompat[]) {
  const days = 14;
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const key = date.toISOString().slice(0, 10);
    const rows = orders.filter((order) => order.createdAt.slice(0, 10) === key);
    const stats = summarizeOrders(rows, { workers: [], users: [], products: [], product_categories: [], announcements: [], orders: [], wallet_accounts: [], wallet_ledger: [], recharge_orders: [], recharge_packages: [], withdraw_requests: [], deposit_refunds: [], chat_sessions: [], chat_messages: [], admin_roles: [], admin_users: [], admin_menus: [], admin_logs: [] });
    return { label: key.slice(5), orderCount: rows.length, gmv: stats.gmv, aov: stats.aov, completionRate: stats.completionRate, cancelRate: stats.cancelRate, complaintRate: stats.complaintRate, avgDispatchMinutes: stats.avgDispatchMinutes, workerCapacity: stats.workerCapacity };
  });
}

function compareText(current: number, previous: number) {
  if (!previous) return "无上期";
  const pct = money(((current - previous) / Math.abs(previous)) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * 100},${30 - (value / max) * 28}`).join(" ");
  return <svg viewBox="0 0 100 32" className="mt-4 h-8 w-full"><polyline fill="none" stroke="#5b7cfa" strokeWidth="2" points={points} /></svg>;
}

function TrendChart({ rows, mode }: { rows: ReturnType<typeof buildTrendRows>; mode: TrendMode }) {
  const maxOrders = Math.max(1, ...rows.map((row) => row.orderCount));
  const maxGmv = Math.max(1, ...rows.map((row) => row.gmv));
  const linePoints = rows.map((row, index) => `${60 + index * 68},${250 - (row.gmv / maxGmv) * 210}`).join(" ");
  return (
    <svg viewBox="0 0 1040 300" className="mt-4 h-80 w-full rounded-2xl bg-slate-50">
      {[0, 1, 2, 3, 4].map((line) => <line key={line} x1="50" x2="1000" y1={40 + line * 52} y2={40 + line * 52} stroke="#e5e7eb" strokeDasharray="4 4" />)}
      {rows.map((row, index) => {
        const x = 45 + index * 68;
        const h = Math.max(2, (row.orderCount / maxOrders) * 210);
        return <g key={row.label}>{mode !== "GMV" ? <rect x={x} y={250 - h} width="24" height={h} rx="6" fill="#5b7cfa" opacity="0.75" /> : null}<text x={x - 4} y="278" fontSize="12" fill="#94a3b8">{row.label}</text></g>;
      })}
      {mode !== "订单数" ? <polyline fill="none" stroke="#20c997" strokeWidth="4" points={linePoints} /> : null}
      <text x="50" y="24" fontSize="12" fontWeight="700" fill="#64748b">订单数</text>
      <text x="945" y="24" fontSize="12" fontWeight="700" fill="#20c997">GMV</text>
    </svg>
  );
}

function buildHeatRows(orders: OrderCompat[], metric: HeatMetric) {
  const grid = Array.from({ length: 7 }, (_, day) => Array.from({ length: 24 }, (_, hour) => ({ day, hour, value: 0 })));
  orders.forEach((order) => {
    const date = new Date(order.createdAt);
    grid[date.getDay()][date.getHours()].value += metric === "GMV" ? orderAmount(order) : 1;
  });
  return grid;
}

function HeatMap({ rows }: { rows: ReturnType<typeof buildHeatRows> }) {
  const max = Math.max(1, ...rows.flat().map((cell) => cell.value));
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-[920px]">
        <div className="ml-14 grid gap-1 text-[10px] font-bold text-slate-400" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
          {Array.from({ length: 24 }, (_, hour) => <span key={hour}>{hour}:00</span>)}
        </div>
        {rows.map((row, day) => (
          <div key={weekLabels[day]} className="mt-1 flex items-center gap-2">
            <span className="w-12 text-xs font-black text-slate-500">{weekLabels[day]}</span>
            <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
              {row.map((cell) => <div key={`${cell.day}-${cell.hour}`} title={`${weekLabels[day]} ${cell.hour}:00 · ${cell.value}`} className="h-7 rounded-md" style={{ backgroundColor: `rgba(91,124,250,${0.08 + (cell.value / max) * 0.8})` }} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildFunnelRows(orders: OrderCompat[]) {
  const stages = [
    { label: "创建", count: orders.length },
    { label: "支付", count: orders.filter((order) => Boolean(order.paidAt) || isEffective(order)).length },
    { label: "派单", count: orders.filter((order) => Boolean(order.assignedAt || order.workerId)).length },
    { label: "开始服务", count: orders.filter((order) => ["accepted", "worker_completed", "settled"].includes(String(order.status)) || Boolean(order.startedAt)).length },
    { label: "接单员提交完成", count: orders.filter((order) => ["worker_completed", "settled"].includes(String(order.status)) || Boolean(order.submittedAt || order.workerCompletedAt)).length },
    { label: "顾客确认 / 管理员结单", count: orders.filter(isCompleted).length },
    { label: "完成", count: orders.filter(isCompleted).length },
  ];
  return stages.map((stage, index) => {
    const previous = index === 0 ? stage.count || 1 : stages[index - 1].count || 1;
    const rate = money((stage.count / previous) * 100);
    return { ...stage, rate, warning: index === 2 && rate < 70 ? "派单存在拥堵，请关注在线接单员排班。" : undefined };
  });
}

function categoryOf(order: OrderCompat) {
  return order.productCategory ?? order.customProductInfo?.category ?? "资源专区";
}

function buildCategoryRows(current: OrderCompat[], previous: OrderCompat[]) {
  const currentRows = categories.map((category) => {
    const orders = current.filter((order) => categoryOf(order) === category);
    const prevOrders = previous.filter((order) => categoryOf(order) === category);
    const gmv = money(orders.filter(isGmvOrder).reduce((sum, order) => sum + orderAmount(order), 0));
    const prevGmv = money(prevOrders.filter(isGmvOrder).reduce((sum, order) => sum + orderAmount(order), 0));
    const growth = prevGmv ? money(((gmv - prevGmv) / prevGmv) * 100) : gmv > 0 ? 100 : 0;
    return { category, gmv, growth, orderCount: orders.length };
  });
  const sorted = [...currentRows].sort((a, b) => a.gmv - b.gmv);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)].gmv : 0;
  return currentRows.map((row) => {
    const high = row.gmv >= median;
    const growing = row.growth > 0;
    const quadrant = high && growing ? "加码" : high && !growing ? "守住" : !high && growing ? "培养" : "收缩";
    const suggestion = quadrant === "加码" ? "加大推荐位和资源配置" : quadrant === "守住" ? "维持稳定，防止流失" : quadrant === "培养" ? "增加曝光和活动扶持" : "考虑下架、合并或减少推荐";
    return { ...row, median, quadrant, suggestion };
  });
}

function CategoryMatrix({ rows }: { rows: ReturnType<typeof buildCategoryRows> }) {
  const maxGmv = Math.max(1, ...rows.map((row) => row.gmv));
  return (
    <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_300px]">
      <div className="relative h-72 rounded-2xl bg-slate-50">
        <div className="absolute left-1/2 top-0 h-full border-l border-dashed border-slate-300" />
        <div className="absolute left-0 top-1/2 w-full border-t border-dashed border-slate-300" />
        {rows.map((row) => {
          const left = 8 + (row.gmv / maxGmv) * 80;
          const top = 50 - Math.max(-40, Math.min(40, row.growth)) + 10;
          const size = 28 + Math.min(42, row.orderCount * 4);
          return <div key={row.category} title={`${row.category} GMV ${row.gmv} 增长 ${row.growth}%`} className="absolute grid place-items-center rounded-full bg-blue-500/25 text-xs font-black text-blue-800 ring-2 ring-blue-200" style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}>{row.category.slice(0, 2)}</div>;
        })}
      </div>
      <div className="space-y-2">
        {rows.map((row) => <div key={row.category} className="rounded-xl bg-slate-50 p-3"><p className="font-black">{row.category} · {row.quadrant}</p><p className="text-xs font-bold text-slate-500">GMV {formatCurrency(row.gmv)} · 增长 {row.growth}% · {row.suggestion}</p></div>)}
      </div>
    </div>
  );
}

function ratingOf(worker: Worker) {
  const raw = Number((worker as Worker & { ratingAvg?: number }).ratingAvg ?? worker.rating ?? 5);
  return raw > 5 ? money(raw / 20) : money(raw);
}

function buildWorkerRows(orders: OrderCompat[], store: StoreShape) {
  const maxOrderCount = Math.max(1, ...store.workers.map((worker) => orders.filter((order) => order.workerId === worker.id).length));
  const medianOrderCount = Math.max(1, Math.ceil(maxOrderCount / 2));
  return store.workers.map((worker) => {
    const workerOrders = orders.filter((order) => order.workerId === worker.id || order.specifiedWorkerId === worker.id);
    const completed = workerOrders.filter(isCompleted);
    const rating = ratingOf(worker);
    const onTimeOrders = workerOrders.filter((order) => {
      const started = new Date(order.startedAt ?? order.assignedAt ?? order.createdAt).getTime();
      const done = new Date(order.submittedAt ?? order.settledAt ?? "").getTime();
      return Number.isFinite(done) && done >= started && done - started <= 86400000;
    });
    const earned = money(store.wallet_ledger.filter((entry) => entry.userId === worker.id && entry.direction === "in").reduce((sum, entry) => sum + entry.amount, 0) || worker.totalEarned);
    const completionRate = workerOrders.length ? money((completed.length / workerOrders.length) * 100) : 0;
    const onTimeRate = completed.length ? money((onTimeOrders.length / completed.length) * 100) : completed.length === 0 && workerOrders.length === 0 ? 100 : 0;
    const orderScore = money((workerOrders.length / maxOrderCount) * 100);
    const ratingScore = money((rating / 5) * 100);
    const score = money(orderScore * 0.2 + completionRate * 0.3 + ratingScore * 0.3 + onTimeRate * 0.2);
    const layer = workerOrders.length >= medianOrderCount && rating < 4 ? "风险" : workerOrders.length >= medianOrderCount && rating >= 4.5 ? "明星" : workerOrders.length < medianOrderCount && rating >= 4.5 ? "潜力" : "主力";
    return { worker, orderCount: workerOrders.length, completedCount: completed.length, completionRate, rating, onTimeRate, earned, score, layer };
  }).sort((a, b) => b.score - a.score);
}

function WorkerMatrix({ rows }: { rows: ReturnType<typeof buildWorkerRows> }) {
  const maxOrders = Math.max(1, ...rows.map((row) => row.orderCount));
  const maxEarned = Math.max(1, ...rows.map((row) => row.earned));
  return (
    <div className="mt-4">
      <div className="relative h-72 rounded-2xl bg-slate-50">
        {[1, 2, 3, 4, 5].map((line) => <div key={line} className="absolute left-8 right-4 border-t border-dashed border-slate-200" style={{ top: `${100 - line * 18}%` }} />)}
        {rows.map((row) => {
          const left = 8 + (row.orderCount / maxOrders) * 82;
          const top = 88 - (row.rating / 5) * 78;
          const size = 24 + (row.earned / maxEarned) * 34;
          return <Link key={row.worker.id} href={`/admin/worker/${row.worker.id}`} title={`${row.worker.name} ${row.worker.level} 接单 ${row.orderCount} 完成率 ${row.completionRate}% 评分 ${row.rating} 准时率 ${row.onTimeRate}% 收益 ${row.earned} 综合分 ${row.score}`} className="absolute grid place-items-center rounded-full bg-slate-400/40 text-xs font-black text-slate-800 ring-2 ring-white" style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}>{row.worker.name.slice(0, 1)}</Link>;
        })}
        <span className="absolute left-3 top-3 text-xs font-black text-slate-400">评分</span>
        <span className="absolute bottom-3 right-4 text-xs font-black text-slate-400">接单量</span>
      </div>
      <p className="mt-3 text-xs font-bold text-slate-400">X = 接单量，Y = 评分，气泡 = 洛克贝收益；悬停可查看综合分明细。</p>
    </div>
  );
}

function buildRisks(orders: OrderCompat[], store: StoreShape) {
  const now = Date.now();
  const risks: Array<{ title: string; reason: string; severity: "高" | "中" | "低"; href: string }> = [];
  const unassigned = orders.find((order) => order.paidAt && !order.workerId && !order.assignedAt && now - new Date(order.paidAt).getTime() > 30 * 60000);
  if (unassigned) risks.push({ title: "支付未派单超时", reason: `${unassigned.orderNo} 已支付超过 30 分钟仍未派单`, severity: "高", href: `/admin/order/${unassigned.id}` });
  const serviceTimeout = orders.find((order) => ["accepted", "in_service"].includes(String(order.status)) && now - new Date(order.startedAt ?? order.assignedAt ?? order.createdAt).getTime() > 24 * 3600000);
  if (serviceTimeout) risks.push({ title: "服务超时", reason: `${serviceTimeout.orderNo} 服务中超过 24 小时`, severity: "高", href: `/admin/order/${serviceTimeout.id}` });
  const complaintsByWorker = new Map<string, number>();
  orders.filter((order) => order.status === "disputed" && now - new Date(order.updatedAt).getTime() <= 24 * 3600000).forEach((order) => {
    if (order.workerId) complaintsByWorker.set(order.workerId, (complaintsByWorker.get(order.workerId) ?? 0) + 1);
  });
  const concentrated = Array.from(complaintsByWorker.entries()).find(([, count]) => count >= 2);
  if (concentrated) risks.push({ title: "投诉集中", reason: `同一接单员 24 小时内投诉 ${concentrated[1]} 条`, severity: "中", href: `/admin/worker/${concentrated[0]}` });
  const dayOrders = orders.filter((order) => now - new Date(order.createdAt).getTime() <= 24 * 3600000);
  const abnormalCategory = categories.find((category) => {
    const rows = dayOrders.filter((order) => categoryOf(order) === category);
    return rows.length > 0 && rows.filter((order) => order.status === "cancelled").length / rows.length > 0.2;
  });
  if (abnormalCategory) risks.push({ title: "品类取消异常", reason: `${abnormalCategory} 近 24 小时取消率超过 20%`, severity: "中", href: `/admin/orders?category=${encodeURIComponent(abnormalCategory)}` });
  const staleAfterSale = orders.find((order) => ["after_sale", "disputed"].includes(String(order.status)) && now - new Date(order.updatedAt).getTime() > 48 * 3600000);
  if (staleAfterSale) risks.push({ title: "售后待处理堆积", reason: `${staleAfterSale.orderNo} 已超过 48 小时未处理`, severity: "高", href: "/admin/disputes" });
  if (!risks.length && store.orders.some((order) => order.status === "disputed")) risks.push({ title: "存在疑问订单", reason: "有疑问订单需要持续关注聊天记录和处理结果", severity: "低", href: "/admin/disputes" });
  return risks.slice(0, 5);
}

function buildInsights(current: ReturnType<typeof summarizeOrders>, previous: ReturnType<typeof summarizeOrders>, categoriesRows: ReturnType<typeof buildCategoryRows>, workerRows: ReturnType<typeof buildWorkerRows>, heatRows: ReturnType<typeof buildHeatRows>) {
  const insights: Array<{ title: string; detail: string; rank: number }> = [];
  const gmvChange = previous.gmv ? ((current.gmv - previous.gmv) / previous.gmv) * 100 : 0;
  const topCategory = [...categoriesRows].sort((a, b) => b.gmv - a.gmv)[0];
  if (Math.abs(gmvChange) > 15) insights.push({ title: "GMV 波动", detail: `GMV 环比 ${money(gmvChange)}%，贡献最大的分类是 ${topCategory?.category ?? "暂无"}。`, rank: 2 });
  if (previous.cancelRate && current.cancelRate > previous.cancelRate * 1.5) insights.push({ title: "取消率异常", detail: `当前取消率 ${current.cancelRate}%，高于历史基准，请关注异常品类和时段。`, rank: 2 });
  if (previous.complaintRate && current.complaintRate > previous.complaintRate * 2) insights.push({ title: "投诉率异常", detail: `投诉率达到 ${current.complaintRate}%，建议查看纠纷订单和接单员服务记录。`, rank: 1 });
  if (current.avgDispatchMinutes > 30) insights.push({ title: "派单时长过长", detail: `平均派单 ${current.avgDispatchMinutes} 分钟，可能存在队列拥堵，需要增加在线接单员。`, rank: 1 });
  const weakWorker = workerRows.find((row) => row.rating < 4.5 || row.layer === "风险");
  if (weakWorker) insights.push({ title: "接单员评分预警", detail: `${weakWorker.worker.name} 当前评分 ${weakWorker.rating.toFixed(1)}，建议进行质量沟通。`, rank: 2 });
  const flatHeat = heatRows.flat();
  const avgHeat = flatHeat.reduce((sum, cell) => sum + cell.value, 0) / Math.max(1, flatHeat.length);
  const hotHour = flatHeat.find((cell) => avgHeat > 0 && cell.value > avgHeat * 2);
  if (hotHour) insights.push({ title: "时段订单激增", detail: `${weekLabels[hotHour.day]} ${hotHour.hour}:00 附近订单明显升高，建议安排更多接单员在线。`, rank: 3 });
  if (previous.aov && Math.abs(((current.aov - previous.aov) / previous.aov) * 100) > 20) insights.push({ title: "客单价波动", detail: `客单价变化超过 20%，可能是商品结构发生变化。`, rank: 3 });
  if (!insights.length) insights.push({ title: "运营状态平稳", detail: "当前未触发高风险规则，建议继续观察订单量、GMV 和派单效率。", rank: 3 });
  return insights.sort((a, b) => a.rank - b.rank).slice(0, 3);
}
