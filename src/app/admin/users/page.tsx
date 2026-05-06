"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { adminSetUserFrozen, adminUpdateUserRemark, formatRock, formatTime, hasPermission, readStore } from "@/lib/store";
import { statusText } from "@/lib/status";
import type { StoreShape, User } from "@/lib/types";

export default function AdminUsersPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [memberLevel, setMemberLevel] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "orders" | "ledger">("overview");
  const [remark, setRemark] = useState("");
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status")) setStatus(params.get("status") ?? "");
  }, []);

  const users = useMemo(() => {
    const q = keyword.trim();
    return store.users
      .filter((user) => user.role === "customer")
      .filter((user) => !q || user.nickname.includes(q) || user.displayId.includes(q) || user.id.includes(q))
      .filter((user) => !status || (user.status ?? "active") === status)
      .filter((user) => !memberLevel || user.memberLevel === memberLevel);
  }, [keyword, memberLevel, status, store.users]);
  const memberLevels = useMemo(() => {
    const configured = store.member_level_settings
      .filter((level) => level.enabled)
      .sort((a, b) => a.sort - b.sort || a.minSpend - b.minSpend)
      .map((level) => level.name);
    const existing = store.users.map((user) => user.memberLevel).filter(Boolean);
    return ["", ...Array.from(new Set([...configured, ...existing]))];
  }, [store.member_level_settings, store.users]);

  const selectedUser = selectedId ? store.users.find((item) => item.id === selectedId) ?? null : null;
  const canViewDetail = hasPermission("users.view");
  const canEditUser = hasPermission("users.edit");
  const canFreezeUser = hasPermission("users.freeze");
  const canUnfreezeUser = hasPermission("users.unfreeze");
  const canExportUsers = hasPermission("users.export");

  const openDrawer = (user: User) => {
    setSelectedId(user.id);
    setDrawerTab("overview");
    setRemark(user.adminRemark ?? "");
    setMessage("");
  };

  const saveRemark = () => {
    if (!selectedUser) return;
    try {
      adminUpdateUserRemark(selectedUser.id, remark);
      refresh();
      setMessage("备注已保存");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
  };
  const toggleUserFrozen = (user: User) => {
    const frozen = (user.status ?? "active") === "active";
    if (!confirm(`确定${frozen ? "冻结" : "解封"}用户「${user.nickname}」吗？`)) return;
    try {
      adminSetUserFrozen(user.id, frozen);
      refresh();
      setMessage(frozen ? "用户已冻结" : "用户已解封");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败");
    }
  };

  return (
    <AdminLayout title="用户列表">
      <AdminCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">用户管理</h2>
            <p className="mt-1 text-sm font-bold text-slate-400">读取当前顾客端真实用户数据，详情以右侧抽屉展示</p>
          </div>
          <div className="flex gap-2">
            {canExportUsers ? <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600" onClick={() => alert("导出功能为 MVP 占位。")}>导出</button> : <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-400" title="无权限操作" disabled>导出</button>}
            <Link href="/admin/users/member-levels" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">会员等级</Link>
          </div>
        </div>

        <section className="mt-5 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-5">
          <label className="text-xs font-black text-slate-500 md:col-span-2">关键词
            <input className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none" placeholder="昵称 / 用户 ID" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          </label>
          <label className="text-xs font-black text-slate-500">状态
            <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">全部状态</option>
              <option value="active">活跃</option>
              <option value="frozen">冻结</option>
            </select>
          </label>
          <label className="text-xs font-black text-slate-500">标签
            <input className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" placeholder="暂未配置" disabled />
          </label>
          <label className="text-xs font-black text-slate-500">会员等级
            <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={memberLevel} onChange={(event) => setMemberLevel(event.target.value)}>
              {memberLevels.map((level) => <option key={level} value={level}>{level || "全部等级"}</option>)}
            </select>
          </label>
          <div className="md:col-span-5 flex justify-end gap-2">
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600" onClick={() => { setKeyword(""); setStatus(""); setMemberLevel(""); }}>重置</button>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white" onClick={refresh}>搜索</button>
            <button className="rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-600" onClick={() => alert("更多筛选后续完善。")}>更多筛选</button>
          </div>
        </section>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>{["ID", "用户", "会员等级", "标签", "余额", "累计消费", "状态", "注册时间", "操作"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const wallet = store.wallet_accounts.find((item) => item.userId === user.id);
                return (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-black text-slate-600">{user.displayId}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.nickname} url={user.avatarUrl} />
                        <div><p className="font-black">{user.nickname}</p><p className="text-xs font-bold text-slate-400">{user.id}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><AdminBadge tone="blue">{user.memberLevel}</AdminBadge></td>
                    <td className="px-4 py-4 text-slate-400">-</td>
                    <td className="px-4 py-4 font-black text-amber-600">{formatRock(wallet?.availableBalance ?? 0)}</td>
                    <td className="px-4 py-4">{formatRock(wallet?.totalSpent ?? 0)}</td>
                    <td className="px-4 py-4"><AdminBadge tone={(user.status ?? "active") === "active" ? "green" : "rose"}>{(user.status ?? "active") === "active" ? "活跃" : "冻结"}</AdminBadge></td>
                    <td className="px-4 py-4 text-slate-500">{formatTime(user.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        {canViewDetail ? <button className="font-black text-blue-600" onClick={() => openDrawer(user)}>详情</button> : <button className="font-black text-slate-400" title="无权限操作" disabled>详情</button>}
                        {(user.status ?? "active") === "active"
                          ? canFreezeUser ? <button className="font-black text-rose-600" onClick={() => toggleUserFrozen(user)}>冻结</button> : null
                          : canUnfreezeUser ? <button className="font-black text-emerald-600" onClick={() => toggleUserFrozen(user)}>解封</button> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!users.length ? <p className="py-10 text-center text-sm font-bold text-slate-400">暂无用户数据</p> : null}
        </div>
      </AdminCard>

      {selectedUser ? (
        <UserDrawer
          user={selectedUser}
          store={store}
          tab={drawerTab}
          setTab={setDrawerTab}
          remark={remark}
          setRemark={setRemark}
          message={message}
          saveRemark={saveRemark}
          canEdit={canEditUser}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </AdminLayout>
  );
}

function UserDrawer({ user, store, tab, setTab, remark, setRemark, message, saveRemark, canEdit, onClose }: {
  user: User;
  store: StoreShape;
  tab: "overview" | "orders" | "ledger";
  setTab: (tab: "overview" | "orders" | "ledger") => void;
  remark: string;
  setRemark: (value: string) => void;
  message: string;
  saveRemark: () => void;
  canEdit: boolean;
  onClose: () => void;
}) {
  const wallet = store.wallet_accounts.find((item) => item.userId === user.id);
  const orders = store.orders.filter((order) => order.customerId === user.id || order.userId === user.id);
  const ledger = store.wallet_ledger.filter((entry) => entry.userId === user.id);
  const registeredDays = Math.max(0, Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / 86400000));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35">
      <aside className="ml-auto h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={user.nickname} url={user.avatarUrl} size="lg" />
            <div>
              <h3 className="text-xl font-black">{user.nickname} <span className="text-sm font-bold text-emerald-500">● {(user.status ?? "active") === "active" ? "活跃" : "冻结"}</span></h3>
              <p className="mt-1 text-sm font-bold text-slate-400">ID {user.displayId} · 注册于 {formatTime(user.createdAt)}</p>
              <AdminBadge tone="amber">{user.memberLevel}</AdminBadge>
            </div>
          </div>
          <button className="text-2xl font-black text-slate-400" onClick={onClose}>×</button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label="余额" value={`${formatRock(wallet?.availableBalance ?? 0)} 洛克贝`} />
          <Metric label="累计消费" value={`${formatRock(wallet?.totalSpent ?? 0)} 洛克贝`} />
          <Metric label="会员等级" value={user.memberLevel} />
          <Metric label="注册至今" value={`${registeredDays} 天`} />
        </div>

        <div className="mt-6 flex gap-6 border-b border-slate-100">
          {(["overview", "orders", "ledger"] as const).map((item) => (
            <button key={item} className={`pb-3 text-sm font-black ${tab === item ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500"}`} onClick={() => setTab(item)}>
              {item === "overview" ? "概览" : item === "orders" ? "订单" : "余额流水"}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <section className="mt-5 grid gap-4 md:grid-cols-2">
            <Info label="用户 ID" value={user.displayId} />
            <Info label="昵称" value={user.nickname} />
            <Info label="手机号" value="未绑定" />
            <Info label="账号状态" value={(user.status ?? "active") === "active" ? "活跃" : "冻结"} />
            <Info label="注册时间" value={formatTime(user.createdAt)} />
            <Info label="最后更新" value={formatTime(user.updatedAt)} />
            <label className="md:col-span-2 text-xs font-black text-slate-500">备注
              <textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none disabled:text-slate-400" value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="暂无备注" disabled={!canEdit} title={canEdit ? undefined : "无权限操作"} />
            </label>
            <div className="md:col-span-2 flex items-center gap-3">
              {canEdit ? <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white" onClick={saveRemark}>保存备注</button> : <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-400" title="无权限操作" disabled>保存备注</button>}
              {message ? <span className="text-sm font-bold text-blue-600">{message}</span> : null}
            </div>
          </section>
        ) : tab === "orders" ? (
          <div className="mt-5 space-y-2">
            {orders.map((order) => (
              <Link key={order.id} href={`/admin/order/${order.id}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div><p className="font-black">{order.productName ?? "打赏订单"}</p><p className="text-xs font-bold text-slate-400">{order.orderNo}</p></div>
                <AdminBadge>{statusText[order.status]}</AdminBadge>
              </Link>
            ))}
            {!orders.length ? <p className="py-8 text-center text-sm font-bold text-slate-400">暂无订单</p> : null}
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            {ledger.map((entry) => (
              <div key={entry.id} className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="font-black">{entry.description}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">{formatTime(entry.createdAt)} · {entry.direction} · {formatRock(entry.amount)} 洛克贝</p>
              </div>
            ))}
            {!ledger.length ? <p className="py-8 text-center text-sm font-bold text-slate-400">暂无流水</p> : null}
          </div>
        )}
      </aside>
    </div>
  );
}

function Avatar({ name, url, size = "md" }: { name: string; url?: string; size?: "md" | "lg" }) {
  const cls = size === "lg" ? "h-16 w-16" : "h-10 w-10";
  return url ? <img src={url} alt={name} className={`${cls} rounded-full object-cover`} /> : <div className={`${cls} grid place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-500`}>用</div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-2 font-black text-slate-900">{value}</p></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 font-black text-slate-800">{value}</p></div>;
}
