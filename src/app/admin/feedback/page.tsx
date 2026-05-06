"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { adminDeleteFeedbackTicket, adminUpdateFeedbackTicket, formatTime, hasPermission, readStore } from "@/lib/store";
import type { FeedbackTicket, StoreShape, SupportTicketStatus } from "@/lib/types";

const typeText: Record<FeedbackTicket["type"], string> = {
  feedback: "普通反馈",
  question: "疑问咨询",
  suggestion: "功能建议",
};

export default function AdminFeedbackPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<FeedbackTicket["type"] | "all">("all");
  const [status, setStatus] = useState<SupportTicketStatus | "all">("all");
  const [selectedId, setSelectedId] = useState("");
  const [reply, setReply] = useState("");
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const rows = useMemo(() => {
    const clean = keyword.trim();
    return store.feedback_tickets
      .filter((item) => type === "all" || item.type === type)
      .filter((item) => status === "all" || item.status === status)
      .filter((item) => !clean || `${item.title}${item.content}${item.customerName}${item.customerId}${item.orderNo ?? ""}`.includes(clean))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [keyword, status, store.feedback_tickets, type]);

  const selected = rows.find((item) => item.id === selectedId) ?? rows[0] ?? null;
  const canReply = hasPermission("feedback.feedback.reply");
  const canDelete = hasPermission("feedback.feedback.delete");

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
    run(() => adminUpdateFeedbackTicket(selected.id, { status: nextStatus, adminReply: reply || selected.adminReply }), "已保存处理结果");
  };

  return (
    <AdminLayout title="反馈列表">
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <AdminCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">普通反馈 / 疑问咨询</h2>
              <p className="mt-1 text-sm font-bold text-slate-400">来自顾客端 /customer/report 的反馈与问题。</p>
            </div>
            <Link href="/admin/feedback/reviews" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white">评价管理</Link>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none lg:col-span-2" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索标题、用户、订单、内容" />
            <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" value={type} onChange={(event) => setType(event.target.value as FeedbackTicket["type"] | "all")}>
              <option value="all">全部类型</option>
              <option value="feedback">普通反馈</option>
              <option value="question">疑问咨询</option>
              <option value="suggestion">功能建议</option>
            </select>
            <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" value={status} onChange={(event) => setStatus(event.target.value as SupportTicketStatus | "all")}>
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black text-slate-400">
                <tr>
                  <th className="px-4 py-3">标题</th>
                  <th className="px-4 py-3">类型</th>
                  <th className="px-4 py-3">用户</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((item) => (
                  <tr key={item.id} className={`cursor-pointer hover:bg-blue-50/40 ${selected?.id === item.id ? "bg-blue-50/70" : "bg-white"}`} onClick={() => { setSelectedId(item.id); setReply(item.adminReply ?? ""); }}>
                    <td className="px-4 py-3 font-black text-slate-900">{item.title}<p className="mt-1 text-xs font-bold text-slate-400">{item.orderNo ?? "未关联订单"}</p></td>
                    <td className="px-4 py-3 font-bold text-slate-600">{typeText[item.type]}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{item.customerName || item.customerId}</td>
                    <td className="px-4 py-3"><AdminBadge tone={badgeTone(item.status)}>{statusText(item.status)}</AdminBadge></td>
                    <td className="px-4 py-3 font-bold text-slate-500">{formatTime(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length ? <p className="bg-slate-50 p-10 text-center text-sm font-bold text-slate-400">暂无反馈</p> : null}
          </div>
        </AdminCard>

        <AdminCard className="p-5">
          <h2 className="text-xl font-black">处理详情</h2>
          {selected ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-400">{typeText[selected.type]} · {formatTime(selected.createdAt)}</p>
                <h3 className="mt-2 text-lg font-black text-slate-900">{selected.title}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-6 text-slate-600">{selected.content}</p>
                {selected.orderId ? <Link href={`/admin/order/${selected.orderId}`} className="mt-3 inline-flex text-sm font-black text-blue-600">查看关联订单</Link> : null}
              </div>
              <textarea className="min-h-32 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none" value={reply || selected.adminReply || ""} onChange={(event) => setReply(event.target.value)} placeholder="填写平台回复" />
              {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">{message}</p> : null}
              <div className="grid grid-cols-2 gap-2">
                {canReply ? <button className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-black text-blue-700" onClick={() => update("processing")}>标记处理中</button> : null}
                {canReply ? <button className="rounded-xl border border-emerald-200 px-3 py-2 text-sm font-black text-emerald-700" onClick={() => update("resolved")}>标记已解决</button> : null}
                {canReply ? <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-600" onClick={() => update("closed")}>关闭</button> : null}
                {canDelete ? <button className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-black text-rose-700" onClick={() => { if (!confirm("确定删除该反馈吗？")) return; run(() => adminDeleteFeedbackTicket(selected.id), "已删除反馈"); }}>删除</button> : null}
                {!canReply && !canDelete ? <span className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-400" title="无权限操作">无权限操作</span> : null}
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-slate-50 p-10 text-center text-sm font-bold text-slate-400">请选择一条反馈</p>
          )}
        </AdminCard>
      </div>
    </AdminLayout>
  );
}

function statusText(status: SupportTicketStatus) {
  if (status === "processing") return "处理中";
  if (status === "resolved") return "已解决";
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
