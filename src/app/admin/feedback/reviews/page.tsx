"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { adminUpdateOrderReview, formatTime, hasPermission, readStore } from "@/lib/store";
import type { OrderReviewStatus, StoreShape } from "@/lib/types";

export default function AdminReviewsPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<OrderReviewStatus | "all">("all");
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const rows = useMemo(() => {
    const clean = keyword.trim();
    return store.order_reviews
      .filter((item) => status === "all" || item.status === status)
      .filter((item) => !clean || `${item.title}${item.content}${item.customerName}${item.workerName}${item.orderNo}`.includes(clean))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [keyword, status, store.order_reviews]);
  const canHide = hasPermission("feedback.reviews.hide");
  const canRestore = hasPermission("feedback.reviews.restore");

  const run = (reviewId: string, nextStatus: OrderReviewStatus) => {
    setMessage("");
    try {
      adminUpdateOrderReview(reviewId, nextStatus);
      refresh();
      setMessage("评价状态已更新");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败");
    }
  };

  return (
    <AdminLayout title="评价管理">
      <AdminCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">订单评价</h2>
            <p className="mt-1 text-sm font-bold text-slate-400">统一读取 order_reviews，隐藏后不会参与接单员评分统计。</p>
          </div>
          <Link href="/admin/feedback" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600">返回反馈</Link>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none lg:col-span-2" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索订单、用户、接单员、评价内容" />
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" value={status} onChange={(event) => setStatus(event.target.value as OrderReviewStatus | "all")}>
            <option value="all">全部状态</option>
            <option value="visible">展示中</option>
            <option value="hidden">已隐藏</option>
            <option value="pending">待审核</option>
            <option value="closed">已关闭</option>
          </select>
        </div>

        {message ? <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">{message}</p> : null}

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-400">
              <tr>
                <th className="px-4 py-3">评价</th>
                <th className="px-4 py-3">订单</th>
                <th className="px-4 py-3">顾客</th>
                <th className="px-4 py-3">接单员</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((item) => (
                <tr key={item.id} className="bg-white">
                  <td className="px-4 py-3">
                    <p className="font-black text-amber-600">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</p>
                    <p className="mt-1 max-w-xs truncate font-bold text-slate-600">{item.content || "无文字评价"}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-blue-600"><Link href={`/admin/order/${item.orderId}`}>{item.orderNo ?? item.orderId}</Link></td>
                  <td className="px-4 py-3 font-bold text-slate-600">{item.customerName || item.customerId}</td>
                  <td className="px-4 py-3 font-bold text-slate-600"><Link href={`/admin/worker/${item.workerId}`} className="text-blue-600">{item.workerName || item.workerId}</Link></td>
                  <td className="px-4 py-3"><AdminBadge tone={item.status === "visible" ? "green" : item.status === "hidden" ? "rose" : "slate"}>{reviewStatusText(item.status)}</AdminBadge></td>
                  <td className="px-4 py-3 font-bold text-slate-500">{formatTime(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {canHide ? <button className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-black text-rose-700" onClick={() => run(item.id, "hidden")}>隐藏</button> : null}
                      {canRestore ? <button className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-black text-emerald-700" onClick={() => run(item.id, "visible")}>恢复</button> : null}
                      {!canHide && !canRestore ? <span className="text-xs font-bold text-slate-400" title="无权限操作">无权限操作</span> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? <p className="bg-slate-50 p-10 text-center text-sm font-bold text-slate-400">暂无评价</p> : null}
        </div>
      </AdminCard>
    </AdminLayout>
  );
}

function reviewStatusText(status: OrderReviewStatus) {
  if (status === "hidden") return "已隐藏";
  if (status === "pending") return "待审核";
  if (status === "closed") return "已关闭";
  return "展示中";
}
