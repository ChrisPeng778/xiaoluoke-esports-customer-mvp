"use client";

import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminSettingsPage() {
  const rows = [
    ["平台名称", "小洛克电竞"],
    ["洛克贝兑换比例", "1 RMB = 1 洛克贝"],
    ["入驻保证金", "100 洛克贝"],
    ["保证金退还条件", "完成 20 单"],
    ["默认平台抽成", "20%"],
    ["微信支付", "未接入"],
    ["支付宝支付", "未接入"],
    ["当前数据源", "mock/localStorage"],
    ["当前版本", "Admin MVP"],
    ["当前服务器环境", "测试环境"],
  ];

  return (
    <AdminLayout title="基础设置">
      <AdminCard className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">系统基础配置</h2>
          <AdminBadge tone="blue">测试版</AdminBadge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold text-slate-400">{label}</p>
              <p className="mt-1 font-black text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">支付配置、退款协议和客服设置目前只展示状态，后续接真实支付和数据库后再开放编辑。</p>
      </AdminCard>
    </AdminLayout>
  );
}
