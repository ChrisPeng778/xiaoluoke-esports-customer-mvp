"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { adminSetProductStatus, adminSoftDeleteProduct, formatCurrency, isProductActive, productStatusLabel, readStore } from "@/lib/store";
import type { ProductCategory, ProductStatus, ServicePort, StoreShape } from "@/lib/types";

const topCategories: Array<ProductCategory | "全部"> = ["全部", "异色专区", "PVP专区", "陪玩专区", "资源专区"];
const portText: Record<ServicePort, string> = { mobile: "手游端", pc: "PC端", both: "双端" };

export default function AdminProductsPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [filters, setFilters] = useState({
    name: "",
    category: "全部" as ProductCategory | "全部",
    status: "all" as "all" | "active" | "inactive",
    recommended: "all" as "all" | "yes" | "no",
    minPrice: "",
    maxPrice: "",
  });
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const products = useMemo(() => {
    const min = filters.minPrice ? Number(filters.minPrice) : null;
    const max = filters.maxPrice ? Number(filters.maxPrice) : null;
    return store.products
      .filter((product) => !product.deleted)
      .filter((product) => !filters.name.trim() || product.name.includes(filters.name.trim()))
      .filter((product) => filters.category === "全部" || product.category === filters.category)
      .filter((product) => filters.status === "all" || (filters.status === "active" ? isProductActive(product) : !isProductActive(product)))
      .filter((product) => filters.recommended === "all" || (filters.recommended === "yes" ? product.isRecommended : !product.isRecommended))
      .filter((product) => min === null || product.priceRmb >= min)
      .filter((product) => max === null || product.priceRmb <= max)
      .sort((a, b) => {
        if (Boolean(a.isRecommended) !== Boolean(b.isRecommended)) return a.isRecommended ? -1 : 1;
        if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [filters, store.products]);

  const setStatus = (id: string, status: ProductStatus) => {
    setMessage("");
    try {
      adminSetProductStatus(id, status);
      refresh();
      setMessage(status === "active" || status === "on" ? "商品已上架，顾客端可见。" : "商品已下架，顾客端不再展示。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败");
    }
  };

  const softDelete = (id: string) => {
    if (!confirm("确定删除该商品吗？已有订单的商品会做软删除并下架。")) return;
    setMessage("");
    try {
      adminSoftDeleteProduct(id);
      refresh();
      setMessage("商品已软删除并下架。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <AdminLayout title="商品列表">
      <AdminCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">商品管理</h2>
            <p className="mt-1 text-sm font-bold text-slate-400">商品上下架、推荐和排序会同步影响顾客端首页、分类页与商品详情。</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/product-categories" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600">商品分类</Link>
            <Link href="/admin/product/create" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">新增商品</Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 xl:grid-cols-6">
          <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="商品名称" value={filters.name} onChange={(event) => setFilters({ ...filters, name: event.target.value })} />
          <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value as ProductCategory | "全部" })}>
            {topCategories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as typeof filters.status })}>
            <option value="all">全部状态</option>
            <option value="active">上架</option>
            <option value="inactive">下架</option>
          </select>
          <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" value={filters.recommended} onChange={(event) => setFilters({ ...filters, recommended: event.target.value as typeof filters.recommended })}>
            <option value="all">全部推荐</option>
            <option value="yes">推荐</option>
            <option value="no">不推荐</option>
          </select>
          <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="最低价" value={filters.minPrice} onChange={(event) => setFilters({ ...filters, minPrice: event.target.value.replace(/[^\d.]/g, "") })} />
          <div className="flex gap-2">
            <input className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm" placeholder="最高价" value={filters.maxPrice} onChange={(event) => setFilters({ ...filters, maxPrice: event.target.value.replace(/[^\d.]/g, "") })} />
            <button className="rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-500" onClick={() => setFilters({ name: "", category: "全部", status: "all", recommended: "all", minPrice: "", maxPrice: "" })}>重置</button>
          </div>
        </div>

        {message ? <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{message}</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>{["商品图片", "商品名称", "分类", "服务端口", "价格 RMB", "价格洛克贝", "排序", "推荐", "状态", "销量", "创建时间", "操作"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4"><img src={product.imageUrl || "/images/products/default-product.jpg"} alt={product.name} className="h-14 w-14 rounded-xl object-cover" /></td>
                  <td className="px-4 py-4">
                    <p className="font-black">{product.name}</p>
                    <p className="mt-1 max-w-[240px] truncate text-xs font-bold text-slate-400">{product.shortDescription || product.description}</p>
                  </td>
                  <td className="px-4 py-4">{product.category}</td>
                  <td className="px-4 py-4">{portText[product.servicePort ?? "mobile"]}</td>
                  <td className="px-4 py-4 font-black">{formatCurrency(product.priceRmb)}</td>
                  <td className="px-4 py-4">{product.priceLockeCoin}</td>
                  <td className="px-4 py-4">{product.sortOrder ?? 0}</td>
                  <td className="px-4 py-4"><AdminBadge tone={product.isRecommended ? "amber" : "slate"}>{product.isRecommended ? "推荐" : "不推荐"}</AdminBadge></td>
                  <td className="px-4 py-4"><AdminBadge tone={isProductActive(product) ? "green" : "slate"}>{productStatusLabel(product.status)}</AdminBadge></td>
                  <td className="px-4 py-4">{(product.realSales ?? product.sales) + (product.virtualSales ?? 0)}</td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-500">{new Date(product.createdAt).toLocaleString("zh-CN")}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/admin/product/${product.id}`} className="font-black text-blue-600">查看 / 编辑</Link>
                      <button className="font-black text-slate-600" onClick={() => setStatus(product.id, isProductActive(product) ? "inactive" : "active")}>{isProductActive(product) ? "下架" : "上架"}</button>
                      <button className="font-black text-rose-500" onClick={() => softDelete(product.id)}>删除</button>
                      <button className="font-black text-slate-400" onClick={() => alert("复制商品功能后续完善")}>复制商品</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminLayout>
  );
}
