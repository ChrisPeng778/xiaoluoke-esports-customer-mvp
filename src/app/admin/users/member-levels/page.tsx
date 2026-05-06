"use client";

import { useEffect, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { appendAdminLog } from "@/lib/store";

type MemberLevelRow = {
  id: string;
  name: string;
  threshold: number;
  discount: string;
  reward: string;
  enabled: boolean;
};

const STORAGE_KEY = "xiaoluoke_admin_member_level_settings";

const defaults: MemberLevelRow[] = [
  { id: "normal", name: "普通会员", threshold: 0, discount: "待定", reward: "待定", enabled: true },
  { id: "middle", name: "中级会员", threshold: 200, discount: "待定", reward: "待定", enabled: true },
  { id: "high", name: "高级会员", threshold: 500, discount: "待定", reward: "待定", enabled: true },
  { id: "top", name: "顶级会员", threshold: 1000, discount: "待定", reward: "待定", enabled: true },
];

export default function AdminMemberLevelsPage() {
  const [rows, setRows] = useState<MemberLevelRow[]>(defaults);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setRows(JSON.parse(raw) as MemberLevelRow[]);
      } catch {
        setRows(defaults);
      }
    }
  }, []);

  const update = (id: string, patch: Partial<MemberLevelRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const save = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    appendAdminLog("member_level_update", "settings", "member_levels", "编辑会员等级配置");
    setMessage("会员等级配置已保存。当前折扣和升级奖励只作为展示，不影响顾客下单价格。");
  };

  return (
    <AdminLayout title="会员等级">
      <AdminCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">会员等级管理</h2>
            <p className="mt-1 text-sm font-bold text-slate-400">按小洛克电竞规则配置，顾客会员等级仍根据累计消费自动计算</p>
          </div>
          <AdminBadge tone="blue">测试版</AdminBadge>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>{["排序", "等级名称", "消费门槛", "折扣说明", "升级奖励", "状态"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td className="px-4 py-4 font-black text-slate-500">{(index + 1) * 10}</td>
                  <td className="px-4 py-4"><input className="h-10 rounded-xl border border-slate-200 px-3 font-bold" value={row.name} onChange={(event) => update(row.id, { name: event.target.value })} /></td>
                  <td className="px-4 py-4"><input type="number" className="h-10 rounded-xl border border-slate-200 px-3 font-bold" value={row.threshold} onChange={(event) => update(row.id, { threshold: Number(event.target.value) })} /></td>
                  <td className="px-4 py-4"><input className="h-10 rounded-xl border border-slate-200 px-3 font-bold" value={row.discount} onChange={(event) => update(row.id, { discount: event.target.value })} /></td>
                  <td className="px-4 py-4"><input className="h-10 rounded-xl border border-slate-200 px-3 font-bold" value={row.reward} onChange={(event) => update(row.id, { reward: event.target.value })} /></td>
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
