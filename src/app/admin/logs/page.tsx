"use client";

import { useCallback, useState } from "react";
import { AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { formatTime, readStore } from "@/lib/store";
import type { StoreShape } from "@/lib/types";

export default function AdminLogsPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  return (
    <AdminLayout title="操作日志">
      <AdminCard className="p-5">
        <h2 className="text-xl font-black">admin_logs</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>{["时间", "管理员", "操作类型", "操作对象", "操作详情"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {store.admin_logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-4 text-slate-500">{formatTime(log.createdAt)}</td>
                  <td className="px-4 py-4 font-black">{log.adminName}</td>
                  <td className="px-4 py-4">{log.actionType}</td>
                  <td className="px-4 py-4">{log.targetType}{log.targetId ? ` / ${log.targetId}` : ""}</td>
                  <td className="px-4 py-4">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!store.admin_logs.length ? <p className="py-10 text-center text-sm font-bold text-slate-400">暂无管理员操作日志</p> : null}
        </div>
      </AdminCard>
    </AdminLayout>
  );
}
