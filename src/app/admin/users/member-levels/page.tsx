"use client";

import { useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { adminUpdateMemberLevelSettings, getMemberLevelSettings } from "@/lib/store";
import type { MemberLevelSetting } from "@/lib/types";

export default function AdminMemberLevelsPage() {
  const [rows, setRows] = useState<MemberLevelSetting[]>(() => getMemberLevelSettings());
  const [message, setMessage] = useState("");

  const update = (id: string, patch: Partial<MemberLevelSetting>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const save = () => {
    try {
      const saved = adminUpdateMemberLevelSettings(rows);
      setRows(saved);
      setMessage("会员等级配置已保存，顾客端等级与下单折扣会按统一规则生效。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
  };

  return (
    <AdminLayout title="会员等级">
      <AdminCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">会员等级管理</h2>
            <p className="mt-1 text-sm font-bold text-slate-400">等级、折扣、升级奖励统一保存到 shared store，顾客端按累计消费自动匹配</p>
          </div>
          <AdminBadge tone="blue">共享配置</AdminBadge>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>{["排序", "等级名称", "消费门槛", "折扣率", "升级奖励", "状态"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-4">
                    <input type="number" className="h-10 w-24 rounded-xl border border-slate-200 px-3 font-bold" value={row.sort} onChange={(event) => update(row.id, { sort: Number(event.target.value) })} />
                  </td>
                  <td className="px-4 py-4"><input className="h-10 rounded-xl border border-slate-200 px-3 font-bold" value={row.name} onChange={(event) => update(row.id, { name: event.target.value })} /></td>
                  <td className="px-4 py-4"><input type="number" className="h-10 rounded-xl border border-slate-200 px-3 font-bold" value={row.minSpend} onChange={(event) => update(row.id, { minSpend: Number(event.target.value) })} /></td>
                  <td className="px-4 py-4"><input type="number" step="0.01" min="0.01" max="1" className="h-10 rounded-xl border border-slate-200 px-3 font-bold" value={row.discountRate} onChange={(event) => update(row.id, { discountRate: Number(event.target.value) })} /></td>
                  <td className="px-4 py-4"><input type="number" className="h-10 rounded-xl border border-slate-200 px-3 font-bold" value={row.upgradeReward} onChange={(event) => update(row.id, { upgradeReward: Number(event.target.value) })} /></td>
                  <td className="px-4 py-4">
                    <button className={`rounded-full px-3 py-1 text-xs font-black ${row.enabled ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`} onClick={() => update(row.id, { enabled: !row.enabled })}>
                      {row.enabled ? "启用" : "停用"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white" onClick={save}>保存配置</button>
          {message ? <p className="text-sm font-bold text-blue-600">{message}</p> : null}
        </div>
      </AdminCard>
    </AdminLayout>
  );
}
