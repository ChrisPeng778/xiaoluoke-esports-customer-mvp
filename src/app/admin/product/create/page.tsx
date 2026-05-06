"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { adminCreateProduct, formatCurrency, readStore } from "@/lib/store";
import type { ProductCategory, ProductWorkerIncomeType, ServicePort, StoreShape } from "@/lib/types";

const categories: ProductCategory[] = ["异色专区", "PVP专区", "陪玩专区", "资源专区"];
const portText: Record<ServicePort, string> = { mobile: "手游端", pc: "PC端", both: "双端" };

export default function AdminProductCreatePage() {
  const router = useRouter();
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [tab, setTab] = useState<"基本信息" | "定价与配置" | "图片与分类">("基本信息");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    description: "",
    serviceDescription: "当前为测试版商品页面，详细服务说明后续补充。",
    category: "异色专区" as ProductCategory,
    categoryId: "异色专区",
    priceRmb: "1",
    priceLockeCoin: "1",
    costPrice: "0",
    imageUrl: "/images/products/default-product.jpg",
    homeImageUrl: "",
    detailImages: "",
    tags: "",
    servicePort: "mobile" as ServicePort,
    sortOrder: "0",
    virtualSales: "0",
    isRecommended: false,
    purchaseLimitEnabled: false,
    purchaseLimitPerUser: "1",
    status: "inactive" as const,
    workerIncomeType: "fixed" as ProductWorkerIncomeType,
    workerIncomeAmount: "1",
    estimatedDuration: "预计 24 小时内完成",
    requireGameId: true,
    requireGameNickname: true,
    requireRemark: false,
    allowAssignedWorker: true,
  });
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const submit = () => {
    setMessage("");
    try {
      const product = adminCreateProduct({
        name: form.name,
        shortDescription: form.shortDescription,
        description: form.description,
        serviceDescription: form.serviceDescription,
        category: form.category,
        categoryId: form.categoryId,
        priceRmb: Number(form.priceRmb) || 1,
        priceLockeCoin: Number(form.priceLockeCoin) || Number(form.priceRmb) || 1,
        costPrice: Number(form.costPrice) || 0,
        imageUrl: form.imageUrl,
        homeImageUrl: form.homeImageUrl,
        detailImages: form.detailImages.split(/\n|,|，/).map((item) => item.trim()).filter(Boolean),
        tags: form.tags.split(/,|，/).map((item) => item.trim()).filter(Boolean),
        servicePort: form.servicePort,
        sortOrder: Number(form.sortOrder) || 0,
        virtualSales: Number(form.virtualSales) || 0,
        isRecommended: form.isRecommended,
        purchaseLimitEnabled: form.purchaseLimitEnabled,
        purchaseLimitPerUser: Number(form.purchaseLimitPerUser) || 1,
        status: form.status,
        workerIncomeType: form.workerIncomeType,
        workerIncomeAmount: Number(form.workerIncomeAmount) || 0,
        estimatedDuration: form.estimatedDuration,
        requireGameId: form.requireGameId,
        requireGameNickname: form.requireGameNickname,
        requireRemark: form.requireRemark,
        allowAssignedWorker: form.allowAssignedWorker,
      });
      router.replace(`/admin/product/${product.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "新增失败");
    }
  };

  return (
    <AdminLayout title="新增商品">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/admin/products" className="font-black text-blue-600">返回</Link>
            <h2 className="text-xl font-black">新增商品</h2>
            <AdminBadge tone="slate">默认下架</AdminBadge>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/products" className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-black text-slate-600">取消</Link>
            <button className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white" onClick={submit}>保存商品</button>
          </div>
        </div>
        {message ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-600">{message}</p> : null}
        <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <AdminCard className="p-5">
            <div className="flex gap-3 border-b border-slate-100">
              {(["基本信息", "定价与配置", "图片与分类"] as const).map((item) => <button key={item} className={`border-b-2 px-3 py-3 text-sm font-black ${tab === item ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`} onClick={() => setTab(item)}>{item}</button>)}
            </div>
            <div className="mt-5 space-y-4">
              {tab === "基本信息" ? (
                <>
                  <Field label="商品标题"><input className="admin-field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
                  <Field label="商品简介"><textarea className="admin-textarea min-h-20" value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} /></Field>
                  <Field label="商品描述"><textarea className="admin-textarea min-h-56" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
                  <Field label="服务说明"><textarea className="admin-textarea min-h-28" value={form.serviceDescription} onChange={(event) => setForm({ ...form, serviceDescription: event.target.value })} /></Field>
                  <Field label="排序"><input className="admin-field" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value.replace(/[^\d-]/g, "") })} /></Field>
                  <Switch label="是否推荐" checked={form.isRecommended} onChange={(value) => setForm({ ...form, isRecommended: value })} />
                </>
              ) : null}
              {tab === "定价与配置" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="RMB 价格"><input className="admin-field" value={form.priceRmb} onChange={(event) => setForm({ ...form, priceRmb: event.target.value.replace(/[^\d.]/g, "") })} /></Field>
                    <Field label="洛克贝价格"><input className="admin-field" value={form.priceLockeCoin} onChange={(event) => setForm({ ...form, priceLockeCoin: event.target.value.replace(/[^\d.]/g, "") })} /></Field>
                    <Field label="成本价"><input className="admin-field" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value.replace(/[^\d.]/g, "") })} /></Field>
                  </div>
                  <Field label="服务端口"><select className="admin-field" value={form.servicePort} onChange={(event) => setForm({ ...form, servicePort: event.target.value as ServicePort })}><option value="mobile">手游端</option><option value="pc">PC端</option><option value="both">双端</option></select></Field>
                  <Field label="收益类型"><select className="admin-field" value={form.workerIncomeType} onChange={(event) => setForm({ ...form, workerIncomeType: event.target.value as ProductWorkerIncomeType })}><option value="fixed">固定收益</option><option value="percent">比例收益</option></select></Field>
                  <Field label="接单员收益"><input className="admin-field" value={form.workerIncomeAmount} onChange={(event) => setForm({ ...form, workerIncomeAmount: event.target.value.replace(/[^\d.]/g, "") })} /></Field>
                  <Switch label="需要游戏 ID" checked={form.requireGameId} onChange={(value) => setForm({ ...form, requireGameId: value })} />
                  <Switch label="需要游戏昵称" checked={form.requireGameNickname} onChange={(value) => setForm({ ...form, requireGameNickname: value })} />
                  <Switch label="允许指定接单员" checked={form.allowAssignedWorker} onChange={(value) => setForm({ ...form, allowAssignedWorker: value })} />
                </>
              ) : null}
              {tab === "图片与分类" ? (
                <>
                  <Field label="商品主图"><input className="admin-field" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} /></Field>
                  <Field label="详情图"><textarea className="admin-textarea min-h-20" value={form.detailImages} onChange={(event) => setForm({ ...form, detailImages: event.target.value })} /></Field>
                  <Field label="商品分类"><select className="admin-field" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ProductCategory, categoryId: event.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></Field>
                  <Field label="商品标签"><input className="admin-field" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} /></Field>
                </>
              ) : null}
            </div>
          </AdminCard>
          <AdminCard className="p-4">
            <h3 className="font-black">商品预览</h3>
            <img src={form.imageUrl || "/images/products/default-product.jpg"} alt={form.name || "商品"} className="mt-4 h-48 w-full rounded-2xl object-cover" />
            <p className="mt-3 font-black">{form.name || "未命名商品"}</p>
            <p className="mt-1 text-lg font-black text-rose-500">{formatCurrency(Number(form.priceRmb) || 1)}</p>
            <p className="mt-2 text-sm font-bold text-slate-500">{form.category} · {portText[form.servicePort]}</p>
          </AdminCard>
        </section>
      </section>
    </AdminLayout>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-black text-slate-500 md:grid-cols-[120px_1fr] md:items-start"><span className="pt-3">{label}</span>{children}</label>;
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-600" onClick={() => onChange(!checked)}><span>{label}</span><span className={`h-7 w-12 rounded-full p-1 ${checked ? "bg-blue-600" : "bg-slate-300"}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} /></span></button>;
}
