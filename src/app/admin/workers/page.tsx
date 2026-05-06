"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { statusText } from "@/lib/status";
import { useStoreSync } from "@/lib/hooks";
import {
  adminAdjustWorkerBalance,
  adminAdjustWorkerDeposit,
  adminSetWorkerFrozen,
  adminUpdateWorkerCommission,
  adminUpdateWorkerProfile,
  formatRock,
  formatTime,
  readStore,
  workerAccountText,
  workerLevelLabel,
  workerStatusText,
} from "@/lib/store";
import type { LedgerType, ServicePort, StoreShape, Worker, WorkerLevel } from "@/lib/types";

const levels: Array<"" | WorkerLevel> = ["", "明星", "金牌", "银牌", "铜牌", "见习"];
const ports: Array<"" | ServicePort> = ["", "mobile", "pc", "both"];
const tabs = ["base", "orders", "finance", "deposit", "withdraw"] as const;
type DrawerTab = (typeof tabs)[number];
type DialogType = "edit" | "deposit" | "balance" | "commission" | null;
type StatusMode = "active" | "frozen" | "offline" | "online";
type WorkerGenderForm = NonNullable<Worker["gender"]>;
type WorkerEditForm = {
  statusMode: StatusMode;
  level: WorkerLevel;
  userName: string;
  name: string;
  gender: WorkerGenderForm;
  gameId: string;
  gameNickname: string;
  servicePort: ServicePort;
  intro: string;
};

export default function AdminWorkersPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [port, setPort] = useState<"" | ServicePort>("");
  const [level, setLevel] = useState<"" | WorkerLevel>("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>("base");
  const [dialog, setDialog] = useState<DialogType>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 1500);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("filter") === "new") setStatus("normal");
  }, []);

  const workers = useMemo(() => {
    const q = keyword.trim();
    return store.workers
      .filter((worker) => !q || worker.name.includes(q) || worker.level.includes(q) || worker.id.includes(q) || (worker.userName ?? "").includes(q))
      .filter((worker) => !status || worker.status === status || worker.onlineStatus === status)
      .filter((worker) => !port || worker.servicePort === port)
      .filter((worker) => !level || worker.level === level);
  }, [keyword, level, port, status, store.workers]);

  const selectedWorker = selectedId ? store.workers.find((worker) => worker.id === selectedId) ?? null : null;

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

  const openDrawer = (workerId: string, tab: DrawerTab = "base") => {
    setSelectedId(workerId);
    setActiveTab(tab);
    setMessage("");
  };

  const openDialog = (workerId: string, type: DialogType) => {
    setSelectedId(workerId);
    setDialog(type);
    setMessage("");
  };

  return (
    <AdminLayout title="接单员列表">
      <AdminCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">接单员管理</h2>
            <p className="mt-1 text-sm font-bold text-slate-400">资料、保证金、余额和平台抽成会同步到顾客端与接单员端</p>
          </div>
          {message ? <p className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{message}</p> : null}
        </div>

        <section className="mt-5 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-4">
          <label className="text-xs font-black text-slate-500">接单员昵称
            <input className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="请输入接单员昵称 / ID" />
          </label>
          <label className="text-xs font-black text-slate-500">状态
            <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">全部状态</option>
              <option value="normal">活跃</option>
              <option value="frozen">冻结</option>
              <option value="online">在线</option>
              <option value="offline">离线</option>
            </select>
          </label>
          <label className="text-xs font-black text-slate-500">服务端口
            <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={port} onChange={(event) => setPort(event.target.value as "" | ServicePort)}>
              {ports.map((item) => <option key={item || "all"} value={item}>{item ? servicePortText(item) : "全部端口"}</option>)}
            </select>
          </label>
          <label className="text-xs font-black text-slate-500">接单员等级
            <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={level} onChange={(event) => setLevel(event.target.value as "" | WorkerLevel)}>
              {levels.map((item) => <option key={item || "all"} value={item}>{item ? `${item}接单员` : "全部等级"}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-2 md:col-span-4">
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600" onClick={() => { setKeyword(""); setStatus(""); setPort(""); setLevel(""); }}>重置</button>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white" onClick={refresh}>查询</button>
          </div>
        </section>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1500px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>{["ID", "用户昵称", "接单员昵称", "服务端口", "等级", "保证金金额", "洛克贝余额 / 收益余额", "状态", "已完成订单数", "创建时间", "操作"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workers.map((worker) => {
                const wallet = store.wallet_accounts.find((item) => item.userId === worker.id);
                return (
                  <tr key={worker.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-black text-slate-500">{worker.id}</td>
                    <td className="px-4 py-4 text-slate-500">{worker.userName || "-"}</td>
                    <td className="px-4 py-4">
                      <WorkerIdentity worker={worker} />
                    </td>
                    <td className="px-4 py-4"><AdminBadge>{servicePortText(worker.servicePort)}</AdminBadge></td>
                    <td className="px-4 py-4">{workerLevelLabel(worker.level)}</td>
                    <td className="px-4 py-4">{formatRock(worker.depositAmount ?? 0)} 洛克贝</td>
                    <td className="px-4 py-4 font-black text-amber-600">{formatRock(wallet?.availableBalance ?? worker.availableBalance)} / {formatRock(wallet?.totalEarned ?? worker.totalEarned)}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <AdminBadge tone={worker.status === "normal" ? "green" : "rose"}>{workerAccountText(worker)}</AdminBadge>
                        <AdminBadge tone={worker.onlineStatus === "online" ? "green" : "slate"}>{worker.onlineStatus === "online" ? "在线" : "离线"}</AdminBadge>
                      </div>
                    </td>
                    <td className="px-4 py-4">{worker.completedOrderCount}</td>
                    <td className="px-4 py-4 text-slate-500">{formatTime(worker.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-x-3 gap-y-2">
                        <button className="font-black text-blue-600" onClick={() => openDrawer(worker.id)}>查看详情</button>
                        <button className="font-black text-slate-700" onClick={() => openDialog(worker.id, "edit")}>编辑资料</button>
                        <button className="font-black text-amber-600" onClick={() => openDialog(worker.id, "deposit")}>代缴/代扣保证金</button>
                        <button className="font-black text-emerald-600" onClick={() => openDialog(worker.id, "balance")}>余额调整</button>
                        <button className="font-black text-purple-600" onClick={() => openDialog(worker.id, "commission")}>设置平台抽成</button>
                        <button className={worker.status === "normal" ? "font-black text-rose-600" : "font-black text-emerald-600"} onClick={() => run(() => adminSetWorkerFrozen(worker.id, worker.status === "normal"), worker.status === "normal" ? "已冻结接单员" : "已解冻接单员")}>
                          {worker.status === "normal" ? "冻结" : "解冻"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {selectedWorker ? (
        <WorkerDrawer
          worker={selectedWorker}
          store={store}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          orderStatusFilter={orderStatusFilter}
          setOrderStatusFilter={setOrderStatusFilter}
          ledgerTypeFilter={ledgerTypeFilter}
          setLedgerTypeFilter={setLedgerTypeFilter}
          onClose={() => setSelectedId(null)}
          openDialog={(type) => setDialog(type)}
          run={run}
        />
      ) : null}

      {selectedWorker && dialog === "edit" ? <EditWorkerDialog worker={selectedWorker} onClose={() => setDialog(null)} onSaved={(text) => { refresh(); setDialog(null); setMessage(text); }} /> : null}
      {selectedWorker && dialog === "deposit" ? <DepositDialog worker={selectedWorker} onClose={() => setDialog(null)} onSaved={(text) => { refresh(); setDialog(null); setMessage(text); }} /> : null}
      {selectedWorker && dialog === "balance" ? <BalanceDialog worker={selectedWorker} onClose={() => setDialog(null)} onSaved={(text) => { refresh(); setDialog(null); setMessage(text); }} /> : null}
      {selectedWorker && dialog === "commission" ? <CommissionDialog worker={selectedWorker} onClose={() => setDialog(null)} onSaved={(text) => { refresh(); setDialog(null); setMessage(text); }} /> : null}
    </AdminLayout>
  );
}

function WorkerDrawer({
  worker,
  store,
  activeTab,
  setActiveTab,
  orderStatusFilter,
  setOrderStatusFilter,
  ledgerTypeFilter,
  setLedgerTypeFilter,
  onClose,
  openDialog,
  run,
}: {
  worker: Worker;
  store: StoreShape;
  activeTab: DrawerTab;
  setActiveTab: (tab: DrawerTab) => void;
  orderStatusFilter: string;
  setOrderStatusFilter: (value: string) => void;
  ledgerTypeFilter: string;
  setLedgerTypeFilter: (value: string) => void;
  onClose: () => void;
  openDialog: (type: DialogType) => void;
  run: (action: () => void, success: string) => void;
}) {
  const wallet = store.wallet_accounts.find((item) => item.userId === worker.id);
  const orders = store.orders
    .filter((order) => order.workerId === worker.id || order.specifiedWorkerId === worker.id)
    .filter((order) => !orderStatusFilter || order.status === orderStatusFilter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const ledger = store.wallet_ledger
    .filter((entry) => entry.userId === worker.id)
    .filter((entry) => !ledgerTypeFilter || entry.type === ledgerTypeFilter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const depositRefunds = store.deposit_refunds.filter((entry) => entry.workerId === worker.id);
  const withdrawals = store.withdraw_requests.filter((entry) => entry.workerId === worker.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <aside className="h-full w-full max-w-[860px] overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">接单员详情</h2>
            <p className="mt-1 text-sm font-bold text-slate-400">资料和钱包来自共享 workers / wallet_ledger 数据</p>
          </div>
          <button className="text-3xl leading-none text-slate-400" onClick={onClose}>×</button>
        </div>

        <section className="mt-8 flex items-center gap-4 border-b border-slate-100 pb-6">
          <WorkerAvatar worker={worker} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-black">{worker.name}</h3>
              <AdminBadge tone={worker.status === "normal" ? "green" : "rose"}>{workerAccountText(worker)}</AdminBadge>
              <AdminBadge tone={worker.onlineStatus === "online" ? "green" : "slate"}>{worker.onlineStatus === "online" ? "在线" : "离线"}</AdminBadge>
              <AdminBadge tone="amber">{worker.level}接单员</AdminBadge>
              <AdminBadge>{servicePortText(worker.servicePort)}</AdminBadge>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-500">
              保证金 {formatRock(worker.depositAmount ?? 0)} 洛克贝　收益余额 {formatRock(wallet?.availableBalance ?? worker.availableBalance)} 洛克贝　已完成 {worker.completedOrderCount} 单
            </p>
          </div>
        </section>

        <div className="mt-6 flex gap-5 overflow-x-auto border-b border-slate-200">
          {tabs.map((tab) => (
            <button key={tab} className={`shrink-0 pb-3 text-sm font-black ${activeTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-600"}`} onClick={() => setActiveTab(tab)}>
              {tabLabel(tab)}
            </button>
          ))}
        </div>

        <section className="mt-5">
          {activeTab === "base" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="接单员 ID" value={worker.id} />
              <Info label="用户昵称" value={worker.userName || "-"} />
              <Info label="当前状态" value={workerStatusText(worker)} />
              <Info label="接单员等级" value={worker.level} />
              <Info label="服务端口" value={servicePortText(worker.servicePort)} />
              <Info label="性别" value={genderText(worker.gender)} />
              <Info label="游戏 ID" value={worker.gameId || "-"} />
              <Info label="游戏昵称" value={worker.gameNickname || "-"} />
              <Info label="平台抽成比例" value={`${worker.platformCommissionRate ?? 20}%`} />
              <Info label="好评率" value={`${worker.rating}%`} />
              <Info label="简介" value={worker.intro || "-"} wide />
              <Info label="创建时间" value={formatTime(worker.createdAt)} />
              <Info label="更新时间" value={formatTime(worker.updatedAt)} />
            </div>
          ) : activeTab === "orders" ? (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-sm font-black text-slate-500">订单状态</span>
                <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value)}>
                  <option value="">全部状态</option>
                  {Object.entries(statusText).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <Table headers={["订单号", "状态", "总金额", "平台 / 端口", "派单时间", "完成时间"]}>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3"><Link href={`/admin/order/${order.id}`} className="font-black text-blue-600">{order.orderNo}</Link></td>
                    <td className="px-4 py-3"><AdminBadge>{statusText[order.status]}</AdminBadge></td>
                    <td className="px-4 py-3">{formatRock(order.amountLockeCoin)} 洛克贝</td>
                    <td className="px-4 py-3">{servicePortText(order.servicePort)}</td>
                    <td className="px-4 py-3">{formatTime(order.assignedAt)}</td>
                    <td className="px-4 py-3">{formatTime(order.settledAt)}</td>
                  </tr>
                ))}
                {!orders.length ? <EmptyRow colSpan={6} /> : null}
              </Table>
            </div>
          ) : activeTab === "finance" ? (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-sm font-black text-slate-500">流水类型</span>
                <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" value={ledgerTypeFilter} onChange={(event) => setLedgerTypeFilter(event.target.value)}>
                  <option value="">全部类型</option>
                  {ledgerTypes.map((type) => <option key={type} value={type}>{ledgerTypeText(type)}</option>)}
                </select>
              </div>
              <Table headers={["流水类型", "变动金额", "变动前余额", "变动后余额", "关联类型", "关联 ID", "备注", "时间"]}>
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3"><AdminBadge tone={entry.direction === "in" ? "green" : "rose"}>{ledgerTypeText(entry.type)}</AdminBadge></td>
                    <td className="px-4 py-3 font-black">{entry.direction === "out" ? "-" : "+"}{formatRock(entry.amount)}</td>
                    <td className="px-4 py-3">{entry.beforeBalance === undefined ? "-" : formatRock(entry.beforeBalance)}</td>
                    <td className="px-4 py-3">{entry.afterBalance === undefined ? "-" : formatRock(entry.afterBalance)}</td>
                    <td className="px-4 py-3">{entry.relatedType ?? (entry.relatedOrderId ? "orders" : "wallet")}</td>
                    <td className="px-4 py-3">{entry.relatedOrderId ?? entry.rechargeOrderId ?? "-"}</td>
                    <td className="px-4 py-3">{entry.description}</td>
                    <td className="px-4 py-3">{formatTime(entry.createdAt)}</td>
                  </tr>
                ))}
                {!ledger.length ? <EmptyRow colSpan={8} /> : null}
              </Table>
            </div>
          ) : activeTab === "deposit" ? (
            <Table headers={["ID", "退款金额", "状态", "原因", "审核备注", "申请时间", "审核时间"]}>
              {depositRefunds.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.id}</td>
                  <td className="px-4 py-3">{formatRock(item.amountLockeCoin)}</td>
                  <td className="px-4 py-3"><AdminBadge>{item.status}</AdminBadge></td>
                  <td className="px-4 py-3">{item.reason || "-"}</td>
                  <td className="px-4 py-3">{item.adminRemark || "-"}</td>
                  <td className="px-4 py-3">{formatTime(item.createdAt)}</td>
                  <td className="px-4 py-3">{formatTime(item.reviewedAt)}</td>
                </tr>
              ))}
              {!depositRefunds.length ? <EmptyRow colSpan={7} /> : null}
            </Table>
          ) : (
            <Table headers={["提现单号", "金额", "手续费", "实到金额", "状态", "申请时间", "处理时间"]}>
              {withdrawals.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.requestNo}</td>
                  <td className="px-4 py-3">{formatRock(item.amountLockeCoin)}</td>
                  <td className="px-4 py-3">0</td>
                  <td className="px-4 py-3">{formatRock(item.amountLockeCoin)}</td>
                  <td className="px-4 py-3"><AdminBadge>{item.status}</AdminBadge></td>
                  <td className="px-4 py-3">{formatTime(item.createdAt)}</td>
                  <td className="px-4 py-3">{formatTime(item.completedAt ?? item.approvedAt)}</td>
                </tr>
              ))}
              {!withdrawals.length ? <EmptyRow colSpan={7} /> : null}
            </Table>
          )}
        </section>

        <div className="sticky bottom-0 mt-8 flex flex-wrap gap-3 border-t border-slate-100 bg-white py-4">
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white" onClick={() => openDialog("edit")}>编辑资料</button>
          <button className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700" onClick={() => openDialog("deposit")}>代缴/代扣保证金</button>
          <button className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-black text-purple-700" onClick={() => openDialog("commission")}>设置平台抽成</button>
          <button className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700" onClick={() => openDialog("balance")}>余额调整</button>
          <button className={`rounded-xl px-4 py-2 text-sm font-black text-white ${worker.status === "normal" ? "bg-rose-600" : "bg-emerald-600"}`} onClick={() => run(() => adminSetWorkerFrozen(worker.id, worker.status === "normal"), worker.status === "normal" ? "已冻结接单员" : "已解冻接单员")}>
            {worker.status === "normal" ? "冻结" : "解冻"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function EditWorkerDialog({ worker, onClose, onSaved }: { worker: Worker; onClose: () => void; onSaved: (message: string) => void }) {
  const [form, setForm] = useState<WorkerEditForm>({
    statusMode: worker.status === "frozen" ? "frozen" as StatusMode : worker.onlineStatus === "online" ? "online" as StatusMode : "offline" as StatusMode,
    level: worker.level,
    userName: worker.userName ?? "",
    name: worker.name,
    gender: worker.gender ?? "unknown",
    gameId: worker.gameId ?? "",
    gameNickname: worker.gameNickname ?? "",
    servicePort: worker.servicePort ?? "mobile",
    intro: worker.intro ?? "",
  });
  const [error, setError] = useState("");
  const save = () => {
    setError("");
    try {
      adminUpdateWorkerProfile(worker.id, form);
      onSaved("接单员资料已保存");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    }
  };
  return (
    <Modal title="编辑接单员资料" onClose={onClose} error={error} footer={<><button className="admin-cancel" onClick={onClose}>取消</button><button className="admin-confirm" onClick={save}>保存</button></>}>
      <DialogGrid>
        <Field label="状态"><select className="admin-field" value={form.statusMode} onChange={(event) => setForm({ ...form, statusMode: event.target.value as StatusMode })}><option value="active">活跃</option><option value="frozen">冻结</option><option value="offline">离线</option><option value="online">在线</option></select></Field>
        <Field label="等级"><select className="admin-field" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value as WorkerLevel })}>{levels.filter(Boolean).map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
        <Field label="用户昵称"><input className="admin-field" value={form.userName} onChange={(event) => setForm({ ...form, userName: event.target.value })} maxLength={50} /></Field>
        <Field label="接单员昵称"><input className="admin-field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={50} /></Field>
        <Field label="性别"><select className="admin-field" value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as WorkerGenderForm })}><option value="unknown">未设置</option><option value="male">男</option><option value="female">女</option></select></Field>
        <Field label="服务端口"><select className="admin-field" value={form.servicePort} onChange={(event) => setForm({ ...form, servicePort: event.target.value as ServicePort })}><option value="mobile">手游端</option><option value="pc">PC端</option><option value="both">双端</option></select></Field>
        <Field label="游戏 ID"><input className="admin-field" value={form.gameId} onChange={(event) => setForm({ ...form, gameId: event.target.value })} /></Field>
        <Field label="游戏昵称"><input className="admin-field" value={form.gameNickname} onChange={(event) => setForm({ ...form, gameNickname: event.target.value })} /></Field>
        <Field label="简介" wide><textarea className="admin-textarea min-h-28" value={form.intro} onChange={(event) => setForm({ ...form, intro: event.target.value })} maxLength={500} /></Field>
      </DialogGrid>
    </Modal>
  );
}

function DepositDialog({ worker, onClose, onSaved }: { worker: Worker; onClose: () => void; onSaved: (message: string) => void }) {
  const [mode, setMode] = useState<"add" | "deduct">("add");
  const [amount, setAmount] = useState("0.01");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const save = () => {
    setError("");
    try {
      adminAdjustWorkerDeposit({ workerId: worker.id, mode, amount: Number(amount), remark });
      onSaved(mode === "add" ? "保证金已代缴" : "保证金已代扣");
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    }
  };
  return (
    <Modal title="代缴/代扣保证金" onClose={onClose} error={error} footer={<><button className="admin-cancel" onClick={onClose}>取消</button><button className="admin-confirm" onClick={save}>确认提交</button></>}>
      <DialogGrid>
        <Field label="操作类型" wide><Segment value={mode} options={[["add", "代缴，增加保证金"], ["deduct", "代扣，扣减保证金"]]} onChange={(value) => setMode(value as "add" | "deduct")} /></Field>
        <Field label="金额"><input className="admin-field" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))} /></Field>
        <Field label="备注" wide><textarea className="admin-textarea min-h-24" maxLength={200} value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="请输入操作备注（必填）" /></Field>
      </DialogGrid>
    </Modal>
  );
}

function BalanceDialog({ worker, onClose, onSaved }: { worker: Worker; onClose: () => void; onSaved: (message: string) => void }) {
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const save = () => {
    setError("");
    try {
      adminAdjustWorkerBalance({ workerId: worker.id, direction, amount: Number(amount), remark });
      onSaved(direction === "in" ? "洛克贝余额已充值" : "洛克贝余额已扣款");
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    }
  };
  return (
    <Modal title="洛克贝余额调整" onClose={onClose} error={error} footer={<><button className="admin-cancel" onClick={onClose}>取消</button><button className="admin-confirm" onClick={save}>确认{direction === "in" ? "充值" : "扣款"}</button></>}>
      <DialogGrid>
        <Field label="操作类型" wide><Segment value={direction} options={[["in", "充值"], ["out", "扣款"]]} onChange={(value) => setDirection(value as "in" | "out")} /></Field>
        <Field label="金额"><input className="admin-field" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))} placeholder="请输入金额" /></Field>
        <Field label="备注" wide><textarea className="admin-textarea min-h-24" maxLength={200} value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="请输入备注（必填）" /></Field>
      </DialogGrid>
    </Modal>
  );
}

function CommissionDialog({ worker, onClose, onSaved }: { worker: Worker; onClose: () => void; onSaved: (message: string) => void }) {
  const [rate, setRate] = useState(String(worker.platformCommissionRate ?? 20));
  const [error, setError] = useState("");
  const save = () => {
    setError("");
    try {
      adminUpdateWorkerCommission(worker.id, Number(rate));
      onSaved("平台抽成比例已保存");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    }
  };
  return (
    <Modal title="设置平台抽成比例" onClose={onClose} error={error} footer={<><button className="admin-cancel" onClick={onClose}>取消</button><button className="admin-confirm" onClick={save}>保存设置</button></>}>
      <div className="rounded-xl bg-slate-50 p-4 text-sm font-bold leading-7 text-slate-500">
        平台抽成比例对该接单员所有订单统一生效。接单员实得 = 订单金额 × (100 - 平台抽成比例) / 100。商品固定收益配置优先于该比例。
      </div>
      <div className="mt-5 grid grid-cols-[140px_1fr] items-center gap-4">
        <label className="text-right text-sm font-black text-slate-500">平台抽成比例</label>
        <div className="flex overflow-hidden rounded-xl border border-slate-200">
          <input className="h-12 min-w-0 flex-1 px-4 text-right text-sm font-black outline-none" value={rate} onChange={(event) => setRate(event.target.value.replace(/[^\d.]/g, ""))} />
          <span className="grid w-14 place-items-center bg-slate-50 text-sm font-black text-slate-400">%</span>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ title, children, footer, error, onClose }: { title: string; children: ReactNode; footer: ReactNode; error?: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-5">
      <section className="w-full max-w-[760px] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black">{title}</h2>
          <button className="text-3xl leading-none text-slate-400" onClick={onClose}>×</button>
        </div>
        <div className="mt-6">{children}</div>
        {error ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</p> : null}
        <div className="mt-8 flex justify-end gap-3">{footer}</div>
      </section>
    </div>
  );
}

function DialogGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={`grid gap-2 text-sm font-black text-slate-500 ${wide ? "md:col-span-2" : ""}`}><span>{label}</span>{children}</label>;
}

function Segment({ value, options, onChange }: { value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return <div className="inline-flex overflow-hidden rounded-xl border border-slate-200">{options.map(([key, label]) => <button key={key} className={`px-4 py-2 text-sm font-black ${value === key ? "bg-blue-600 text-white" : "bg-white text-slate-500"}`} onClick={() => onChange(key)}>{label}</button>)}</div>;
}

function WorkerIdentity({ worker }: { worker: Worker }) {
  return (
    <div className="flex items-center gap-3">
      <WorkerAvatar worker={worker} />
      <p className="font-black">{worker.name}</p>
    </div>
  );
}

function WorkerAvatar({ worker, size = "sm" }: { worker: Worker; size?: "sm" | "lg" }) {
  const className = size === "lg" ? "h-20 w-20 text-lg" : "h-10 w-10 text-xs";
  return worker.avatarUrl
    ? <img src={worker.avatarUrl} alt={worker.name} className={`${className} rounded-full object-cover`} />
    : <div className={`grid ${className} shrink-0 place-items-center rounded-full bg-slate-200 font-black text-slate-500`}>{worker.name.slice(0, 1) || "接"}</div>;
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-xs font-black text-slate-500"><tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-sm font-bold text-slate-400">暂无数据</td></tr>;
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={`rounded-xl bg-slate-50 px-4 py-3 ${wide ? "md:col-span-2" : ""}`}><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 whitespace-pre-wrap font-black text-slate-800">{value}</p></div>;
}

function servicePortText(port?: ServicePort | "") {
  if (port === "pc") return "PC端";
  if (port === "both") return "双端";
  return "手游端";
}

function genderText(gender?: Worker["gender"]) {
  if (gender === "male") return "男";
  if (gender === "female") return "女";
  return "未设置";
}

function tabLabel(tab: DrawerTab) {
  if (tab === "base") return "基本信息";
  if (tab === "orders") return "订单记录";
  if (tab === "finance") return "财务明细";
  if (tab === "deposit") return "退保记录";
  return "提现记录";
}

const ledgerTypes: LedgerType[] = ["order_income", "tip_in", "admin_adjust", "deposit_paid", "deposit_deduct", "deposit_refund", "deposit_admin_add", "deposit_admin_deduct", "withdraw_done", "withdraw_rejected", "platform_commission"];

function ledgerTypeText(type: LedgerType) {
  const map: Partial<Record<LedgerType, string>> = {
    order_income: "接单收益",
    order_settle: "订单结算",
    tip_in: "打赏收入",
    admin_adjust: "管理员调整",
    deposit_paid: "保证金缴纳",
    deposit_deduct: "保证金扣除",
    deposit_refund: "保证金退还",
    deposit_admin_add: "管理员代缴保证金",
    deposit_admin_deduct: "管理员代扣保证金",
    withdraw_done: "提现扣除",
    withdraw_rejected: "提现驳回",
    platform_commission: "平台抽成记录",
  };
  return map[type] ?? type;
}
