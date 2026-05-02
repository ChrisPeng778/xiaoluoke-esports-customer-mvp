"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { SafeImage } from "@/components/SafeImage";
import { useCustomerSession } from "@/lib/hooks";
import { getAnnouncements, getProducts } from "@/lib/store";
import type { ProductCategory } from "@/lib/types";

const categories: Array<ProductCategory | "全部分类"> = ["全部分类", "异色专区", "PVP专区", "陪玩专区", "资源专区"];
const homeBannerImage = "/images/banners/home-main.jpg";

export default function CustomerHomePage() {
  return (
    <Suspense fallback={null}>
      <CustomerHomeContent />
    </Suspense>
  );
}

function CustomerHomeContent() {
  const searchParams = useSearchParams();
  const { session, ready } = useCustomerSession();
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "全部分类">("全部分类");
  const products = getProducts(activeCategory);
  const announcement = getAnnouncements()[0];
  const workerId = searchParams.get("workerId");

  if (!ready) return null;

  return (
    <main className="page-shell">
      <AppHeader session={session} />

      <section className="space-y-4">
        <SafeImage
          src={homeBannerImage}
          alt="小洛克电竞首页 Banner"
          className="aspect-[2/1] w-full rounded-[24px] shadow-soft"
          imgClassName="object-cover"
          fallbackText="首页 Banner 图待放入"
        />

        <Link href="/customer/notice" className="panel flex items-center gap-2 px-4 py-3">
          <span className="rounded-full bg-rock-gold px-2 py-1 text-xs font-black text-slate-900">公告</span>
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-600">
            {announcement?.content ?? "欢迎来到小洛克电竞，当前为测试版本，部分功能与内容正在逐步完善中。"}
          </p>
        </Link>

        <div className="grid grid-cols-3 gap-3">
          <Link href="/customer/worker-apply" className="panel px-3 py-4 text-center text-sm font-black text-slate-800">
            接单员入驻
          </Link>
          <Link href="/customer/must-read" className="panel px-3 py-4 text-center text-sm font-black text-slate-800">
            下单必看
          </Link>
          <Link href="/customer/ranking" className="panel px-3 py-4 text-center text-sm font-black text-slate-800">
            排行榜
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
                activeCategory === category ? "bg-rock-gold text-slate-900" : "bg-white text-slate-500"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} workerId={workerId} variant="compact" />
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
