"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { adminAdjustWallet, formatRock, formatTime, readStore } from "@/lib/store";
import { statusText } from "@/lib/status";
import type { StoreShape } from "@/lib/types";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const user = store.users.find((item) => item.id === params.id);
  const wallet = store.wallet_accounts.find((item) => item.userId === params.id);
  const orders = store.orders.filter((order) => order.customerId === params.id);
  const recharges = store.recharge_orders.filter((order) => order.userId === params.id);
  const ledger = store.wallet_ledger.filter((entry) => entry.userId === params.id);

  const adjust = () => {
    setMessage("");
    try {
      adminAdjustWallet({ userId: params.id, direction, amount: Number(amount), reason });
      setAmount("");
      setReason("");
      refresh();
      setMessage("洛克贝调整成功");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "调整失败");
    }
  };

  return (
    <AdminLayout title="用户详情">
      {!user ? (
        <AdminCard className="p-8 text-center font-bold text-slate-400">用户不存在</AdminCard>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <AdminCard className="p-5">
              <h2 className="text-xl font-black">{user.nickname}</h2>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <Info label="用户 ID" value={user.displayId} />
                <Info label="会员等级" value={user.memberLevel} />
                <Info label="可用洛克贝" value={formatRock(wallet?.availableBalance ?? 0)} />
                <Info label="冻结洛克贝" value={formatRock(wallet?.frozenBalance ?? 0)} />
                <Info label="累计消费" value={formatRock(wallet?.totalSpent ?? 0)} />
                <Info label="注册时间" value={formatTime(user.createdAt)} />
              </div>
            </AdminCard>

            <AdminCard className="p-5">
              <h3 className="text-lg font-black">订单记录</h3>
              <div className="mt-3 space-y-2">
                {orders.map((order) => (
                  <Link key={order.id} href={`/admin/order/${order.id}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-black">{order.productName ?? "打赏订单"}</p>
                      <p className="text-xs font-bold text-slate-400">{order.orderNo}</p>
                    </div>
                    <AdminBadge>{statusText[order.status]}</AdminBadge>
                  </Link>
                ))}
                {!orders.length ? <p className="text-sm font-bold text-slate-400">暂无订单</p> : null}
              </div>
            </AdminCard>
          </div>

          <div className="space-y-4">
            <AdminCard className="p-5">
              <h3 className="text-lg font-black">管理员调整洛克贝</h3>
              <div className="mt-4 grid gap-3">
                <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold" value={direction} onChange={(event) => setDirection(event.target.value as "in" | "out")}>
                  <option value="in">增加</option>
                  <option value="out">扣除</option>
                </select>
                <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="数量" value={amount} onChange={(event) => setAmount(event.target.value)} />
                <textarea className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="调整原因" value={reason} onChange={(event) => setReason(event.target.value)} />
                <button className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white" onClick={adjust}>确认调整</button>
                {message ? <p className="text-sm font-bold text-blue-600">{message}</p> : null}
              </div>
            </AdminCard>
            <AdminCard className="p-5">
              <h3 className="text-lg font-black">充值记录</h3>
              <p className="mt-2 text-sm font-bold text-slate-500">共 {recharges.length} 条</p>
            </AdminCard>
            <AdminCard className="p-5">
              <h3 className="text-lg font-black">钱包流水</h3>
              <div className="mt-3 space-y-2">
                {ledger.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-black">{entry.description}</p>
                    <p className="text-xs text-slate-400">{formatTime(entry.createdAt)} · {entry.direction} {formatRock(entry.amount)}</p>
                  </div>
                ))}
              </div>
            </AdminCard>
          </div>
        </section>
      )}
    </AdminLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-800">{value}</p>
    </div>
  );
}
