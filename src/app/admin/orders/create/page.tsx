"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useMemo, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { adminCreateOrder, formatCurrency, isProductActive, readStore } from "@/lib/store";
import type { ProductCategory, ServicePort, StoreShape } from "@/lib/types";

const categories: ProductCategory[] = ["异色专区", "PVP专区", "陪玩专区", "资源专区"];
const ports: ServicePort[] = ["mobile", "pc", "both"];
const levelRank = { 明星: 5, 金牌: 4, 银牌: 3, 铜牌: 2, 见习: 1 };

export default function AdminCreateOrderPage() {
  const router = useRouter();
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [message, setMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");
  const [form, setForm] = useState({
    customerMode: "existing" as "existing" | "manual",
    customerId: "",
    customerName: "",
    productMode: "existing" as "existing" | "custom",
    productId: "",
    customProductName: "",
    customProductCategory: "资源专区" as ProductCategory,
    customProductDescription: "",
    priceRmb: "1",
    priceLockeCoin: "1",
    quantity: "1",
    servicePort: "mobile" as ServicePort,
    workerId: "",
    gameId: "",
    gameNickname: "",
    remark: "",
  });
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const users = useMemo(() => {
    const q = userSearch.trim();
    return store.users.filter((user) => user.role === "customer").filter((user) => !q || user.nickname.includes(q) || user.displayId.includes(q));
  }, [store.users, userSearch]);

  const products = useMemo(() => {
    const q = productSearch.trim();
    return store.products.filter((product) => isProductActive(product)).filter((product) => !q || product.name.includes(q) || product.category.includes(q));
  }, [productSearch, store.products]);

  const workers = useMemo(() => {
    const q = workerSearch.trim();
    return [...store.workers]
      .filter((worker) => worker.status !== "frozen")
      .filter((worker) => !q || worker.name.includes(q) || worker.level.includes(q))
      .sort((a, b) => {
        if (a.onlineStatus !== b.onlineStatus) return a.onlineStatus === "online" ? -1 : 1;
        if (levelRank[a.level] !== levelRank[b.level]) return levelRank[b.level] - levelRank[a.level];
        return b.completedOrderCount - a.completedOrderCount;
      });
  }, [store.workers, workerSearch]);

  const selectedProduct = store.products.find((item) => item.id === form.productId);
  const selectedWorker = store.workers.find((item) => item.id === form.workerId);
  const quantity = Math.max(1, Number(form.quantity) || 1);
  const unitPrice = form.productMode === "existing" ? selectedProduct?.priceRmb ?? 0 : Number(form.priceRmb) || 0;
  const total = unitPrice * quantity;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    try {
      const order = adminCreateOrder({
        customerMode: form.customerMode,
        customerId: form.customerId,
        customerName: form.customerName,
        productMode: form.productMode,
        productId: form.productId,
        customProductName: form.customProductName,
        customProductCategory: form.customProductCategory,
        customProductDescription: form.customProductDescription,
        priceRmb: Number(form.priceRmb),
        priceLockeCoin: Number(form.priceLockeCoin),
        quantity,
        servicePort: form.servicePort,
        workerId: form.workerId || null,
        gameId: form.gameId,
        gameNickname: form.gameNickname,
        remark: form.remark,
      });
      refresh();
      router.push(`/admin/order/${order.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建失败");
    }
  };

  return (
    <AdminLayout title="后台派单">
      <form className="grid gap-4 xl:grid-cols-[1fr_360px]" onSubmit={submit}>
        <div className="space-y-4">
          <AdminCard className="overflow-hidden">
            <SectionTitle number="1" title="客户信息" desc="为顾客创建订单" />
            <div className="space-y-4 p-5">
              <RadioGroup label="客户来源" value={form.customerMode} options={[["existing", "已有用户"], ["manual", "手动输入"]]} onChange={(value) => setForm({ ...form, customerMode: value as "existing" | "manual" })} />
              {form.customerMode === "existing" ? (
                <>
                  <input className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" placeholder="输入用户昵称或用户 ID 搜索" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} />
                  <select className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}>
                    <option value="">请选择用户</option>
                    {users.map((user) => <option key={user.id} value={user.id}>{user.nickname} · {user.displayId}</option>)}
                  </select>
                </>
              ) : (
                <input className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" placeholder="顾客昵称" value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} />
              )}
            </div>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <SectionTitle number="2" title="商品 & 规格" desc="选择商品或录入自定义商品" />
            <div className="space-y-4 p-5">
              <RadioGroup label="商品来源" value={form.productMode} options={[["existing", "已有商品"], ["custom", "自定义商品"]]} onChange={(value) => setForm({ ...form, productMode: value as "existing" | "custom" })} />
              {form.productMode === "existing" ? (
                <>
                  <input className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" placeholder="输入商品名称搜索" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} />
                  <select className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })}>
                    <option value="">请选择商品</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.category} · {formatCurrency(product.priceRmb)}</option>)}
                  </select>
                </>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="自定义商品名称" value={form.customProductName} onChange={(event) => setForm({ ...form, customProductName: event.target.value })} />
                  <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" value={form.customProductCategory} onChange={(event) => setForm({ ...form, customProductCategory: event.target.value as ProductCategory })}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
                  <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="价格 RMB" value={form.priceRmb} onChange={(event) => setForm({ ...form, priceRmb: event.target.value })} />
                  <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="价格洛克贝" value={form.priceLockeCoin} onChange={(event) => setForm({ ...form, priceLockeCoin: event.target.value })} />
                  <textarea className="md:col-span-2 min-h-20 rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="服务说明" value={form.customProductDescription} onChange={(event) => setForm({ ...form, customProductDescription: event.target.value })} />
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-black text-slate-500">服务端口<select className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.servicePort} onChange={(event) => setForm({ ...form, servicePort: event.target.value as ServicePort })}>{ports.map((item) => <option key={item} value={item}>{servicePortText(item)}</option>)}</select></label>
                <label className="text-xs font-black text-slate-500">数量<input className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <SectionTitle number="3" title="指定接单员（可选）" desc="留空则进入接单员端订单大厅" />
            <div className="space-y-4 p-5">
              <input className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" placeholder="输入接单员昵称或等级搜索" value={workerSearch} onChange={(event) => setWorkerSearch(event.target.value)} />
              <select className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" value={form.workerId} onChange={(event) => setForm({ ...form, workerId: event.target.value })}>
                <option value="">不指定，全员可抢</option>
                {workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name} · {worker.level} · {worker.onlineStatus === "online" ? "在线" : "离线"}</option>)}
              </select>
            </div>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <SectionTitle number="4" title="游戏信息" desc="用于接单员在游戏内联系到顾客" />
            <div className="grid gap-3 p-5 md:grid-cols-2">
              <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="游戏 ID" value={form.gameId} onChange={(event) => setForm({ ...form, gameId: event.target.value })} />
              <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="游戏昵称" value={form.gameNickname} onChange={(event) => setForm({ ...form, gameNickname: event.target.value })} />
            </div>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <SectionTitle number="5" title="备注" desc="客户特殊要求或后台说明" />
            <div className="p-5">
              <textarea className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="例如：客户希望今晚 9 点后开始" value={form.remark} onChange={(event) => setForm({ ...form, remark: event.target.value })} />
            </div>
          </AdminCard>

          <div className="flex items-center justify-end gap-3 rounded-2xl bg-white p-5">
            {message ? <p className="mr-auto text-sm font-bold text-rose-600">{message}</p> : <p className="mr-auto text-sm font-bold text-slate-400">提交后订单视为已收款，直接进入待接单或服务中。</p>}
            <Link href="/admin/orders" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-600">取消</Link>
            <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white">提交订单</button>
          </div>
        </div>

        <aside className="space-y-4">
          <AdminCard className="p-5">
            <div className="flex items-center justify-between"><h3 className="text-lg font-black">订单汇总</h3><AdminBadge tone="green">实时计算</AdminBadge></div>
            <div className="mt-4 space-y-3 text-sm">
              <Summary label="商品" value={(selectedProduct?.name ?? form.customProductName) || "-"} />
              <Summary label="端口" value={servicePortText(form.servicePort)} />
              <Summary label="单价" value={formatCurrency(unitPrice)} />
              <Summary label="数量" value={`× ${quantity}`} />
              <Summary label="接单员" value={selectedWorker?.name ?? "全员可抢"} />
              <div className="rounded-xl bg-amber-50 px-4 py-3"><p className="text-xs font-bold text-slate-400">订单总额</p><p className="mt-1 text-2xl font-black text-rose-500">{formatCurrency(total)}</p></div>
            </div>
          </AdminCard>
          <AdminCard className="p-5">
            <h3 className="text-lg font-black">派单流程</h3>
            <div className="mt-4 space-y-4">
              {["提交订单", "派发接单员 / 等待抢单", "服务进行", "完成结算"].map((item, index) => (
                <div key={item} className="flex gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-50 text-xs font-black text-blue-600">{index + 1}</span>
                  <p className="pt-1 text-sm font-black text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </AdminCard>
        </aside>
      </form>
    </AdminLayout>
  );
}

function SectionTitle({ number, title, desc }: { number: string; title: string; desc: string }) {
  return <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">{number}</span><h2 className="font-black">{title}</h2><p className="text-xs font-bold text-slate-400">{desc}</p></div>;
}

function RadioGroup({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) {
  return <div className="flex flex-wrap items-center gap-5 text-sm"><span className="font-black text-slate-500">{label}</span>{options.map(([id, text]) => <label key={id} className="flex items-center gap-2 font-black text-slate-600"><input type="radio" checked={value === id} onChange={() => onChange(id)} />{text}</label>)}</div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="font-bold text-slate-400">{label}</span><span className="font-black text-slate-700">{value}</span></div>;
}

function servicePortText(port?: ServicePort) {
  if (port === "pc") return "PC端";
  if (port === "both") return "双端";
  return "手游端";
}
