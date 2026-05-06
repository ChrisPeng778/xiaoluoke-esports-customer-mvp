"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { statusText } from "@/lib/status";
import { adminRefundOrder, adminSettleOrder, adminUpdateOrderStatus, calculateOrderSettlement, formatCurrency, formatRock, formatTime, readStore } from "@/lib/store";
import type { ChatMessage, Order, StoreShape } from "@/lib/types";

const flow = [
  { key: "created", label: "下单" },
  { key: "paid", label: "收款" },
  { key: "assigned", label: "派单" },
  { key: "accepted", label: "服务中" },
  { key: "worker_completed", label: "待确认" },
  { key: "settled", label: "已完成" },
];

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const order = store.orders.find((item) => item.id === params.id);
  const customer = order ? store.users.find((item) => item.id === order.customerId) : null;
  const worker = order?.workerId ? store.workers.find((item) => item.id === order.workerId) : null;
  const chatSession = store.chat_sessions.find((item) => item.orderId === params.id);
  const messages = chatSession ? store.chat_messages.filter((item) => item.sessionId === chatSession.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : [];
  const ledger = store.wallet_ledger.filter((entry) => entry.relatedOrderId === params.id);

  const run = (action: () => void, success: string) => {
    setMessage("");
    try {
      action();
      refresh();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败");
    }
  };

  if (!order) {
    return <AdminLayout title="订单详情"><AdminCard className="p-8 text-center font-bold text-slate-400">订单不存在</AdminCard></AdminLayout>;
  }

  const quantity = order.quantity ?? 1;
  const unitPrice = quantity ? order.amountRmb / quantity : order.amountRmb;
  const settlement = calculateOrderSettlement(order, worker);
  const workerIncome = ["settled", "worker_completed", "accepted", "disputed"].includes(order.status) ? settlement.workerIncome : 0;
  const platformMargin = ["settled", "worker_completed", "accepted", "disputed"].includes(order.status) ? settlement.platformIncome : Math.max(0, order.amountRmb - workerIncome);
  const statusHistory = order.statusHistory?.length
    ? order.statusHistory
    : [{ id: "created", title: "订单已创建", createdAt: order.createdAt, operator: "system" as const, status: order.status, detail: undefined }];

  return (
    <AdminLayout title="订单详情">
      <section className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="font-black text-blue-600">‹ 返回</Link>
          <div>
            <p className="text-xs font-bold text-slate-400">订单</p>
            <h2 className="text-xl font-black">{order.orderNo}</h2>
          </div>
          <AdminBadge tone={order.status === "settled" ? "green" : order.status === "disputed" ? "rose" : "blue"}>{statusText[order.status]}</AdminBadge>
        </div>
        {message ? <p className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{message}</p> : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <AdminCard className="p-5">
            <div className="flex items-start justify-between gap-3">
              {flow.map((item, index) => {
                const done = isFlowDone(order, item.key);
                return (
                  <div key={item.key} className="flex flex-1 flex-col items-center text-center">
                    <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{done ? "✓" : index + 1}</div>
                    <p className={`mt-2 text-xs font-black ${done ? "text-emerald-600" : "text-slate-400"}`}>{item.label}</p>
                    <p className="mt-1 text-[11px] font-bold text-slate-400">{flowTime(order, item.key)}</p>
                  </div>
                );
              })}
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black">商品明细</h3>
              <span className="text-sm font-bold text-slate-400">共 {quantity} 项</span>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
              <img src={order.productImageUrl || "/images/products/default-product.jpg"} alt={order.productName ?? "商品"} className="h-20 w-20 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-lg font-black">{order.productName ?? "打赏订单"}</h4>
                <p className="mt-1 text-sm font-bold text-slate-400">{order.productCategory ?? order.customProductInfo?.category ?? "-"} · {servicePortText(order.servicePort)}</p>
                <p className="mt-2 text-sm font-bold text-slate-500">单价 {formatCurrency(unitPrice)} × {quantity}</p>
              </div>
              <p className="text-xl font-black text-slate-900">{formatCurrency(order.amountRmb)}</p>
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">接单员提交凭证</h3>
              <span className="text-xs font-bold text-slate-400">{order.submittedAt ? `提交于 ${formatTime(order.submittedAt)}` : "暂无提交时间"}</span>
            </div>
            <div className="mt-4 grid h-32 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm font-bold text-slate-400">暂无凭证</div>
          </AdminCard>

          <AdminCard className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">接单团队 / 接单员信息</h3>
              <span className="text-sm font-bold text-slate-400">{worker ? "已分配 1 / 1" : "未派单"}</span>
            </div>
            {worker ? (
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  {worker.avatarUrl ? <img src={worker.avatarUrl} alt={worker.name} className="h-12 w-12 rounded-full object-cover" /> : <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-xs font-black text-blue-600">接</div>}
                  <div>
                    <p className="font-black">{worker.name}</p>
                    <p className="text-xs font-bold text-slate-400">{worker.level}接单员 · {servicePortText(worker.servicePort)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-amber-600">{formatRock(settlement.workerIncome)} 洛克贝</p>
                  <p className="text-xs font-bold text-emerald-500">{order.status === "settled" ? "已到账" : "未到账"}</p>
                </div>
              </div>
            ) : <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-400">暂无接单员</p>}
          </AdminCard>

          <AdminCard className="p-5">
            <h3 className="text-lg font-black">状态流水</h3>
            <div className="mt-4 space-y-3">
              {statusHistory.map((item) => (
                <div key={item.id} className="border-l-2 border-blue-200 pl-4">
                  <p className="font-black">{item.title}</p>
                  <p className="text-xs font-bold text-slate-400">{formatTime(item.createdAt)} · {item.operator}{item.detail ? ` · ${item.detail}` : ""}</p>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <h3 className="text-lg font-black">聊天记录</h3>
            <div className="mt-4 max-h-[440px] space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4">
              {messages.map((item) => <ChatRow key={item.id} message={item} />)}
              {!messages.length ? <p className="text-center text-sm font-bold text-slate-400">暂无聊天记录</p> : null}
            </div>
          </AdminCard>
        </div>

        <aside className="space-y-4">
          <AdminCard className="p-5">
            <h3 className="text-lg font-black">客户信息</h3>
            <div className="mt-4 space-y-3">
              <Info label="用户昵称" value={customer?.nickname ?? order.customerName} />
              <Info label="用户 ID" value={customer?.displayId ?? order.customerId} />
              <Info label="游戏 ID" value={order.gameId ?? "-"} />
              <Info label="游戏昵称" value={order.gameNickname ?? "-"} />
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <h3 className="text-lg font-black">费用明细</h3>
            <div className="mt-4 space-y-3">
              <Info label="订单总额" value={formatCurrency(order.amountRmb)} />
              <Info label="实收金额" value={formatCurrency(order.amountRmb)} />
              <Info label="平台抽成比例" value={`${settlement.commissionRate}%`} />
              <Info label="接单员收益" value={`${formatRock(workerIncome)} 洛克贝`} />
              <Info label="平台毛利" value={formatCurrency(platformMargin)} />
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <h3 className="text-lg font-black">关键时间</h3>
            <div className="mt-4 space-y-3">
              <Info label="创建" value={formatTime(order.createdAt)} />
              <Info label="收款" value={formatTime(order.paidAt)} />
              <Info label="派单" value={formatTime(order.assignedAt)} />
              <Info label="开始" value={formatTime(order.startedAt)} />
              <Info label="提交完成" value={formatTime(order.submittedAt)} />
              <Info label="完成" value={formatTime(order.settledAt)} />
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <h3 className="text-lg font-black">管理操作</h3>
            <div className="mt-4 grid gap-3">
              <button className="h-11 rounded-xl bg-blue-600 text-sm font-black text-white" onClick={() => run(() => adminSettleOrder(order.id), "管理员结单成功")}>管理员结单</button>
              <button className="h-11 rounded-xl bg-rose-600 text-sm font-black text-white" onClick={() => run(() => adminRefundOrder(order.id), "退款成功")}>退款给顾客</button>
              <button className="h-11 rounded-xl border border-slate-200 text-sm font-black" onClick={() => run(() => adminUpdateOrderStatus(order.id, "disputed"), "已标记有疑问")}>标记有疑问</button>
              <button className="h-11 rounded-xl border border-slate-200 text-sm font-black" onClick={() => run(() => adminUpdateOrderStatus(order.id, "cancelled"), "已关闭订单")}>关闭订单</button>
              <button className="h-11 rounded-xl border border-slate-200 text-sm font-black" onClick={() => run(() => adminUpdateOrderStatus(order.id, "pending"), "已恢复为待接单")}>恢复订单</button>
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <h3 className="text-lg font-black">关联钱包流水</h3>
            <div className="mt-3 space-y-2">
              {ledger.map((entry) => <p key={entry.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">{entry.description} · {formatRock(entry.amount)}</p>)}
              {!ledger.length ? <p className="text-sm font-bold text-slate-400">暂无关联流水</p> : null}
            </div>
          </AdminCard>
        </aside>
      </section>
    </AdminLayout>
  );
}

function isFlowDone(order: Order, key: string) {
  if (key === "created") return true;
  if (key === "paid") return Boolean(order.paidAt) || order.paymentStatus === "paid";
  if (key === "assigned") return Boolean(order.workerId || order.assignedAt);
  if (key === "accepted") return ["accepted", "worker_completed", "settled", "disputed"].includes(order.status);
  if (key === "worker_completed") return ["worker_completed", "settled", "disputed"].includes(order.status);
  if (key === "settled") return order.status === "settled";
  return false;
}

function flowTime(order: Order, key: string) {
  if (key === "created") return formatTime(order.createdAt);
  if (key === "paid") return formatTime(order.paidAt);
  if (key === "assigned") return formatTime(order.assignedAt);
  if (key === "accepted") return formatTime(order.startedAt ?? order.assignedAt);
  if (key === "worker_completed") return formatTime(order.submittedAt);
  if (key === "settled") return formatTime(order.settledAt);
  return "-";
}

function servicePortText(port?: string) {
  if (port === "pc") return "PC端";
  if (port === "both") return "双端";
  return "手游";
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 font-black text-slate-800">{value}</p></div>;
}

function ChatRow({ message }: { message: ChatMessage }) {
  return (
    <div className={`${message.senderRole === "system" ? "text-center" : message.senderRole === "customer" ? "text-right" : "text-left"}`}>
      <p className="mb-1 text-xs font-bold text-slate-400">{message.senderName} · {formatTime(message.createdAt)}</p>
      <div className={`inline-block max-w-[78%] rounded-2xl px-3 py-2 text-sm font-bold ${message.senderRole === "system" ? "bg-slate-200 text-slate-500" : message.senderRole === "customer" ? "bg-blue-600 text-white" : "bg-white text-slate-700"}`}>
        {message.messageType === "image" && message.imageUrl ? <img src={message.imageUrl} alt="聊天图片" className="max-h-56 rounded-xl object-cover" /> : message.content}
      </div>
    </div>
  );
}
