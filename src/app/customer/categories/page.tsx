"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { useCustomerSession } from "@/lib/hooks";
import { getProducts, getVisibleProductCategories } from "@/lib/store";
import type { ProductCategory } from "@/lib/types";

const sorts = ["综合", "销量", "价格", "上新"] as const;

export default function CategoriesPage() {
  return (
    <Suspense fallback={null}>
      <CategoriesContent />
    </Suspense>
  );
}

function CategoriesContent() {
  const searchParams = useSearchParams();
  const { session, ready } = useCustomerSession();
  const [category, setCategory] = useState<ProductCategory | "全部">("全部");
  const [sort, setSort] = useState<(typeof sorts)[number]>("综合");
  const workerId = searchParams.get("workerId");
  const categories = ["全部", ...getVisibleProductCategories().map((item) => item.name)] as Array<ProductCategory | "全部">;

  const products = useMemo(() => {
    const list = [...getProducts(category)];
    if (sort === "销量") list.sort((a, b) => ((b.realSales ?? b.sales) + (b.virtualSales ?? 0)) - ((a.realSales ?? a.sales) + (a.virtualSales ?? 0)));
    if (sort === "价格") list.sort((a, b) => a.priceRmb - b.priceRmb);
    if (sort === "上新") list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [category, sort]);

  if (!ready) return null;

  return (
    <main className="page-shell">
      <AppHeader session={session} />

      <section className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900">商品分类</h1>

        <div className="flex gap-2 overflow-x-auto">
          {sorts.map((item) => (
            <button
              key={item}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
                sort === item ? "bg-rock-gold text-slate-900" : "bg-white text-slate-500"
              }`}
              onClick={() => setSort(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[86px_1fr] gap-3">
          <div className="space-y-2">
            {categories.map((item) => (
              <button
                key={item}
                className={`h-11 w-full rounded-[14px] text-sm font-black ${
                  category === item ? "bg-rock-gold text-slate-900" : "bg-white text-slate-500"
                }`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} workerId={workerId} />
            ))}
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
