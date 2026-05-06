"use client";

import { useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { adminCreateWithdrawRequest, adminUpdateWithdrawStatus, formatRock, formatTime, hasPermission, readStore } from "@/lib/store";
import type { StoreShape, WithdrawRequest, WithdrawStatus } from "@/lib/types";

const tabs: Array<["all" | WithdrawStatus, string]> = [["all", "全部"], ["pending", "待审核"], ["approved", "已审核"], ["paid", "已打款"], ["rejected", "已拒绝"]];

export default function FinanceWithdrawalsPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [tab, setTab] = useState<"all" | WithdrawStatus>("all");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<WithdrawRequest | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const rows = store.withdraw_requests
    .filter((item) => tab === "all" || item.status === tab || (tab === "paid" && item.status === "completed"))
    .filter((item) => !keyword || `${item.workerId} ${item.workerName} ${item.requestNo}`.toLowerCase().includes(keyword.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const refresh = () => setStore(readStore());
  const run = (id: string, status: WithdrawStatus) => {
    if (!confirm(`确定${statusText(status)}该提现申请吗？`)) return;
    try {
      adminUpdateWithdrawStatus(id, status, "管理员财务审核处理");
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "处理失败");
    }
  };
  const canSubmit = hasPermission("finance.withdraw.approve");
  const canApprove = hasPermission("finance.withdraw.approve");
  const canReject = hasPermission("finance.withdraw.reject");
  const canPay = hasPermission("finance.withdraw.mark_paid");

  return (
    <AdminLayout title="提现审核">
      <div className="space-y-4">
        <AdminCard className="p-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
            {tabs.map(([value, label]) => <button key={value} className={`rounded-xl px-4 py-2 text-sm font-black ${tab === value ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600"}`} onClick={() => setTab(value)}>{label}</button>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <input className="admin-field max-w-md" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="接单员 ID / 提现单号" />
            {canSubmit ? <button className="admin-primary" onClick={() => setFormOpen(true)}>代提交</button> : <button className="admin-secondary text-slate-400" title="无权限操作" disabled>代提交</button>}
            <button className="admin-secondary" onClick={() => { setKeyword(""); refresh(); }}>重置 / 刷新</button>
          </div>
          {message ? <p className="mt-3 text-sm font-bold text-rose-500">{message}</p> : null}
        </AdminCard>
        <AdminCard className="overflow-hidden">
          <table className="admin-table">
            <thead><tr><th>提现单号</th><th>接单员昵称</th><th>申请金额</th><th>手续费</th><th>实际到账</th><th>状态</th><th>收款信息</th><th>申请时间</th><th>操作</th></tr></thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono text-xs">{item.requestNo}</td>
                  <td>{item.workerName}<p className="text-xs text-slate-400">{item.workerId}</p></td>
                  <td className="font-black">{formatRock(item.amountLockeCoin)}</td>
                  <td>{formatRock(item.feeLockeCoin ?? 0)}</td>
                  <td>{formatRock(item.actualAmountLockeCoin ?? item.amountLockeCoin)}</td>
                  <td><AdminBadge tone={item.status === "paid" || item.status === "completed" ? "green" : item.status === "rejected" ? "rose" : item.status === "approved" ? "blue" : "amber"}>{statusText(item.status)}</AdminBadge></td>
                  <td>{maskReceiveInfo(item.receiveInfo)}</td>
                  <td>{formatTime(item.createdAt)}</td>
                  <td className="space-x-3">
                    <button className="admin-link" onClick={() => setSelected(item)}>详情</button>
                    {item.status === "pending" && canApprove ? <button className="admin-link" onClick={() => run(item.id, "approved")}>通过审核</button> : null}
                    {item.status === "pending" && canReject ? <button className="text-sm font-black text-rose-500" onClick={() => run(item.id, "rejected")}>拒绝</button> : null}
                    {item.status === "approved" && canPay ? <button className="admin-link" onClick={() => run(item.id, "paid")}>标记已打款</button> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? <p className="py-12 text-center text-sm font-bold text-slate-400">暂无提现申请</p> : null}
        </AdminCard>
      </div>
      {selected ? <Detail item={selected} onClose={() => setSelected(null)} /> : null}
      {formOpen && canSubmit ? <CreateWithdraw store={store} onClose={() => setFormOpen(false)} onDone={() => { setFormOpen(false); refresh(); }} /> : null}
    </AdminLayout>
  );
}

function Detail({ item, onClose }: { item: WithdrawRequest; onClose: () => void }) {
  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal w-full max-w-xl p-5">
        <div className="mb-4 flex justify-between"><h2 className="text-xl font-black">提现详情</h2><button className="admin-close" onClick={onClose}>×</button></div>
        <div className="space-y-2 text-sm font-bold text-slate-600">
          <p>提现单号：{item.requestNo}</p><p>接单员：{item.workerName}</p><p>申请金额：{formatRock(item.amountLockeCoin)}</p><p>手续费：{formatRock(item.feeLockeCoin ?? 0)}</p><p>实际到账：{formatRock(item.actualAmountLockeCoin ?? item.amountLockeCoin)}</p><p>状态：{statusText(item.status)}</p><p>收款信息：{maskReceiveInfo(item.receiveInfo)}</p><p>备注：{item.adminRemark ?? item.remark ?? "-"}</p>
        </div>
      </div>
    </div>
  );
}

function CreateWithdraw({ store, onClose, onDone }: { store: StoreShape; onClose: () => void; onDone: () => void }) {
  const [workerId, setWorkerId] = useState(store.workers[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("0");
  const [receiveInfo, setReceiveInfo] = useState("");
  const [remark, setRemark] = useState("");
  const [message, setMessage] = useState("");
  const submit = () => {
    if (!confirm("确定代接单员提交提现吗？提交后会冻结对应余额。")) return;
    try {
      adminCreateWithdrawRequest({ workerId, amountLockeCoin: Number(amount), feeLockeCoin: Number(fee || 0), receiveInfo, remark });
      onDone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败");
    }
  };
  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal w-full max-w-xl p-5">
        <div className="mb-4 flex justify-between"><h2 className="text-xl font-black">代提交提现</h2><button className="admin-close" onClick={onClose}>×</button></div>
        <div className="space-y-3">
          <select className="admin-field" value={workerId} onChange={(e) => setWorkerId(e.target.value)}>{store.workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name} - {formatRock(worker.availableBalance)}</option>)}</select>
          <input className="admin-field" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="提现金额" />
          <input className="admin-field" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d.]/g, ""))} placeholder="手续费" />
          <input className="admin-field" value={receiveInfo} onChange={(e) => setReceiveInfo(e.target.value)} placeholder="收款信息，展示时会脱敏" />
          <textarea className="admin-field min-h-24" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="备注" />
          {message ? <p className="text-sm font-bold text-rose-500">{message}</p> : null}
        </div>
        <div className="mt-5 flex justify-end gap-2"><button className="admin-secondary" onClick={onClose}>取消</button><button className="admin-primary" onClick={submit}>提交</button></div>
      </div>
    </div>
  );
}

function statusText(status: WithdrawStatus) {
  return { pending: "待审核", approved: "已审核", paid: "已打款", completed: "已打款", rejected: "已拒绝" }[status];
}

function maskReceiveInfo(value?: string) {
  if (!value || value === "未填写") return "未填写";
  if (value.length <= 6) return `${value.slice(0, 1)}***${value.slice(-1)}`;
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}
