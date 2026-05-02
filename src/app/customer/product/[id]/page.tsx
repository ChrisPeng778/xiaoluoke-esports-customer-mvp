"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AuthPrompt } from "@/components/AuthPrompt";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { SafeImage } from "@/components/SafeImage";
import { useCustomerSession } from "@/lib/hooks";
import { formatCurrency, formatRock, getProduct } from "@/lib/store";

export default function ProductDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProductDetailContent />
    </Suspense>
  );
}

function ProductDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, ready, refresh } = useCustomerSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const product = getProduct(params.id);
  const workerId = searchParams.get("workerId");

  if (!ready) return null;

  if (!product) {
    return (
      <main className="page-shell">
        <AppHeader session={session} />
        <EmptyState title="商品不存在" description="商品可能已下架，后续管理员端会支持上下架管理。" />
        <BottomNav />
      </main>
    );
  }

  const orderNow = () => {
    if (!session) {
      setLoginOpen(true);
      return;
    }
    router.push(`/customer/order-confirm/${product.id}${workerId ? `?workerId=${workerId}` : ""}`);
  };

  return (
    <main className="page-shell">
      <AppHeader session={session} />

      <section className="space-y-4 pb-20">
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          className="aspect-square w-full rounded-[24px] text-base shadow-soft"
          imgClassName="object-contain scale-[0.94]"
          fallbackText="商品图"
        />
        <div className="panel p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{product.name}</h1>
              <p className="mt-2 text-sm font-bold text-slate-500">销量 {product.sales}</p>
            </div>
            <p className="shrink-0 text-2xl font-black text-orange-500">{formatCurrency(product.priceRmb)}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">{product.category}</span>
            {product.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{product.description}</p>
          <p className="mt-3 text-xs font-bold text-slate-400">洛克贝支付：{formatRock(product.priceLockeCoin)} 洛克贝</p>
        </div>

        <div className="panel p-4">
          <h2 className="text-lg font-black text-slate-900">商品详情</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {product.description} 当前页面为测试版商品框架，后续会补充更完整的服务范围、交付标准和注意事项。
          </p>
        </div>

        <div className="panel p-4">
          <h2 className="text-lg font-black text-slate-900">服务说明</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{product.serviceDescription}</p>
        </div>

      </section>

      <div className="fixed inset-x-0 bottom-16 z-20 px-4">
        <div className="mx-auto grid max-w-[430px] grid-cols-[104px_1fr] gap-3 rounded-[20px] bg-white/95 p-3 shadow-soft backdrop-blur">
          <button className="secondary-button" onClick={() => alert("在线客服功能正在完善中。")}>
            客服
          </button>
          <button className="primary-button" onClick={orderNow}>
            立即下单
          </button>
        </div>
      </div>

      <AuthPrompt open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={refresh} title="下单前需要微信登录" />
      <BottomNav />
    </main>
  );
}
