"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AuthPrompt } from "@/components/AuthPrompt";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { useCustomerSession } from "@/lib/hooks";
import {
  disputeOrder,
  formatCurrency,
  formatRock,
  formatTime,
  getCurrentCustomerOrder,
  getOrderChat,
  settleOrder,
  simulateAcceptOrder,
  simulateWorkerComplete,
} from "@/lib/store";
import type { Order } from "@/lib/types";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session, ready, refresh } = useCustomerSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const loadOrder = () => {
    if (!params.id) return;
    setOrder(getCurrentCustomerOrder(params.id));
    setUnreadCount(getOrderChat(params.id).unreadCount);
  };

  useEffect(() => {
    if (ready) loadOrder();
  }, [ready, params.id, session?.user.id]);

  if (!ready) return null;

  if (!session) {
    return (
      <main className="page-shell">
        <AppHeader />
        <EmptyState title="请先微信登录" description="登录后可以查看订单详情。" />
        <button className="primary-button mt-4 w-full" onClick={() => setLoginOpen(true)}>微信一键登录</button>
        <AuthPrompt open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={refresh} />
        <BottomNav />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="page-shell">
        <AppHeader session={session} />
        <EmptyState title="订单不存在" description="可能不是当前账号的订单，或本地 mock 数据已被清空。" />
        <Link href="/customer/orders" className="secondary-button mt-4 w-full">返回订单列表</Link>
        <BottomNav />
      </main>
    );
  }

  const runAction = (action: () => Order, successText: string) => {
    setMessage("");
    try {
      const nextOrder = action();
      setOrder(nextOrder);
      refresh();
      setMessage(successText);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败");
    }
  };

  return (
    <main className="page-shell">
      <AppHeader session={session} />

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">订单详情</h1>
            <p className="mt-2 text-sm text-slate-500">{order.orderNo}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="panel p-4">
          <div className="rounded-[14px] bg-amber-50 px-3 py-4">
            <p className="text-sm font-bold text-slate-500">当前进度</p>
            <p className="mt-2 text-base font-black leading-6 text-slate-900">{statusMessage(order)}</p>
          </div>

          <dl className="mt-4 grid gap-3 text-sm">
            <DetailRow label="订单类型" value={order.orderType === "tip" ? "打赏订单" : "服务订单"} />
            <DetailRow label={order.orderType === "tip" ? "打赏对象" : "商品名称"} value={order.orderType === "tip" ? order.workerName ?? "-" : order.productName ?? "-"} />
            <DetailRow label="金额" value={`${formatCurrency(order.amountRmb)} / ${formatRock(order.amountLockeCoin)} 洛克贝`} />
            <DetailRow label="支付方式" value={order.paymentMethod === "locke_coin" ? "洛克贝支付" : order.paymentMethod === "wechat" ? "微信支付" : "支付宝支付"} />
            <DetailRow label="下单时间" value={formatTime(order.createdAt)} />
            {order.orderType === "service" ? (
              <>
                <DetailRow label="接单员" value={order.workerName || order.specifiedWorkerName || "等待接单员"} />
                <DetailRow label="接单员安排" value={order.assignmentType === "specified" ? `指定：${order.specifiedWorkerName ?? order.workerName ?? "-"}` : "随机安排"} />
                <DetailRow label="游戏昵称" value={order.gameNickname || "-"} />
                <DetailRow label="ID 编号" value={order.gameId || "-"} />
              </>
            ) : (
              <DetailRow label="备注" value={order.remark || "无"} />
            )}
          </dl>
        </div>

        {order.orderType === "service" ? (
          <div className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">订单沟通</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                  {canOpenChat(order) ? "接单员已接单，可进入订单沟通窗口。" : "等待接单员接单后即可沟通。"}
                </p>
              </div>
              {unreadCount ? (
                <span className="rounded-full bg-rose-500 px-2 py-1 text-xs font-black text-white">{unreadCount}</span>
              ) : null}
            </div>
            <button
              className={`mt-3 w-full ${canOpenChat(order) ? "primary-button" : "secondary-button opacity-60"}`}
              disabled={!canOpenChat(order)}
              onClick={() => router.push(`/customer/chat/${order.id}`)}
            >
              {canOpenChat(order) ? "联系接单员" : "等待接单员接单后即可沟通"}
            </button>
          </div>
        ) : null}

        {order.orderType === "service" && order.status === "worker_completed" ? (
          <div className="grid gap-3">
            <button className="primary-button w-full" onClick={() => runAction(() => settleOrder(order.id), "已确认结单，会员等级已自动更新")}>
              确认结单
            </button>
            <button className="secondary-button w-full" onClick={() => runAction(() => disputeOrder(order.id), "订单已提交疑问，等待管理员处理")}>
              有疑问
            </button>
          </div>
        ) : null}

        {order.status === "disputed" ? (
          <div className="rounded-[14px] bg-rose-50 px-3 py-3 text-sm font-bold text-rose-700">订单已提交疑问，等待管理员处理</div>
        ) : null}

        {message ? <div className="rounded-[14px] bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-700">{message}</div> : null}

        {process.env.NODE_ENV === "development" && order.orderType === "service" ? (
          <div className="panel border-dashed border-rock-gold/70 p-4">
            <p className="mb-3 text-sm font-black text-amber-700">开发测试按钮</p>
            <div className="grid gap-2">
              <button className="secondary-button w-full" disabled={order.status !== "pending"} onClick={() => runAction(() => simulateAcceptOrder(order.id), "已模拟接单")}>
                模拟接单
              </button>
              <button className="secondary-button w-full" disabled={order.status !== "accepted"} onClick={() => runAction(() => simulateWorkerComplete(order.id), "已模拟接单员完成")}>
                模拟接单员完成
              </button>
            </div>
          </div>
        ) : null}

        <button className="secondary-button w-full" onClick={() => router.push("/customer/orders")}>返回订单列表</button>
      </section>

      <BottomNav />
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-none last:pb-0">
      <dt className="shrink-0 font-bold text-slate-500">{label}</dt>
      <dd className="text-right font-black text-slate-900">{value}</dd>
    </div>
  );
}

function statusMessage(order: Order) {
  if (order.orderType === "tip") return order.status === "settled" ? "打赏已完成，接单员洛克贝已入账" : "打赏订单处理中";
  if (order.status === "unpaid") return "订单待付款";
  if (order.status === "pending") return "等待接单员接单";
  if (order.status === "accepted") return "接单员正在完成订单";
  if (order.status === "worker_completed") return "接单员已完成订单，请确认服务是否完成";
  if (order.status === "settled") return "订单已结单，感谢确认";
  if (order.status === "disputed") return "订单已提交疑问，等待管理员处理";
  if (order.status === "after_sale") return "订单正在售后处理中";
  if (order.status === "refunded") return "订单已退款";
  return "订单处理失败";
}

function canOpenChat(order: Order) {
  return (
    order.orderType === "service" &&
    ["accepted", "worker_completed", "disputed", "settled"].includes(order.status) &&
    Boolean(order.workerId && order.workerName)
  );
}
