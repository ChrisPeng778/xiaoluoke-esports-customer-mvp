"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { adminSetProductStatus, adminSoftDeleteProduct, adminUpdateProduct, formatCurrency, isProductActive, money, productStatusLabel, readStore } from "@/lib/store";
import type { Product, ProductCategory, ProductStatus, ProductWorkerIncomeType, ServicePort, StoreShape } from "@/lib/types";

const topCategories: ProductCategory[] = ["异色专区", "PVP专区", "陪玩专区", "资源专区"];
const portText: Record<ServicePort, string> = { mobile: "手游端", pc: "PC端", both: "双端" };

type ProductForm = {
  name: string;
  shortDescription: string;
  description: string;
  serviceDescription: string;
  category: ProductCategory;
  categoryId: string;
  priceRmb: string;
  priceLockeCoin: string;
  costPrice: string;
  imageUrl: string;
  homeImageUrl: string;
  detailImages: string;
  tags: string;
  servicePort: ServicePort;
  sortOrder: string;
  virtualSales: string;
  isRecommended: boolean;
  purchaseLimitEnabled: boolean;
  purchaseLimitPerUser: string;
  status: ProductStatus;
  workerIncomeType: ProductWorkerIncomeType;
  workerIncomeAmount: string;
  estimatedDuration: string;
  requireGameId: boolean;
  requireGameNickname: boolean;
  requireRemark: boolean;
  allowAssignedWorker: boolean;
};

export default function AdminProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const product = store.products.find((item) => item.id === params.id && !item.deleted);
  const [tab, setTab] = useState<"基本信息" | "定价与配置" | "图片与分类">("基本信息");
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const [form, setForm] = useState<ProductForm>(() => productToForm(product));
  const preview = formToProduct(product, form);
  const stats = useMemo(() => productStats(store, product?.id), [product?.id, store]);

  const save = () => {
    if (!product) return;
    setMessage("");
    try {
      adminUpdateProduct(product.id, formToPatch(form));
      refresh();
      setMessage("商品已保存，顾客端会读取最新配置。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
  };

  const toggleStatus = () => {
    if (!product) return;
    adminSetProductStatus(product.id, isProductActive(product) ? "inactive" : "active");
    refresh();
  };

  const remove = () => {
    if (!product || !confirm("确定删除该商品吗？已有订单的商品会软删除并下架。")) return;
    adminSoftDeleteProduct(product.id);
    router.replace("/admin/products");
  };

  return (
    <AdminLayout title="商品详情">
      {!product ? (
        <AdminCard className="p-8 text-center font-bold text-slate-400">商品不存在或已删除</AdminCard>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/admin/products" className="font-black text-blue-600">返回</Link>
              <h2 className="text-xl font-black">{preview.name}</h2>
              <span className="text-sm font-black text-slate-500">{formatCurrency(preview.priceRmb)} · {portText[preview.servicePort ?? "mobile"]}</span>
              <AdminBadge tone={isProductActive(preview) ? "green" : "slate"}>{productStatusLabel(preview.status)}</AdminBadge>
            </div>
            <div className="flex gap-2">
              <button className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white" onClick={save}>保存</button>
              <button className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-black text-slate-600" onClick={toggleStatus}>{isProductActive(product) ? "下架" : "上架"}</button>
              <button className="rounded-xl bg-rose-500 px-5 py-2 text-sm font-black text-white" onClick={remove}>删除</button>
            </div>
          </div>

          {message ? <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{message}</p> : null}

          <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <AdminCard className="p-5">
              <div className="flex gap-3 border-b border-slate-100">
                {(["基本信息", "定价与配置", "图片与分类"] as const).map((item) => (
                  <button key={item} className={`border-b-2 px-3 py-3 text-sm font-black ${tab === item ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`} onClick={() => setTab(item)}>{item}</button>
                ))}
              </div>

              {tab === "基本信息" ? <BasicTab form={form} setForm={setForm} /> : null}
              {tab === "定价与配置" ? <PricingTab form={form} setForm={setForm} /> : null}
              {tab === "图片与分类" ? <MediaTab form={form} setForm={setForm} store={store} /> : null}
            </AdminCard>

            <aside className="space-y-4">
              <PreviewCard product={preview} />
              <SalesCard stats={stats} />
            </aside>
          </section>
        </section>
      )}
    </AdminLayout>
  );
}

function BasicTab({ form, setForm }: { form: ProductForm; setForm: (form: ProductForm) => void }) {
  return (
    <div className="mt-5 space-y-4">
      <Field label="商品标题"><input className="admin-field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
      <Field label="商品简介"><textarea className="admin-textarea min-h-20" value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} /></Field>
      <Field label="商品描述">
        <div className="rounded-xl border border-slate-200">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 px-3 py-2 text-xs font-black text-slate-400">
            <span>正文</span><span>B</span><span>U</span><span>列表</span><span>链接</span><span>图片</span><span>富文本工具栏预留</span>
          </div>
          <textarea className="min-h-56 w-full rounded-b-xl px-3 py-3 text-sm outline-none" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="请输入商品详情，支持换行。" />
        </div>
      </Field>
      <Field label="服务说明"><textarea className="admin-textarea min-h-28" value={form.serviceDescription} onChange={(event) => setForm({ ...form, serviceDescription: event.target.value })} /></Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="排序"><input className="admin-field" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value.replace(/[^\d-]/g, "") })} /></Field>
        <Field label="虚拟销量"><input className="admin-field" value={form.virtualSales} onChange={(event) => setForm({ ...form, virtualSales: event.target.value.replace(/[^\d]/g, "") })} /></Field>
      </div>
      <SwitchRow label="启用限购" checked={form.purchaseLimitEnabled} onChange={(value) => setForm({ ...form, purchaseLimitEnabled: value })} />
      {form.purchaseLimitEnabled ? <Field label="每位用户最大购买次数"><input className="admin-field" value={form.purchaseLimitPerUser} onChange={(event) => setForm({ ...form, purchaseLimitPerUser: event.target.value.replace(/[^\d]/g, "") })} /></Field> : null}
      <SwitchRow label="是否推荐" checked={form.isRecommended} onChange={(value) => setForm({ ...form, isRecommended: value })} />
      <SwitchRow label="商品上架" checked={form.status === "on" || form.status === "active"} onChange={(value) => setForm({ ...form, status: value ? "active" : "inactive" })} />
    </div>
  );
}

function PricingTab({ form, setForm }: { form: ProductForm; setForm: (form: ProductForm) => void }) {
  const price = Number(form.priceLockeCoin || form.priceRmb || 0);
  const income = Number(form.workerIncomeAmount || 0);
  const workerIncome = form.workerIncomeType === "percent" ? money(price * income / 100) : money(income);
  const margin = money(price - workerIncome);
  return (
    <div className="mt-5 space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="RMB 价格"><input className="admin-field" value={form.priceRmb} onChange={(event) => setForm({ ...form, priceRmb: event.target.value.replace(/[^\d.]/g, "") })} /></Field>
        <Field label="洛克贝价格"><input className="admin-field" value={form.priceLockeCoin} onChange={(event) => setForm({ ...form, priceLockeCoin: event.target.value.replace(/[^\d.]/g, "") })} /></Field>
        <Field label="成本价"><input className="admin-field" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value.replace(/[^\d.]/g, "") })} /></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="接单员收益类型">
          <select className="admin-field" value={form.workerIncomeType} onChange={(event) => setForm({ ...form, workerIncomeType: event.target.value as ProductWorkerIncomeType })}>
            <option value="fixed">固定收益</option>
            <option value="percent">比例收益</option>
          </select>
        </Field>
        <Field label={form.workerIncomeType === "percent" ? "收益比例 %" : "收益金额"}>
          <input className="admin-field" value={form.workerIncomeAmount} onChange={(event) => setForm({ ...form, workerIncomeAmount: event.target.value.replace(/[^\d.]/g, "") })} />
        </Field>
        <Field label="平台毛利"><div className="grid h-11 place-items-center rounded-xl bg-slate-50 text-sm font-black text-emerald-600">{money(margin)} 洛克贝</div></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="服务端口">
          <select className="admin-field" value={form.servicePort} onChange={(event) => setForm({ ...form, servicePort: event.target.value as ServicePort })}>
            <option value="mobile">手游端</option>
            <option value="pc">PC端</option>
            <option value="both">双端</option>
          </select>
        </Field>
        <Field label="预计完成时间"><input className="admin-field" value={form.estimatedDuration} onChange={(event) => setForm({ ...form, estimatedDuration: event.target.value })} /></Field>
      </div>
      <SwitchRow label="需要顾客填写游戏 ID" checked={form.requireGameId} onChange={(value) => setForm({ ...form, requireGameId: value })} />
      <SwitchRow label="需要顾客填写游戏昵称" checked={form.requireGameNickname} onChange={(value) => setForm({ ...form, requireGameNickname: value })} />
      <SwitchRow label="需要备注" checked={form.requireRemark} onChange={(value) => setForm({ ...form, requireRemark: value })} />
      <SwitchRow label="允许指定接单员" checked={form.allowAssignedWorker} onChange={(value) => setForm({ ...form, allowAssignedWorker: value })} />
    </div>
  );
}

function MediaTab({ form, setForm, store }: { form: ProductForm; setForm: (form: ProductForm) => void; store: StoreShape }) {
  const parentCategories = store.product_categories.filter((item) => !item.parentId);
  return (
    <div className="mt-5 space-y-4">
      <Field label="商品主图"><input className="admin-field" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="/images/products/default-product.jpg" /></Field>
      <Field label="首页展示图"><input className="admin-field" value={form.homeImageUrl} onChange={(event) => setForm({ ...form, homeImageUrl: event.target.value })} placeholder="可选，留空使用商品主图" /></Field>
      <Field label="商品详情图"><textarea className="admin-textarea min-h-24" value={form.detailImages} onChange={(event) => setForm({ ...form, detailImages: event.target.value })} placeholder="每行一个 public/images 或外部图片 URL。上传功能后续接入 COS。" /></Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="商品分类">
          <select className="admin-field" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ProductCategory, categoryId: event.target.value })}>
            {topCategories.map((item) => <option key={item}>{item}</option>)}
            {parentCategories.filter((item) => !topCategories.includes(item.name as ProductCategory)).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
        </Field>
        <Field label="分类 ID / 二级分类"><input className="admin-field" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} /></Field>
      </div>
      <Field label="商品标签"><input className="admin-field" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="用中文逗号或英文逗号分隔" /></Field>
      <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-500" onClick={() => alert("图片上传后续接入 COS，当前可填写 public/images 本地路径。")}>上传图片占位</button>
    </div>
  );
}

function PreviewCard({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  return (
    <AdminCard className="overflow-hidden">
      <div className="border-b border-slate-100 p-4 font-black">商品预览</div>
      <div className="p-4">
        <div className="overflow-hidden rounded-2xl bg-slate-100">
          {failed ? <div className="grid h-48 place-items-center text-sm font-bold text-slate-400">图片加载失败</div> : <img src={product.homeImageUrl || product.imageUrl || "/images/products/default-product.jpg"} alt={product.name} className="h-48 w-full object-cover" onError={() => setFailed(true)} />}
          <div className="bg-white p-3">
            <p className="font-black">{product.name}</p>
            <p className="mt-1 text-lg font-black text-rose-500">{formatCurrency(product.priceRmb)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <AdminBadge tone={isProductActive(product) ? "green" : "slate"}>{productStatusLabel(product.status)}</AdminBadge>
              <AdminBadge tone="blue">{product.category}</AdminBadge>
              {product.isRecommended ? <AdminBadge tone="amber">推荐</AdminBadge> : null}
            </div>
            <p className="mt-2 text-xs font-bold text-slate-400">销量 {(product.realSales ?? product.sales) + (product.virtualSales ?? 0)}</p>
          </div>
        </div>
      </div>
    </AdminCard>
  );
}

function SalesCard({ stats }: { stats: ReturnType<typeof productStats> }) {
  const max = Math.max(1, ...stats.trend.map((item) => item.count));
  return (
    <AdminCard className="p-4">
      <h3 className="font-black">销售数据</h3>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Metric label="真实销量" value={stats.realSales} />
        <Metric label="虚拟销量" value={stats.virtualSales} />
        <Metric label="订单总数" value={stats.orderCount} />
        <Metric label="销售额" value={formatCurrency(stats.gmv)} />
        <Metric label="售后数" value={stats.afterSaleCount} />
        <Metric label="售后率" value={`${stats.afterSaleRate}%`} />
      </div>
      <p className="mt-5 text-xs font-black text-slate-400">近 7 日下单</p>
      <div className="mt-2 flex h-20 items-end gap-2">
        {stats.trend.map((item) => <div key={item.label} className="flex flex-1 flex-col items-center gap-1"><div className="w-full rounded-t bg-blue-500/70" style={{ height: `${Math.max(4, item.count / max * 64)}px` }} /><span className="text-[10px] font-bold text-slate-400">{item.label}</span></div>)}
      </div>
    </AdminCard>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-black text-slate-500 md:grid-cols-[140px_1fr] md:items-start"><span className="pt-3">{label}</span>{children}</label>;
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-600" onClick={() => onChange(!checked)}><span>{label}</span><span className={`h-7 w-12 rounded-full p-1 transition ${checked ? "bg-blue-600" : "bg-slate-300"}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} /></span></button>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div><p className="text-lg font-black">{value}</p><p className="mt-1 text-xs font-bold text-slate-400">{label}</p></div>;
}

function productToForm(product?: Product): ProductForm {
  return {
    name: product?.name ?? "",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    serviceDescription: product?.serviceDescription ?? "",
    category: product?.category ?? "异色专区",
    categoryId: product?.categoryId ?? product?.category ?? "异色专区",
    priceRmb: String(product?.priceRmb ?? 1),
    priceLockeCoin: String(product?.priceLockeCoin ?? 1),
    costPrice: String(product?.costPrice ?? 0),
    imageUrl: product?.imageUrl ?? "/images/products/default-product.jpg",
    homeImageUrl: product?.homeImageUrl ?? "",
    detailImages: (product?.detailImages ?? []).join("\n"),
    tags: (product?.tags ?? []).join("，"),
    servicePort: product?.servicePort ?? "mobile",
    sortOrder: String(product?.sortOrder ?? 0),
    virtualSales: String(product?.virtualSales ?? 0),
    isRecommended: product?.isRecommended ?? false,
    purchaseLimitEnabled: product?.purchaseLimitEnabled ?? false,
    purchaseLimitPerUser: String(product?.purchaseLimitPerUser ?? 1),
    status: product?.status ?? "inactive",
    workerIncomeType: product?.workerIncomeType ?? "fixed",
    workerIncomeAmount: String(product?.workerIncomeAmount ?? product?.priceLockeCoin ?? 1),
    estimatedDuration: product?.estimatedDuration ?? "预计 24 小时内完成",
    requireGameId: product?.requireGameId ?? true,
    requireGameNickname: product?.requireGameNickname ?? true,
    requireRemark: product?.requireRemark ?? false,
    allowAssignedWorker: product?.allowAssignedWorker ?? true,
  };
}

function formToPatch(form: ProductForm): Partial<Product> {
  return {
    name: form.name.trim() || "未命名商品",
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    serviceDescription: form.serviceDescription.trim(),
    category: form.category,
    categoryId: form.categoryId.trim() || form.category,
    priceRmb: Number(form.priceRmb) || 1,
    priceLockeCoin: Number(form.priceLockeCoin) || Number(form.priceRmb) || 1,
    costPrice: Number(form.costPrice) || 0,
    imageUrl: form.imageUrl.trim() || "/images/products/default-product.jpg",
    homeImageUrl: form.homeImageUrl.trim() || undefined,
    detailImages: form.detailImages.split(/\n|,|，/).map((item) => item.trim()).filter(Boolean),
    tags: form.tags.split(/,|，/).map((item) => item.trim()).filter(Boolean),
    servicePort: form.servicePort,
    sortOrder: Number(form.sortOrder) || 0,
    virtualSales: Number(form.virtualSales) || 0,
    isRecommended: form.isRecommended,
    purchaseLimitEnabled: form.purchaseLimitEnabled,
    purchaseLimitPerUser: Math.max(1, Number(form.purchaseLimitPerUser) || 1),
    status: form.status,
    workerIncomeType: form.workerIncomeType,
    workerIncomeAmount: Number(form.workerIncomeAmount) || 0,
    estimatedDuration: form.estimatedDuration.trim(),
    requireGameId: form.requireGameId,
    requireGameNickname: form.requireGameNickname,
    requireRemark: form.requireRemark,
    allowAssignedWorker: form.allowAssignedWorker,
  };
}

function formToProduct(base: Product | undefined, form: ProductForm): Product {
  return { ...(base ?? { id: "preview", sales: 0, tags: [], createdAt: new Date().toISOString(), status: "inactive" as const }), ...formToPatch(form) } as Product;
}

function productStats(store: StoreShape, productId?: string) {
  const orders = productId ? store.orders.filter((order) => order.productId === productId) : [];
  const afterSale = orders.filter((order) => ["refunded", "disputed", "after_sale", "after_sale_refunded"].includes(order.status));
  const gmv = money(orders.filter((order) => !["unpaid", "cancelled", "refunded", "after_sale_refunded"].includes(order.status)).reduce((sum, order) => sum + (order.amountRmb ?? order.amount ?? 0), 0));
  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { label: key.slice(5), count: orders.filter((order) => order.createdAt.slice(0, 10) === key).length };
  });
  const product = store.products.find((item) => item.id === productId);
  return {
    realSales: product?.realSales ?? product?.sales ?? orders.length,
    virtualSales: product?.virtualSales ?? 0,
    orderCount: orders.length,
    gmv,
    afterSaleCount: afterSale.length,
    afterSaleRate: orders.length ? money(afterSale.length / orders.length * 100) : 0,
    trend,
  };
}
