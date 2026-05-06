"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { adminUpdateAfterSaleOrder, adminUpdateOrderComplaint, formatRock, formatTime, readStore } from "@/lib/store";
import type { AfterSaleOrder, OrderComplaint, StoreShape, SupportTicketStatus } from "@/lib/types";

type Row =
  | { kind: "complaint"; item: OrderComplaint }
  | { kind: "aftersale"; item: AfterSaleOrder };

export default function AdminDisputesPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [status, setStatus] = useState<SupportTicketStatus | "all">("all");
  const [kind, setKind] = useState<"all" | Row["kind"]>("all");
  const [keyword, setKeyword] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [reply, setReply] = useState("");
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const rows = useMemo<Row[]>(() => {
    const clean = keyword.trim();
    return [
      ...store.order_complaints.map((item) => ({ kind: "complaint" as const, item })),
      ...store.aftersale_orders.map((item) => ({ kind: "aftersale" as const, item })),
    ]
      .filter((row) => kind === "all" || row.kind === kind)
      .filter((row) => status === "all" || row.item.status === status)
      .filter((row) => !clean || `${row.item.title}${"content" in row.item ? row.item.content : row.item.reason}${row.item.customerName}${row.item.workerName}${row.item.orderNo}`.includes(clean))
      .sort((a, b) => b.item.createdAt.localeCompare(a.item.createdAt));
  }, [keyword, kind, status, store.aftersale_orders, store.order_complaints]);

  const selected = rows.find((row) => `${row.kind}:${row.item.id}` === selectedKey) ?? rows[0] ?? null;

  const run = (action: () => void, text: string) => {
    setMessage("");
    try {
      action();
      refresh();
      setMessage(text);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败");
    }
  };

  const update = (nextStatus: SupportTicketStatus) => {
    if (!selected) return;
    const adminReply = reply || selected.item.adminReply || "";
    run(() => {
      if (selected.kind === "complaint") adminUpdateOrderComplaint(selected.item.id, { status: nextStatus, adminReply });
      else adminUpdateAfterSaleOrder(selected.item.id, { status: nextStatus, adminReply });
    }, "已保存处理结果");
  };

  return (
    <AdminLayout title="订单投诉 / 售后">
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
        <AdminCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">订单投诉与售后处理</h2>
              <p className="mt-1 text-sm font-bold text-slate-400">统一读取 order_complaints 与 aftersale_orders。</p>
            </div>
            <div className="flex gap-2 text-sm font-black">
              <span className="rounded-xl bg-rose-50 px-3 py-2 text-rose-700">投诉 {store.order_complaints.length}</span>
              <span className="rounded-xl bg-amber-50 px-3 py-2 text-amber-700">售后 {store.aftersale_orders.length}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none lg:col-span-2" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索订单、用户、接单员、内容" />
            <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" value={kind} onChange={(event) => setKind(event.target.value as "all" | Row["kind"])}>
              <option value="all">全部类型</option>
              <option value="complaint">订单投诉</option>
              <option value="aftersale">售后申请</option>
            </select>
            <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" value={status} onChange={(event) => setStatus(event.target.value as SupportTicketStatus | "all")}>
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已同意/解决</option>
              <option value="rejected">已拒绝</option>
              <option value="closed">已关闭</option>
            </select>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black text-slate-400">
                <tr>
                  <th className="px-4 py-3">类型 / 标题</th>
                  <th className="px-4 py-3">订单</th>
                  <th className="px-4 py-3">顾客</th>
                  <th className="px-4 py-3">接单员</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={`${row.kind}:${row.item.id}`} className={`cursor-pointer hover:bg-blue-50/40 ${selected?.item.id === row.item.id ? "bg-blue-50/70" : "bg-white"}`} onClick={() => { setSelectedKey(`${row.kind}:${row.item.id}`); setReply(row.item.adminReply ?? ""); }}>
                    <td className="px-4 py-3"><p className="text-xs font-black text-slate-400">{row.kind === "complaint" ? "订单投诉" : "售后申请"}</p><p className="mt-1 font-black text-slate-900">{row.item.title}</p></td>
                    <td className="px-4 py-3 font-bold text-blue-600"><Link href={`/admin/order/${row.item.orderId}`}>{row.item.orderNo ?? row.item.orderId}</Link></td>
                    <td className="px-4 py-3 font-bold text-slate-600">{row.item.customerName || row.item.customerId}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{row.item.workerName || row.item.workerId}</td>
                    <td className="px-4 py-3"><AdminBadge tone={badgeTone(row.item.status)}>{statusText(row.item.status, row.kind)}</AdminBadge></td>
                    <td className="px-4 py-3 font-bold text-slate-500">{formatTime(row.item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length ? <p className="bg-slate-50 p-10 text-center text-sm font-bold text-slate-400">暂无投诉或售后</p> : null}
          </div>
        </AdminCard>

        <AdminCard className="p-5">
          <h2 className="text-xl font-black">处理面板</h2>
          {selected ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-400">{selected.kind === "complaint" ? "订单投诉" : "售后申请"} · {formatTime(selected.item.createdAt)}</p>
                <h3 className="mt-2 text-lg font-black text-slate-900">{selected.item.title}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-6 text-slate-600">{"content" in selected.item ? selected.item.content : selected.item.reason}</p>
                {"refundAmount" in selected.item ? <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-black text-amber-700">申请金额：{formatRock(selected.item.refundAmount)} 洛克贝</p> : null}
                <div className="mt-3 flex gap-3 text-sm font-black">
                  <Link href={`/admin/order/${selected.item.orderId}`} className="text-blue-600">查看订单</Link>
                  <Link href={`/admin/user/${selected.item.customerId}`} className="text-blue-600">查看用户</Link>
                  <Link href={`/admin/worker/${selected.item.workerId}`} className="text-blue-600">查看接单员</Link>
                </div>
              </div>
              <textarea className="min-h-32 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none" value={reply || selected.item.adminReply || ""} onChange={(event) => setReply(event.target.value)} placeholder="填写平台处理说明" />
              {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">{message}</p> : null}
              <div className="grid grid-cols-2 gap-2">
                <button className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-black text-blue-700" onClick={() => update("processing")}>处理中</button>
                <button className="rounded-xl border border-emerald-200 px-3 py-2 text-sm font-black text-emerald-700" onClick={() => update("resolved")}>{selected.kind === "aftersale" ? "同意" : "已解决"}</button>
                <button className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-black text-rose-700" onClick={() => update("rejected")}>拒绝</button>
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-600" onClick={() => update("closed")}>关闭</button>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-slate-50 p-10 text-center text-sm font-bold text-slate-400">请选择一条记录</p>
          )}
        </AdminCard>
      </div>
    </AdminLayout>
  );
}

function statusText(status: SupportTicketStatus, kind: Row["kind"]) {
  if (status === "processing") return "处理中";
  if (status === "resolved") return kind === "aftersale" ? "已同意" : "已解决";
  if (status === "closed") return "已关闭";
  if (status === "rejected") return "已拒绝";
  return "待处理";
}

function badgeTone(status: SupportTicketStatus) {
  if (status === "processing") return "blue";
  if (status === "resolved") return "green";
  if (status === "closed") return "slate";
  if (status === "rejected") return "rose";
  return "amber";
}
