"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AuthPrompt } from "@/components/AuthPrompt";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { useCustomerSession, useStoreSync } from "@/lib/hooks";
import {
  formatTime,
  getCurrentCustomerOrders,
  getCurrentCustomerSupportRecords,
  submitFeedbackTicket,
  submitOrderComplaint,
} from "@/lib/store";
import type { FeedbackTicket, Order, OrderComplaint, SupportPriority } from "@/lib/types";

type ReportMode = "feedback" | "question" | "suggestion" | "complaint";

const modes: Array<{ key: ReportMode; label: string }> = [
  { key: "feedback", label: "普通反馈" },
  { key: "question", label: "疑问咨询" },
  { key: "suggestion", label: "功能建议" },
  { key: "complaint", label: "订单投诉" },
];

export default function CustomerReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportContent />
    </Suspense>
  );
}

function ReportContent() {
  const searchParams = useSearchParams();
  const { session, ready, refresh } = useCustomerSession();
  const initialMode = (searchParams.get("type") as ReportMode) || "feedback";
  const [loginOpen, setLoginOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [records, setRecords] = useState<ReturnType<typeof getCurrentCustomerSupportRecords>>({ feedback: [], complaints: [], aftersales: [], reviews: [] });
  const [mode, setMode] = useState<ReportMode>(modes.some((item) => item.key === initialMode) ? initialMode : "feedback");
  const [orderId, setOrderId] = useState(searchParams.get("orderId") ?? "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<SupportPriority>("normal");
  const [message, setMessage] = useState("");

  const loadData = useCallback(() => {
    setOrders(getCurrentCustomerOrders().filter((order) => order.orderType === "service"));
    setRecords(getCurrentCustomerSupportRecords());
  }, []);
  useStoreSync(loadData, ready && Boolean(session), 1500);

  const selectedOrder = useMemo(() => orders.find((order) => order.id === orderId), [orderId, orders]);
  const needsOrder = mode === "complaint";

  if (!ready) return null;

  if (!session) {
    return (
      <main className="page-shell">
        <AppHeader />
        <EmptyState title="请先微信登录" description="登录后可以提交反馈、疑问和订单投诉。" />
        <button className="primary-button mt-4 w-full" onClick={() => setLoginOpen(true)}>微信一键登录</button>
        <AuthPrompt open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={refresh} />
        <BottomNav />
      </main>
    );
  }

  const submit = () => {
    setMessage("");
    try {
      if (mode === "complaint") {
        submitOrderComplaint({ type: "complaint", orderId, title, content, priority });
      } else {
        submitFeedbackTicket({ type: mode, orderId: selectedOrder?.id ?? null, title, content, priority });
      }
      setTitle("");
      setContent("");
      setPriority("normal");
      loadData();
      setMessage("已提交，平台会在管理端统一处理。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败");
    }
  };

  return (
    <main className="page-shell">
      <AppHeader session={session} />

      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">反馈与投诉</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">提交后会同步到平台管理端处理列表。</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {modes.map((item) => (
            <button key={item.key} className={`h-11 rounded-2xl text-sm font-black ${mode === item.key ? "bg-rock-gold text-slate-900" : "bg-white text-slate-500"}`} onClick={() => setMode(item.key)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="panel space-y-3 p-4">
          <label className="grid gap-2 text-sm font-black text-slate-700">
            关联订单{needsOrder ? "" : "（可选）"}
            <select className="field" value={orderId} onChange={(event) => setOrderId(event.target.value)}>
              <option value="">不关联订单</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>{order.orderNo} · {order.productName ?? "服务订单"}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black text-slate-700">
            标题
            <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="请简单描述问题" />
          </label>
          <label className="grid gap-2 text-sm font-black text-slate-700">
            内容
            <textarea className="field min-h-28 resize-none py-3" value={content} onChange={(event) => setContent(event.target.value)} placeholder="请写明发生了什么、希望如何处理" />
          </label>
          <label className="grid gap-2 text-sm font-black text-slate-700">
            优先级
            <select className="field" value={priority} onChange={(event) => setPriority(event.target.value as SupportPriority)}>
              <option value="normal">普通</option>
              <option value="high">较急</option>
              <option value="urgent">紧急</option>
              <option value="low">低</option>
            </select>
          </label>
          {selectedOrder ? <p className="rounded-[14px] bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">已带入订单：{selectedOrder.orderNo} · 接单员 {selectedOrder.workerName ?? "未接单"}</p> : null}
          {message ? <p className="rounded-[14px] bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-700">{message}</p> : null}
          <button className="primary-button w-full" onClick={submit}>提交</button>
        </div>

        <div className="panel p-4">
          <h2 className="text-lg font-black text-slate-900">处理进度</h2>
          <div className="mt-3 space-y-3">
            {[...records.complaints, ...records.feedback].slice(0, 8).map((item) => (
              <ProgressItem key={item.id} item={item} />
            ))}
            {!records.complaints.length && !records.feedback.length ? <p className="rounded-[14px] bg-slate-50 p-5 text-center text-sm font-bold text-slate-400">暂无反馈记录</p> : null}
          </div>
          <Link href="/customer/orders?tab=disputed" className="secondary-button mt-3 w-full">查看疑问订单</Link>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}

function ProgressItem({ item }: { item: FeedbackTicket | OrderComplaint }) {
  return (
    <div className="rounded-[14px] border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-900">{item.title}</p>
          <p className="mt-1 text-xs font-bold text-slate-400">{item.orderNo ? `${item.orderNo} · ` : ""}{formatTime(item.updatedAt)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-black text-slate-600">{statusText(item.status)}</span>
      </div>
      {item.adminReply ? <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600">平台回复：{item.adminReply}</p> : null}
    </div>
  );
}

function statusText(status: string) {
  if (status === "processing") return "处理中";
  if (status === "resolved") return "已解决";
  if (status === "closed") return "已关闭";
  if (status === "rejected") return "已拒绝";
  return "待处理";
}
