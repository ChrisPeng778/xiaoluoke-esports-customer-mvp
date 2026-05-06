"use client";

import { useCallback, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { adminAdjustWallet, formatRock, formatTime, hasPermission, readStore } from "@/lib/store";
import type { StoreShape } from "@/lib/types";

export default function AdminWalletPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [targetId, setTargetId] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const owners = useMemo(() => [
    ...store.users.filter((user) => user.role === "customer").map((user) => ({ id: user.id, label: `顾客：${user.nickname}` })),
    ...store.workers.map((worker) => ({ id: worker.id, label: `接单员：${worker.name}` })),
  ], [store.users, store.workers]);
  const canAdjust = hasPermission("finance.wallet.adjust");

  const adjust = () => {
    if (!confirm("确定手动调整洛克贝吗？")) return;
    setMessage("");
    try {
      adminAdjustWallet({ userId: targetId, direction, amount: Number(amount), reason });
      setAmount("");
      setReason("");
      refresh();
      setMessage("调整成功");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "调整失败");
    }
  };

  return (
    <AdminLayout title="钱包管理">
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        {canAdjust ? <AdminCard className="p-5">
          <h2 className="text-xl font-black">钱包流水</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black text-slate-500">
                <tr>{["时间", "用户类型", "用户名称", "流水类型", "方向", "金额", "关联订单", "备注"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {store.wallet_ledger.map((entry) => {
                  const user = store.users.find((item) => item.id === entry.userId);
                  const worker = store.workers.find((item) => item.id === entry.userId);
                  return (
                    <tr key={entry.id}>
                      <td className="px-4 py-4 text-slate-500">{formatTime(entry.createdAt)}</td>
                      <td className="px-4 py-4">{worker ? "接单员" : "顾客"}</td>
                      <td className="px-4 py-4 font-black">{worker?.name ?? user?.nickname ?? entry.userId}</td>
                      <td className="px-4 py-4">{entry.type}</td>
                      <td className="px-4 py-4"><AdminBadge>{entry.direction}</AdminBadge></td>
                      <td className="px-4 py-4 font-black text-amber-600">{formatRock(entry.amount)}</td>
                      <td className="px-4 py-4 text-slate-500">{entry.relatedOrderId ?? "-"}</td>
                      <td className="px-4 py-4">{entry.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminCard> : <AdminCard className="p-5"><h2 className="text-lg font-black">手动调整洛克贝</h2><p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-400" title="无权限操作">无权限操作</p></AdminCard>}
        <AdminCard className="p-5">
          <h2 className="text-lg font-black">手动调整洛克贝</h2>
          <div className="mt-4 grid gap-3">
            <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" value={targetId} onChange={(event) => setTargetId(event.target.value)}>
              <option value="">选择用户或接单员</option>
              {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.label}</option>)}
            </select>
            <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" value={direction} onChange={(event) => setDirection(event.target.value as "in" | "out")}>
              <option value="in">增加</option>
              <option value="out">扣除</option>
            </select>
            <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="数量" value={amount} onChange={(event) => setAmount(event.target.value)} />
            <textarea className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="原因" value={reason} onChange={(event) => setReason(event.target.value)} />
            <button className="h-11 rounded-xl bg-blue-600 text-sm font-black text-white" onClick={adjust}>确认调整</button>
            {message ? <p className="text-sm font-bold text-blue-600">{message}</p> : null}
          </div>
        </AdminCard>
      </section>
    </AdminLayout>
  );
}
