import type { OrderStatus } from "./types";

export const statusText: Record<OrderStatus, string> = {
  unpaid: "待付款",
  pending: "待接单",
  accepted: "服务中",
  worker_completed: "待结单",
  settled: "已完成",
  disputed: "有疑问",
  cancelled: "已取消",
  refunded: "已退款",
  after_sale: "退款/售后",
  after_sale_refunded: "售后已退款",
  paid: "已支付",
  failed: "支付失败",
};

export const statusTone: Record<OrderStatus, string> = {
  unpaid: "bg-amber-100 text-amber-700 ring-amber-200",
  pending: "bg-yellow-100 text-yellow-700 ring-yellow-200",
  accepted: "bg-blue-100 text-blue-700 ring-blue-200",
  worker_completed: "bg-purple-100 text-purple-700 ring-purple-200",
  settled: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  disputed: "bg-rose-100 text-rose-700 ring-rose-200",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
  refunded: "bg-cyan-100 text-cyan-700 ring-cyan-200",
  after_sale: "bg-orange-100 text-orange-700 ring-orange-200",
  after_sale_refunded: "bg-cyan-100 text-cyan-700 ring-cyan-200",
  paid: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  failed: "bg-slate-100 text-slate-600 ring-slate-200",
};
