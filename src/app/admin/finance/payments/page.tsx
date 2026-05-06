"use client";

import { useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { buildPaymentRecords, formatCurrency, formatTime, readStore } from "@/lib/store";
import type { PaymentRecord, PaymentRecordChannel, PaymentRecordStatus, PaymentRecordType, StoreShape } from "@/lib/types";

const statusTabs: Array<["all" | PaymentRecordStatus, string]> = [
  ["all", "全部"],
  ["pending", "待支付"],
  ["success", "支付成功"],
  ["failed", "支付失败"],
  ["closed", "已关闭"],
  ["refunded", "已退款"],
  ["partial_refunded", "部分退款"],
];

export default function FinancePaymentsPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [status, setStatus] = useState<"all" | PaymentRecordStatus>("all");
  const [type, setType] = useState<"all" | PaymentRecordType>("all");
  const [channel, setChannel] = useState<"all" | PaymentRecordChannel>("all");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<PaymentRecord | null>(null);

  const records = useMemo(() => buildPaymentRecords(store), [store]);
  const filtered = records.filter((record) => {
    const text = `${record.paymentNo} ${record.businessNo ?? ""} ${record.userId ?? ""} ${record.workerId ?? ""} ${record.userName ?? ""} ${record.workerName ?? ""}`;
    return (status === "all" || record.status === status) && (type === "all" || record.type === type) && (channel === "all" || record.channel === channel) && (!keyword || text.toLowerCase().includes(keyword.toLowerCase()));
  });
  const today = new Date().toISOString().slice(0, 10);
  const month = new Date().toISOString().slice(0, 7);
  const todayReceived = records.filter((item) => item.status === "success" && item.paidAt?.slice(0, 10) === today).reduce((sum, item) => sum + item.amountRmb, 0);
  const todayRefund = records.filter((item) => (item.status === "refunded" || item.status === "partial_refunded") && (item.refundedAt ?? item.createdAt).slice(0, 10) === today).reduce((sum, item) => sum + item.amountRmb, 0);
  const pendingAmount = records.filter((item) => item.status === "pending").reduce((sum, item) => sum + item.amountRmb, 0);
  const monthReceived = records.filter((item) => item.status === "success" && item.paidAt?.slice(0, 7) === month).reduce((sum, item) => sum + item.amountRmb, 0);

  return (
    <AdminLayout title="支付记录">
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-4">
          {[
            ["今日实收", todayReceived],
            ["今日退款", todayRefund],
            ["待支付订单", pendingAmount],
            ["本月实收", monthReceived],
          ].map(([label, value]) => (
            <AdminCard key={label as string} className="p-5">
              <p className="text-sm font-bold text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-black text-slate-900">{formatCurrency(Number(value))}</p>
            </AdminCard>
          ))}
        </div>

        <AdminCard className="p-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
            {statusTabs.map(([value, label]) => (
              <button key={value} onClick={() => setStatus(value)} className={`rounded-xl px-4 py-2 text-sm font-black ${status === value ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600"}`}>{label}</button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <select className="admin-field" value={type} onChange={(event) => setType(event.target.value as typeof type)}>
              <option value="all">全部类型</option>
              <option value="order_payment">订单支付</option>
              <option value="recharge">洛克贝充值</option>
              <option value="tip_payment">打赏支付</option>
              <option value="deposit">保证金</option>
              <option value="admin_adjust">管理员调整</option>
              <option value="refund">退款</option>
            </select>
            <select className="admin-field" value={channel} onChange={(event) => setChannel(event.target.value as typeof channel)}>
              <option value="all">全部渠道</option>
              <option value="locke_coin">洛克贝余额</option>
              <option value="wechat_miniapp">微信小程序（占位）</option>
              <option value="wechat">微信支付（占位）</option>
              <option value="alipay">支付宝（占位）</option>
              <option value="admin_created">后台创建</option>
              <option value="mock">mock</option>
            </select>
            <input className="admin-field md:col-span-2" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="交易单号 / 订单号 / 用户 ID / 接单员 ID" />
          </div>
        </AdminCard>

        <AdminCard className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <p className="text-sm font-black text-slate-700">共 {filtered.length} 条支付记录</p>
            <button className="admin-secondary" onClick={() => setStore(readStore())}>刷新</button>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead><tr><th>交易单号</th><th>交易类型</th><th>支付渠道</th><th>交易金额</th><th>状态</th><th>渠道流水号</th><th>支付时间</th><th>创建时间</th><th>操作</th></tr></thead>
              <tbody>
                {filtered.map((record) => (
                  <tr key={record.id}>
                    <td className="font-mono text-xs">{record.paymentNo}</td>
                    <td>{typeText(record.type)}</td>
                    <td>{channelText(record.channel)}</td>
                    <td className="font-black">{formatCurrency(record.amountRmb)}</td>
                    <td><AdminBadge tone={record.status === "success" ? "green" : record.status === "pending" ? "slate" : "rose"}>{statusText(record.status)}</AdminBadge></td>
                    <td className="max-w-[180px] truncate">{record.channelTradeNo ?? "-"}</td>
                    <td>{record.paidAt ? formatTime(record.paidAt) : "-"}</td>
                    <td>{formatTime(record.createdAt)}</td>
                    <td><button className="admin-link" onClick={() => setSelected(record)}>详情</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>
      {selected ? <PaymentDetail record={selected} onClose={() => setSelected(null)} /> : null}
    </AdminLayout>
  );
}

function PaymentDetail({ record, onClose }: { record: PaymentRecord; onClose: () => void }) {
  const rows = [
    ["交易单号", record.paymentNo],
    ["交易类型", typeText(record.type)],
    ["支付渠道", channelText(record.channel)],
    ["交易金额", formatCurrency(record.amountRmb)],
    ["状态", statusText(record.status)],
    ["关联业务", record.businessLabel],
    ["用户 ID", record.userId ?? "-"],
    ["接单员 ID", record.workerId ?? "-"],
    ["渠道流水号", record.channelTradeNo ?? "-"],
    ["创建时间", formatTime(record.createdAt)],
    ["支付成功时间", record.paidAt ? formatTime(record.paidAt) : "-"],
    ["退款时间", record.refundedAt ? formatTime(record.refundedAt) : "-"],
    ["备注", record.remark ?? "-"],
  ];
  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal w-full max-w-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-xl font-black">交易详情</h2>
          <button className="admin-close" onClick={onClose}>×</button>
        </div>
        <div className="grid grid-cols-[160px_1fr] border border-slate-100 m-5">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <div className="border-b border-r border-slate-100 bg-slate-50 px-4 py-3 text-sm font-black text-slate-600">{label}</div>
              <div className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-800">{value}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-end p-5 pt-0"><button className="admin-primary" onClick={onClose}>关闭</button></div>
      </div>
    </div>
  );
}

function typeText(type: PaymentRecordType) {
  return { order_payment: "订单支付", recharge: "洛克贝充值", tip_payment: "打赏支付", deposit: "保证金", admin_adjust: "管理员调整", refund: "退款" }[type];
}
function channelText(channel: PaymentRecordChannel) {
  return { locke_coin: "洛克贝余额", wechat: "微信支付", alipay: "支付宝", wechat_miniapp: "微信小程序", admin_created: "后台创建", mock: "mock" }[channel];
}
function statusText(status: PaymentRecordStatus) {
  return { pending: "待支付", success: "支付成功", failed: "支付失败", closed: "已关闭", refunded: "已退款", partial_refunded: "部分退款" }[status];
}
