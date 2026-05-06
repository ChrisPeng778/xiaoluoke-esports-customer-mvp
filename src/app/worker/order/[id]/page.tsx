"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkerBottomNav } from "@/components/WorkerBottomNav";
import { WorkerHeader } from "@/components/WorkerHeader";
import { useStoreSync, useWorkerSession } from "@/lib/hooks";
import {
  acceptOrderAsCurrentWorker,
  completeOrderAsCurrentWorker,
  formatCurrency,
  formatRock,
  formatTime,
  getCurrentWorkerOrder,
} from "@/lib/store";
import type { Order } from "@/lib/types";

export default function WorkerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session, ready, refresh } = useWorkerSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");

  const loadOrder = useCallback(() => setOrder(getCurrentWorkerOrder(params.id)), [params.id]);

  useStoreSync(loadOrder, ready && Boolean(session), 1500);

  if (!ready) return null;

  if (!session) {
    return (
      <main className="page-shell">
        <WorkerHeader />
        <EmptyState title="请先登录接单员端" description="登录后可以查看订单详情。" />
        <Link href="/worker/login" className="primary-button mt-4 w-full">进入接单员登录</Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="page-shell">
        <WorkerHeader session={session} />
        <EmptyState title="订单不存在" description="该订单可能已被其他接单员处理，或本地 mock 数据已被清空。" />
        <button className="secondary-button mt-4 w-full" onClick={() => router.push("/worker/orders")}>返回订单列表</button>
        <WorkerBottomNav />
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
      <WorkerHeader session={session} />

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">订单详情</h1>
            <p className="mt-2 text-sm text-stone-500">{order.orderNo}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="panel p-4">
          <div className="rounded-[16px] bg-amber-100 px-3 py-4">
            <p className="text-sm font-bold text-stone-600">当前进度</p>
            <p className="mt-2 text-base font-black leading-6 text-slate-900">{workerStatusMessage(order)}</p>
          </div>

          <dl className="mt-4 grid gap-3 text-sm">
            <DetailRow label="商品名称" value={order.productName ?? "-"} />
            <DetailRow label="顾客昵称" value={order.customerName} />
            <DetailRow label="金额" value={`${formatCurrency(order.amountRmb)} / ${formatRock(order.amountLockeCoin)} 洛克贝`} />
            <DetailRow label="下单时间" value={formatTime(order.createdAt)} />
            <DetailRow label="安排方式" value={order.assignmentType === "specified" ? "指定接单员" : "随机安排"} />
            <DetailRow label="游戏昵称" value={order.gameNickname || "-"} />
            <DetailRow label="ID 编号" value={order.gameId || "-"} />
            <DetailRow label="备注" value={order.remark || "无"} />
          </dl>
        </div>

        <div className="panel p-4">
          <h2 className="text-lg font-black text-slate-900">订单沟通</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-stone-500">
            {order.status === "pending" ? "接单后即可和顾客沟通需求。" : "可进入订单沟通窗口，与顾客确认服务细节。"}
          </p>
          <Link
            href={`/worker/chat/${order.id}`}
            className={`mt-3 w-full ${order.status === "pending" ? "secondary-button opacity-60" : "primary-button"}`}
            aria-disabled={order.status === "pending"}
            onClick={(event) => {
              if (order.status === "pending") event.preventDefault();
            }}
          >
            {order.status === "pending" ? "接单后沟通" : "联系顾客"}
          </Link>
        </div>

        {message ? <p className="rounded-[14px] bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-700">{message}</p> : null}

        {order.status === "pending" ? (
          <button className="primary-button w-full" onClick={() => runAction(() => acceptOrderAsCurrentWorker(order.id), "已接单，可以开始沟通")}>
            立即接单
          </button>
        ) : null}

        {order.status === "accepted" ? (
          <button className="primary-button w-full" onClick={() => runAction(() => completeOrderAsCurrentWorker(order.id), "已标记完成，等待顾客确认")}>
            标记已完成
          </button>
        ) : null}

        <button className="secondary-button w-full" onClick={() => router.push("/worker/orders")}>返回订单列表</button>
      </section>

      <WorkerBottomNav />
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3 last:border-none last:pb-0">
      <dt className="shrink-0 font-bold text-stone-500">{label}</dt>
      <dd className="text-right font-black text-slate-900">{value}</dd>
    </div>
  );
}

function workerStatusMessage(order: Order) {
  if (order.status === "pending") return "订单待接单，请确认需求后接单";
  if (order.status === "accepted") return "订单进行中，完成后请标记已完成";
  if (order.status === "worker_completed") return "已提交完成，等待顾客确认结单";
  if (order.status === "settled") return "订单已结单，收益已入账";
  if (order.status === "disputed") return "顾客已提交疑问，等待平台处理";
  if (order.status === "refunded") return "订单已退款";
  return "订单状态更新中";
}
