"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { adminDeleteRechargePackage, adminSetRechargePackageStatus, adminUpsertRechargePackage, formatCurrency, formatRock, formatTime, hasPermission, readStore } from "@/lib/store";
import type { RechargePackage, StoreShape } from "@/lib/types";

type Form = { id?: string; sortOrder: string; amountRmb: string; bonusLockeCoin: string; status: RechargePackage["status"] };
const emptyForm: Form = { sortOrder: "10", amountRmb: "50", bonusLockeCoin: "0", status: "active" };

export default function RechargePackagesPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState<Form | null>(null);
  const [message, setMessage] = useState("");
  const rows = store.recharge_packages
    .filter((item) => !item.deleted && (status === "all" || item.status === status))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const canManage = hasPermission("finance.recharge_package.manage");

  const refresh = () => setStore(readStore());
  const submit = () => {
    if (!form) return;
    try {
      adminUpsertRechargePackage({
        id: form.id,
        sortOrder: Number(form.sortOrder),
        amountRmb: Number(form.amountRmb),
        bonusLockeCoin: Number(form.bonusLockeCoin),
        status: form.status,
      });
      setForm(null);
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
  };

  return (
    <AdminLayout title="充值套餐">
      <div className="space-y-4">
        <AdminCard className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <select className="admin-field max-w-xs" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">全部状态</option>
              <option value="active">启用</option>
              <option value="inactive">停用</option>
            </select>
            {canManage ? <button className="admin-primary" onClick={() => setForm(emptyForm)}>新增套餐</button> : <button className="admin-secondary text-slate-400" title="无权限操作" disabled>新增套餐</button>}
          </div>
        </AdminCard>
        <AdminCard className="overflow-hidden">
          <table className="admin-table">
            <thead><tr><th>排序</th><th>充值金额 RMB</th><th>赠送洛克贝</th><th>到账洛克贝</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.sortOrder}</td>
                  <td className="font-black">{formatCurrency(item.amountRmb)}</td>
                  <td className="text-amber-600">+ {formatRock(item.bonusLockeCoin)}</td>
                  <td className="font-black">{formatRock(item.amountLockeCoin)}</td>
                  <td><AdminBadge tone={item.status === "active" ? "green" : "slate"}>{item.status === "active" ? "启用" : "停用"}</AdminBadge></td>
                  <td>{formatTime(item.createdAt)}</td>
                  <td className="space-x-3">
                    {canManage ? <button className="admin-link" onClick={() => setForm({ id: item.id, sortOrder: String(item.sortOrder), amountRmb: String(item.amountRmb), bonusLockeCoin: String(item.bonusLockeCoin), status: item.status })}>编辑</button> : null}
                    {canManage ? <button className="admin-link" onClick={() => { adminSetRechargePackageStatus(item.id, item.status === "active" ? "inactive" : "active"); refresh(); }}>{item.status === "active" ? "停用" : "启用"}</button> : null}
                    {canManage ? <button className="text-sm font-black text-rose-500" onClick={() => { if (!confirm("确定删除该充值套餐吗？")) return; adminDeleteRechargePackage(item.id); refresh(); }}>删除</button> : <span className="text-sm font-bold text-slate-400" title="无权限操作">无权限操作</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      </div>
      {form && canManage ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal w-full max-w-xl p-5">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">{form.id ? "编辑充值套餐" : "新增充值套餐"}</h2><button className="admin-close" onClick={() => setForm(null)}>×</button></div>
            <div className="space-y-3">
              <Field label="排序"><input className="admin-field" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value.replace(/[^\d]/g, "") })} /></Field>
              <Field label="充值金额"><input className="admin-field" value={form.amountRmb} onChange={(e) => setForm({ ...form, amountRmb: e.target.value.replace(/[^\d.]/g, "") })} /></Field>
              <Field label="赠送洛克贝"><input className="admin-field" value={form.bonusLockeCoin} onChange={(e) => setForm({ ...form, bonusLockeCoin: e.target.value.replace(/[^\d.]/g, "") })} /></Field>
              <Field label="到账洛克贝"><div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-black">{formatRock(Number(form.amountRmb || 0) + Number(form.bonusLockeCoin || 0))}</div></Field>
              <Field label="状态"><select className="admin-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RechargePackage["status"] })}><option value="active">启用</option><option value="inactive">停用</option></select></Field>
              {message ? <p className="text-sm font-bold text-rose-500">{message}</p> : null}
            </div>
            <div className="mt-5 flex justify-end gap-2"><button className="admin-secondary" onClick={() => setForm(null)}>取消</button><button className="admin-primary" onClick={submit}>提交</button></div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-black text-slate-600 md:grid-cols-[120px_1fr] md:items-center"><span>{label}</span>{children}</label>;
}
