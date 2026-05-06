"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { statusText } from "@/lib/status";
import {
  adminAdjustWallet,
  adminPayWorkerDeposit,
  adminSetWorkerFrozen,
  adminUpdateWorkerCommission,
  adminUpdateWorkerLevel,
  formatRock,
  formatTime,
  hasPermission,
  readStore,
  workerLevelLabel,
} from "@/lib/store";
import type { ServicePort, StoreShape, WorkerLevel } from "@/lib/types";

const levels: WorkerLevel[] = ["明星", "金牌", "银牌", "铜牌", "见习"];

export default function AdminWorkerDetailPage() {
  const params = useParams<{ id: string }>();
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [reason, setReason] = useState("");
  const [commission, setCommission] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"base" | "orders" | "finance" | "deposit" | "withdraw">("base");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const worker = store.workers.find((item) => item.id === params.id);
  const wallet = store.wallet_accounts.find((item) => item.userId === params.id);
  const orders = store.orders.filter((order) => order.workerId === params.id || order.specifiedWorkerId === params.id);
  const ledger = store.wallet_ledger.filter((entry) => entry.userId === params.id);
  const withdrawals = store.withdraw_requests.filter((item) => item.workerId === params.id);
  const canEdit = hasPermission("workers.edit");
  const canFreeze = hasPermission("workers.freeze");
  const canUnfreeze = hasPermission("workers.unfreeze");
  const canAdjustDeposit = hasPermission("workers.deposit_adjust");
  const canAdjustBalance = hasPermission("workers.balance_adjust");
  const canSetCommission = hasPermission("workers.commission_set");

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

  if (!worker) {
    return <AdminLayout title="接单员详情"><AdminCard className="p-8 text-center font-bold text-slate-400">接单员不存在</AdminCard></AdminLayout>;
  }

  const adjust = () => {
    if (!confirm("确定调整该接单员洛克贝余额吗？")) return;
    run(() => adminAdjustWallet({ userId: worker.id, direction, amount: Number(amount), reason }), "洛克贝调整成功");
  };

  return (
    <AdminLayout title="接单员详情">
      <section className="mb-4 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <Link href="/admin/workers" className="font-black text-blue-600">‹ 返回</Link>
        <h2 className="text-xl font-black">接单员详情</h2>
        <AdminBadge tone={worker.status === "normal" ? "green" : "rose"}>{worker.status === "normal" ? "活跃" : "冻结"}</AdminBadge>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <div className="space-y-4">
          <AdminCard className="p-5">
            <div className="flex flex-wrap items-start gap-4">
              {worker.avatarUrl ? <img src={worker.avatarUrl} alt={worker.name} className="h-20 w-20 rounded-full object-cover" /> : <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-500">接</div>}
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-black">{worker.name}</h2>
                <p className="mt-1 text-sm font-black text-amber-600">{workerLevelLabel(worker.level)}</p>
                <p className="mt-2 text-sm font-bold text-slate-500">{worker.intro}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <Info label="在线状态" value={worker.onlineStatus === "online" ? "在线" : "离线"} />
              <Info label="端口" value={servicePortText(worker.servicePort)} />
              <Info label="保证金金额" value={`${formatRock(worker.depositAmount ?? 0)} 洛克贝`} />
              <Info label="洛克贝余额" value={`${formatRock(wallet?.availableBalance ?? 0)} 洛克贝`} />
              <Info label="完成订单" value={`${worker.completedOrderCount}`} />
              <Info label="好评率" value={`${worker.rating}%`} />
              <Info label="创建时间" value={formatTime(worker.createdAt)} />
              <Info label="更新时间" value={formatTime(worker.updatedAt)} />
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <div className="flex gap-5 overflow-x-auto border-b border-slate-100">
              {(["base", "orders", "finance", "deposit", "withdraw"] as const).map((item) => (
                <button key={item} className={`shrink-0 pb-3 text-sm font-black ${tab === item ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500"}`} onClick={() => setTab(item)}>
                  {item === "base" ? "基本信息" : item === "orders" ? "订单记录" : item === "finance" ? "财务明细" : item === "deposit" ? "退保记录" : "提现记录"}
                </button>
              ))}
            </div>
            <div className="mt-4">
              {tab === "base" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <Info label="接单员 ID" value={worker.id} />
                  <Info label="简介" value={worker.intro} />
                  <Info label="保证金状态" value={worker.depositStatus} />
                  <Info label="平台抽成" value={`${worker.platformCommissionRate ?? 0}%`} />
                </div>
              ) : tab === "orders" ? (
                <div className="space-y-2">
                  {orders.map((order) => <Link key={order.id} href={`/admin/order/${order.id}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><div><p className="font-black">{order.productName ?? "打赏订单"}</p><p className="text-xs font-bold text-slate-400">{order.orderNo}</p></div><AdminBadge>{statusText[order.status]}</AdminBadge></Link>)}
                  {!orders.length ? <p className="py-8 text-center text-sm font-bold text-slate-400">暂无订单记录</p> : null}
                </div>
              ) : tab === "finance" ? (
                <div className="space-y-2">
                  {ledger.map((entry) => <div key={entry.id} className="rounded-xl bg-slate-50 px-4 py-3"><p className="font-black">{entry.description}</p><p className="text-xs font-bold text-slate-400">{formatTime(entry.createdAt)} · {entry.direction} · {formatRock(entry.amount)} 洛克贝</p></div>)}
                  {!ledger.length ? <p className="py-8 text-center text-sm font-bold text-slate-400">暂无财务明细</p> : null}
                </div>
              ) : tab === "deposit" ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-500">当前保证金状态：{worker.depositStatus}，金额 {formatRock(worker.depositAmount ?? 0)} 洛克贝。退保记录后续接入。</p>
              ) : (
                <div className="space-y-2">
                  {withdrawals.map((item) => <div key={item.id} className="rounded-xl bg-slate-50 px-4 py-3"><p className="font-black">{item.requestNo}</p><p className="text-xs font-bold text-slate-400">{item.status} · {formatRock(item.amountLockeCoin)} 洛克贝</p></div>)}
                  {!withdrawals.length ? <p className="py-8 text-center text-sm font-bold text-slate-400">暂无提现记录</p> : null}
                </div>
              )}
            </div>
          </AdminCard>
        </div>

        <aside className="space-y-4">
          <AdminCard className="p-5">
            <h3 className="text-lg font-black">管理员操作</h3>
            <div className="mt-4 grid gap-3">
              <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold" value={worker.level} onChange={(event) => run(() => adminUpdateWorkerLevel(worker.id, event.target.value as WorkerLevel), "等级已修改")} disabled={!canEdit} title={canEdit ? undefined : "无权限操作"}>
                {levels.map((level) => <option key={level}>{level}</option>)}
              </select>
              {canEdit ? <button className="h-11 rounded-xl border border-slate-200 text-sm font-black" onClick={() => alert("编辑资料后续会开放更多字段，目前请接单员端自行维护昵称、头像和说明。")}>编辑资料</button> : null}
              {canAdjustDeposit ? <button className="h-11 rounded-xl border border-amber-200 bg-amber-50 text-sm font-black text-amber-700" onClick={() => { if (!confirm("确定代缴 100 洛克贝保证金吗？")) return; run(() => adminPayWorkerDeposit(worker.id, 100), "已代缴保证金"); }}>代缴保证金</button> : null}
              {canSetCommission ? <div className="flex gap-2">
                <input className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm" placeholder="平台抽成 %" value={commission} onChange={(event) => setCommission(event.target.value)} />
                <button className="rounded-xl bg-blue-600 px-3 text-sm font-black text-white" onClick={() => run(() => adminUpdateWorkerCommission(worker.id, Number(commission)), "抽成已设置")}>设置</button>
              </div> : null}
              {(worker.status === "normal" ? canFreeze : canUnfreeze) ? <button className={`h-11 rounded-xl text-sm font-black text-white ${worker.status === "normal" ? "bg-rose-600" : "bg-emerald-600"}`} onClick={() => { if (!confirm(`确定${worker.status === "normal" ? "冻结" : "解冻"}接单员「${worker.name}」吗？`)) return; run(() => adminSetWorkerFrozen(worker.id, worker.status === "normal"), worker.status === "normal" ? "已冻结接单员" : "已解冻接单员"); }}>
                {worker.status === "normal" ? "冻结接单员" : "解冻接单员"}
              </button> : null}
              {!canEdit && !canAdjustDeposit && !canSetCommission && !(worker.status === "normal" ? canFreeze : canUnfreeze) ? <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-400" title="无权限操作">无权限操作</p> : null}
              {message ? <p className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{message}</p> : null}
            </div>
          </AdminCard>

          {canAdjustBalance ? <AdminCard className="p-5">
            <h3 className="text-lg font-black">余额调整</h3>
            <div className="mt-4 grid gap-3">
              <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold" value={direction} onChange={(event) => setDirection(event.target.value as "in" | "out")}>
                <option value="in">增加</option>
                <option value="out">扣除</option>
              </select>
              <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="数量" value={amount} onChange={(event) => setAmount(event.target.value)} />
              <textarea className="min-h-20 rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="原因" value={reason} onChange={(event) => setReason(event.target.value)} />
              <button className="h-11 rounded-xl bg-blue-600 text-sm font-black text-white" onClick={adjust}>确认调整</button>
            </div>
          </AdminCard> : <AdminCard className="p-5"><h3 className="text-lg font-black">余额调整</h3><p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-400" title="无权限操作">无权限操作</p></AdminCard>}
        </aside>
      </section>
    </AdminLayout>
  );
}

function servicePortText(port?: ServicePort) {
  if (port === "pc") return "PC端";
  if (port === "both") return "双端";
  return "手游端";
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 font-black text-slate-800">{value}</p></div>;
}
