"use client";

import { useCallback, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { adminUpdateWithdrawStatus, formatRock, formatTime, hasPermission, readStore } from "@/lib/store";
import type { StoreShape, WithdrawStatus } from "@/lib/types";

export default function AdminWithdrawalsPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);
  const canApprove = hasPermission("finance.withdraw.approve");
  const canReject = hasPermission("finance.withdraw.reject");
  const canPay = hasPermission("finance.withdraw.mark_paid");

  const run = (id: string, status: WithdrawStatus) => {
    if (!confirm("确定处理该提现申请吗？")) return;
    setMessage("");
    try {
      adminUpdateWithdrawStatus(id, status, "管理员后台处理");
      refresh();
      setMessage("提现状态已更新");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "处理失败");
    }
  };

  return (
    <AdminLayout title="提现管理">
      <AdminCard className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">接单员提现申请</h2>
            <p className="mt-1 text-sm font-bold text-slate-400">当前接单员端暂未开放提现申请入口，因此可能为空</p>
          </div>
          {message ? <p className="text-sm font-bold text-blue-600">{message}</p> : null}
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>{["申请编号", "接单员", "申请洛克贝", "当前可用", "状态", "申请时间", "管理员备注", "操作"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {store.withdraw_requests.map((request) => {
                const wallet = store.wallet_accounts.find((item) => item.userId === request.workerId);
                return (
                  <tr key={request.id}>
                    <td className="px-4 py-4 font-black text-slate-500">{request.requestNo}</td>
                    <td className="px-4 py-4 font-black">{request.workerName}</td>
                    <td className="px-4 py-4">{formatRock(request.amountLockeCoin)}</td>
                    <td className="px-4 py-4">{formatRock(wallet?.availableBalance ?? 0)}</td>
                    <td className="px-4 py-4"><AdminBadge>{request.status}</AdminBadge></td>
                    <td className="px-4 py-4 text-slate-500">{formatTime(request.createdAt)}</td>
                    <td className="px-4 py-4">{request.adminRemark ?? "-"}</td>
                    <td className="px-4 py-4"><div className="flex gap-2">{canApprove ? <button onClick={() => run(request.id, "approved")} className="font-black text-blue-600">通过</button> : null}{canReject ? <button onClick={() => run(request.id, "rejected")} className="font-black text-rose-600">拒绝</button> : null}{canPay ? <button onClick={() => run(request.id, "completed")} className="font-black text-emerald-600">已处理</button> : null}{!canApprove && !canReject && !canPay ? <span className="text-sm font-bold text-slate-400" title="无权限操作">无权限操作</span> : null}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!store.withdraw_requests.length ? <p className="py-10 text-center text-sm font-bold text-slate-400">暂无提现申请，功能待接入接单员端</p> : null}
        </div>
      </AdminCard>
    </AdminLayout>
  );
}
