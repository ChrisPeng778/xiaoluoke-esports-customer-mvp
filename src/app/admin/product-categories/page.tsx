"use client";

import { useCallback, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { adminDeleteProductCategory, adminSetProductCategoryStatus, adminUpsertProductCategory, isProductActive, productStatusLabel, readStore } from "@/lib/store";
import type { ProductCategoryRecord, ProductStatus, StoreShape } from "@/lib/types";

type CategoryForm = {
  id?: string;
  parentId: string;
  name: string;
  iconUrl: string;
  sortOrder: string;
  status: ProductStatus;
};

export default function AdminProductCategoriesPage() {
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [filters, setFilters] = useState({ name: "", status: "all" as "all" | "active" | "inactive" });
  const [form, setForm] = useState<CategoryForm | null>(null);
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const rows = useMemo(() => {
    const sorted = [...store.product_categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const roots = sorted.filter((item) => !item.parentId);
    return roots.flatMap((root) => [root, ...sorted.filter((item) => item.parentId === root.id)]);
  }, [store.product_categories]);

  const filteredRows = rows
    .filter((item) => !filters.name.trim() || item.name.includes(filters.name.trim()))
    .filter((item) => filters.status === "all" || (filters.status === "active" ? isProductActive(item) : !isProductActive(item)));

  const openCreate = () => setForm({ parentId: "0", name: "", iconUrl: "", sortOrder: "0", status: "on" });
  const openEdit = (category: ProductCategoryRecord) => setForm({
    id: category.id,
    parentId: category.parentId ?? "0",
    name: category.name,
    iconUrl: category.iconUrl ?? "",
    sortOrder: String(category.sortOrder),
    status: category.status,
  });

  const submit = () => {
    if (!form) return;
    setMessage("");
    try {
      adminUpsertProductCategory({
        id: form.id,
        parentId: form.parentId === "0" ? null : form.parentId,
        name: form.name,
        iconUrl: form.iconUrl,
        sortOrder: Number(form.sortOrder) || 0,
        status: form.status,
      });
      setForm(null);
      refresh();
      setMessage("分类已保存，顾客端分类页会同步刷新。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
  };

  const remove = (category: ProductCategoryRecord) => {
    if (!confirm(`确定删除分类「${category.name}」吗？`)) return;
    setMessage("");
    try {
      adminDeleteProductCategory(category.id);
      refresh();
      setMessage("分类已删除。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    }
  };

  const setStatus = (category: ProductCategoryRecord, status: ProductStatus) => {
    setMessage("");
    try {
      adminSetProductCategoryStatus(category.id, status);
      refresh();
      setMessage(isProductActive({ ...category, status }) ? "分类已上架。" : "分类已下架，顾客端不再展示该分类及其商品。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败");
    }
  };

  const parentOptions = store.product_categories.filter((item) => !item.parentId && item.id !== form?.id);

  return (
    <AdminLayout title="商品分类">
      <AdminCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">商品分类</h2>
            <p className="mt-1 text-sm font-bold text-slate-400">最多支持二级分类；下架分类会同步隐藏顾客端对应分类和商品。</p>
          </div>
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white" onClick={openCreate}>新增分类</button>
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[1fr_220px_auto]">
          <input className="admin-field" placeholder="请输入分类名称" value={filters.name} onChange={(event) => setFilters({ ...filters, name: event.target.value })} />
          <select className="admin-field" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as typeof filters.status })}>
            <option value="all">全部状态</option>
            <option value="active">上架</option>
            <option value="inactive">下架</option>
          </select>
          <button className="rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-500" onClick={() => setFilters({ name: "", status: "all" })}>重置</button>
        </div>

        {message ? <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{message}</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>{["分类名称", "图标", "排序", "状态", "创建时间", "操作"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((category) => {
                const isChild = Boolean(category.parentId);
                return (
                  <tr key={category.id} className={isChild ? "bg-white" : "bg-slate-50/70"}>
                    <td className="px-4 py-4">
                      <span className={`font-black ${isChild ? "pl-8 text-slate-600" : "text-slate-900"}`}>{isChild ? "└ " : "⌄ "}{category.name}</span>
                    </td>
                    <td className="px-4 py-4">{category.iconUrl ? <img src={category.iconUrl} alt={category.name} className="h-8 w-8 rounded-lg object-cover" /> : <span className="text-slate-400">-</span>}</td>
                    <td className="px-4 py-4">{category.sortOrder}</td>
                    <td className="px-4 py-4"><AdminBadge tone={isProductActive(category) ? "green" : "slate"}>{productStatusLabel(category.status)}</AdminBadge></td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-500">{new Date(category.createdAt).toLocaleString("zh-CN")}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <button className="font-black text-blue-600" onClick={() => openEdit(category)}>编辑</button>
                        <button className="font-black text-slate-600" onClick={() => setStatus(category, isProductActive(category) ? "inactive" : "active")}>{isProductActive(category) ? "下架" : "上架"}</button>
                        <button className="font-black text-rose-500" onClick={() => remove(category)}>删除</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {form ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black">{form.id ? "编辑商品分类" : "新增商品分类"}</h3>
              <button className="text-2xl text-slate-400" onClick={() => setForm(null)}>×</button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="grid gap-2 text-sm font-black text-slate-600">
                父级分类
                <select className="admin-field" value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}>
                  <option value="0">0 - 一级分类</option>
                  {parentOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <span className="text-xs font-bold text-slate-400">仅支持两级分类，二级分类下不能再添加子级。</span>
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-600">
                分类名称
                <input className="admin-field" maxLength={50} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-600">
                分类图标
                <input className="admin-field" value={form.iconUrl} onChange={(event) => setForm({ ...form, iconUrl: event.target.value })} placeholder="/images/..." />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-600">
                排序
                <input className="admin-field" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value.replace(/[^\d-]/g, "") })} />
              </label>
              <div className="flex items-center gap-3 text-sm font-black">
                <span>状态</span>
                <button className={`rounded-full px-4 py-2 ${isProductActive(form) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`} onClick={() => setForm({ ...form, status: isProductActive(form) ? "inactive" : "active" })}>{isProductActive(form) ? "上架" : "下架"}</button>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-black text-slate-600" onClick={() => setForm(null)}>取消</button>
              <button className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white" onClick={submit}>提交</button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
