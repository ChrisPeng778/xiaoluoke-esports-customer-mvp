"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { adminLogout, canAccessAdminPath, formatCurrency, getCurrentAdminSession, hasPermission, readStore } from "@/lib/store";
import type { AdminSession, StoreShape } from "@/lib/types";

const navItems = [
  { label: "统计", href: "/admin/dashboard", icon: "⌁", permission: "dashboard.view" },
  { label: "用户", href: "/admin/users", icon: "○", permission: "users.view" },
  { label: "商品", href: "/admin/products", icon: "□", permission: "products.view" },
  { label: "订单", href: "/admin/orders", icon: "≡", permission: "orders.view" },
  { label: "接单员", href: "/admin/workers", icon: "☆", permission: "workers.view" },
  { label: "财务", href: "/admin/finance/payments", icon: "￥", permission: "finance.payments.view" },
  { label: "营销", href: "/admin/announcements", icon: "♢", permission: "announcements.view" },
  { label: "反馈", href: "/admin/feedback", icon: "!", permission: "feedback.feedback.view" },
  { label: "权限", href: "/admin/permissions/roles", icon: "⌘", permission: "permissions.roles.manage" },
  { label: "设置", href: "/admin/settings", icon: "⚙", permission: "settings.view" },
];

const quickTabs: Array<{ label: string; href: string; permission: string }> = [
  { label: "综合面板", href: "/admin/dashboard", permission: "dashboard.view" },
  { label: "订单统计", href: "/admin/order-statistics", permission: "statistics.view" },
  { label: "用户列表", href: "/admin/users", permission: "users.view" },
  { label: "会员等级", href: "/admin/users/member-levels", permission: "users.member_levels.manage" },
  { label: "商品列表", href: "/admin/products", permission: "products.view" },
  { label: "商品分类", href: "/admin/product-categories", permission: "products.category_manage" },
  { label: "订单列表", href: "/admin/orders", permission: "orders.view" },
  { label: "后台派单", href: "/admin/orders/create", permission: "orders.create" },
  { label: "接单员列表", href: "/admin/workers", permission: "workers.view" },
  { label: "支付记录", href: "/admin/finance/payments", permission: "finance.payments.view" },
  { label: "充值套餐", href: "/admin/finance/recharge-packages", permission: "finance.recharge_package.manage" },
  { label: "打赏记录", href: "/admin/finance/tips", permission: "finance.tips.view" },
  { label: "财务流水", href: "/admin/finance/ledger", permission: "finance.ledger.view" },
  { label: "提现审核", href: "/admin/finance/withdrawals", permission: "finance.withdraw.view" },
  { label: "公告列表", href: "/admin/announcements", permission: "announcements.view" },
  { label: "角色管理", href: "/admin/permissions/roles", permission: "permissions.roles.manage" },
  { label: "管理员管理", href: "/admin/permissions/admin-users", permission: "permissions.admin_users.manage" },
  { label: "菜单管理", href: "/admin/permissions/menus", permission: "permissions.menus.manage" },
  { label: "基础设置", href: "/admin/settings", permission: "settings.view" },
  { label: "反馈列表", href: "/admin/feedback", permission: "feedback.feedback.view" },
];

export function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<StoreShape | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const nextSession = getCurrentAdminSession();
    if (!nextSession) {
      router.replace("/admin/login");
      return;
    }
    setSession(nextSession);
    setForbidden(!canAccessAdminPath(pathname));
    setStore(readStore());
    setReady(true);
  }, [router, pathname]);

  const headerStats = useMemo(() => {
    const orders = store?.orders ?? [];
    const month = new Date().toISOString().slice(0, 7);
    const monthOrders = orders.filter((order) => order.createdAt.slice(0, 7) === month);
    const monthRevenue = monthOrders
      .filter((order) => order.status === "settled" || order.orderType === "tip")
      .reduce((sum, order) => sum + order.amountRmb, 0);
    return { monthOrders: monthOrders.length, monthRevenue };
  }, [store]);

  const logout = () => {
    adminLogout();
    router.replace("/admin/login");
  };

  if (!ready) return null;

  const visibleNavItems = navItems.filter((item) => hasPermission(item.permission));
  const visibleQuickTabs = quickTabs.filter((item) => hasPermission(item.permission));

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white xl:block">
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-sm font-black text-amber-300">洛</div>
          <div>
            <p className="text-base font-black">小洛克电竞</p>
            <p className="text-xs font-bold text-slate-400">Admin Dashboard</p>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {visibleNavItems.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.label === "统计" && pathname.startsWith("/admin/order-statistics")) ||
              (item.label === "用户" && pathname.startsWith("/admin/user")) ||
              (item.label === "商品" && (pathname.startsWith("/admin/product") || pathname.startsWith("/admin/product-categories"))) ||
              (item.label === "订单" && pathname.startsWith("/admin/order") && !pathname.startsWith("/admin/order-statistics")) ||
              (item.label === "接单员" && pathname.startsWith("/admin/worker")) ||
              (item.label === "财务" && (pathname.startsWith("/admin/finance") || pathname.startsWith("/admin/recharges") || pathname.startsWith("/admin/withdrawals") || pathname.startsWith("/admin/wallet"))) ||
              (item.label === "反馈" && pathname.startsWith("/admin/disputes")) ||
              (item.label === "权限" && pathname.startsWith("/admin/permissions"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-base shadow-sm">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="xl:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 xl:px-6">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-400">统计 / 综合面板</p>
              <h1 className="truncate text-xl font-black">{title}</h1>
            </div>
            <div className="hidden flex-1 justify-center md:flex">
              <input className="h-10 w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-300" placeholder="搜索订单、用户、接单员..." />
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600" onClick={() => setStore(readStore())}>刷新</button>
              {hasPermission("permissions.roles.manage") ? <Link href="/admin/logs" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600">!</Link> : null}
              <Link href="/admin/finance/payments" className="hidden rounded-xl bg-amber-50 px-3 py-2 text-right text-xs font-bold text-slate-700 sm:block">
                <span className="block text-[10px] text-slate-400">本月营收</span>
                {formatCurrency(headerStats.monthRevenue)}
              </Link>
              <Link href="/admin/orders" className="hidden rounded-xl bg-blue-50 px-3 py-2 text-right text-xs font-bold text-slate-700 sm:block">
                <span className="block text-[10px] text-slate-400">本月订单</span>
                {headerStats.monthOrders} 单
              </Link>
              <button className="rounded-full bg-slate-900 px-3 py-2 text-xs font-black text-white" onClick={logout}>{session?.name ?? "管理员"} · 退出</button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 xl:px-6">
            {visibleQuickTabs.map(({ label, href }) => (
              <Link key={`${label}-${href}`} href={href} className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 hover:border-blue-200 hover:text-blue-700">
                {label}
              </Link>
            ))}
          </div>
        </header>

        <div className="p-4 xl:p-6">
          {forbidden ? (
            <AdminCard className="p-10 text-center">
              <p className="text-sm font-black text-blue-600">403</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">无权限访问</h2>
              <p className="mt-3 text-sm font-bold text-slate-500">当前管理员没有访问该页面的权限，请联系超级管理员调整角色权限。</p>
              <Link href="/admin/dashboard" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white">返回综合面板</Link>
            </AdminCard>
          ) : children}
        </div>
      </section>
    </main>
  );
}

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.04)] ${className}`}>{children}</section>;
}

export function AdminBadge({ children, tone = "slate" }: { children: ReactNode; tone?: "blue" | "green" | "amber" | "rose" | "slate" | "purple" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${tones[tone]}`}>{children}</span>;
}
