"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AuthPrompt } from "@/components/AuthPrompt";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { useCustomerSession, useStoreSync } from "@/lib/hooks";
import { formatRock, formatTime, getCurrentCustomerOrders, getCurrentCustomerSupportRecords, submitAfterSaleOrder } from "@/lib/store";
import type { AfterSaleOrder, AfterSaleType, Order, SupportPriority } from "@/lib/types";

export default function CustomerAfterSalePage() {
  return (
    <Suspense fallback={null}>
      <AfterSaleContent />
    </Suspense>
  );
}

function AfterSaleContent() {
  const searchParams = useSearchParams();
  const { session, ready, refresh } = useCustomerSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [aftersales, setAftersales] = useState<AfterSaleOrder[]>([]);
  const [orderId, setOrderId] = useState(searchParams.get("orderId") ?? "");
  const [type, setType] = useState<AfterSaleType>("refund");
  const [refundAmount, setRefundAmount] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState<SupportPriority>("high");
  const [message, setMessage] = useState("");

  const loadData = useCallback(() => {
    setOrders(getCurrentCustomerOrders().filter((order) => order.orderType === "service" && Boolean(order.workerId) && !["unpaid", "cancelled", "refunded"].includes(order.status)));
    setAftersales(getCurrentCustomerSupportRecords().aftersales);
  }, []);
  useStoreSync(loadData, ready && Boolean(session), 1500);

  const selectedOrder = useMemo(() => orders.find((order) => order.id === orderId), [orderId, orders]);
  const suggestedRefund = selectedOrder ? formatRock(selectedOrder.amountLockeCoin) : "0";

  if (!ready) return null;

  if (!session) {
    return (
      <main className="page-shell">
        <AppHeader />
        <EmptyState title="请先微信登录" description="登录后可以提交售后申请并查看处理进度。" />
        <button className="primary-button mt-4 w-full" onClick={() => setLoginOpen(true)}>微信一键登录</button>
        <AuthPrompt open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={refresh} />
        <BottomNav />
      </main>
    );
  }

  const submit = () => {
    setMessage("");
    try {
      submitAfterSaleOrder({
        orderId,
        type,
        refundAmount: Number(refundAmount || selectedOrder?.amountLockeCoin || 0),
        reason,
        priority,
      });
      setReason("");
      setRefundAmount("");
      setPriority("high");
      loadData();
      setMessage("售后申请已提交，平台会在管理端处理。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败");
    }
  };

  return (
    <main className="page-shell">
      <AppHeader session={session} />

      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">退款 / 售后</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">当前只记录本地售后处理状态，不接真实退款到账。</p>
        </div>

        <div className="panel space-y-3 p-4">
          <label className="grid gap-2 text-sm font-black text-slate-700">
            选择订单
            <select className="field" value={orderId} onChange={(event) => setOrderId(event.target.value)}>
              <option value="">请选择订单</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>{order.orderNo} · {order.productName ?? "服务订单"}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black text-slate-700">
            售后类型
            <select className="field" value={type} onChange={(event) => setType(event.target.value as AfterSaleType)}>
              <option value="refund">退款申请</option>
              <option value="redo">重新处理</option>
              <option value="other">其他售后</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black text-slate-700">
            申请退款洛克贝
            <input className="field" value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} placeholder={selectedOrder ? `最多 ${suggestedRefund}` : "请先选择订单"} />
          </label>
          <label className="grid gap-2 text-sm font-black text-slate-700">
            原因
            <textarea className="field min-h-28 resize-none py-3" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="请说明售后原因和期望处理方式" />
          </label>
          <label className="grid gap-2 text-sm font-black text-slate-700">
            优先级
            <select className="field" value={priority} onChange={(event) => setPriority(event.target.value as SupportPriority)}>
              <option value="high">较急</option>
              <option value="urgent">紧急</option>
              <option value="normal">普通</option>
              <option value="low">低</option>
            </select>
          </label>
          {selectedOrder ? <p className="rounded-[14px] bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">订单金额 {formatRock(selectedOrder.amountLockeCoin)} 洛克贝，接单员 {selectedOrder.workerName ?? "-"}</p> : null}
          {message ? <p className="rounded-[14px] bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-700">{message}</p> : null}
          <button className="primary-button w-full" onClick={submit}>提交售后申请</button>
        </div>

        <div className="panel p-4">
          <h2 className="text-lg font-black text-slate-900">售后进度</h2>
          <div className="mt-3 space-y-3">
            {aftersales.map((item) => (
              <div key={item.id} className="rounded-[14px] border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{item.orderNo} · {formatTime(item.updatedAt)}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-600">{statusText(item.status)}</span>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-500">申请金额：{formatRock(item.refundAmount)} 洛克贝</p>
                {item.adminReply ? <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600">平台回复：{item.adminReply}</p> : null}
              </div>
            ))}
            {!aftersales.length ? <p className="rounded-[14px] bg-slate-50 p-5 text-center text-sm font-bold text-slate-400">暂无售后记录</p> : null}
          </div>
          <Link href="/customer/orders?tab=after_sale" className="secondary-button mt-3 w-full">查看售后订单</Link>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}

function statusText(status: string) {
  if (status === "processing") return "处理中";
  if (status === "resolved") return "已同意";
  if (status === "closed") return "已关闭";
  if (status === "rejected") return "已拒绝";
  return "待处理";
}
