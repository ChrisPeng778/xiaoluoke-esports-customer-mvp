"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/store";
import { SafeImage } from "@/components/SafeImage";

export function ProductCard({
  product,
  workerId,
  variant = "list",
}: {
  product: Product;
  workerId?: string | null;
  variant?: "list" | "compact";
}) {
  const query = workerId ? `?workerId=${workerId}` : "";
  const image = product.homeImageUrl || product.imageUrl;
  const sales = (product.realSales ?? product.sales) + (product.virtualSales ?? 0);

  if (variant === "compact") {
    return (
      <Link
        href={`/customer/product/${product.id}${query}`}
        className="panel block overflow-hidden p-2 active:scale-[0.995]"
      >
        <SafeImage
          src={image}
          alt={product.name}
          className="aspect-square w-full rounded-[14px] text-[11px]"
          imgClassName="object-contain scale-[0.9]"
          fallbackText="商品图"
        />
        <h3 className="mt-2 min-h-9 line-clamp-2 text-[13px] font-black leading-[18px] text-slate-900">
          {product.name}
        </h3>
        <p className="mt-1 text-base font-black leading-none text-orange-500">{formatCurrency(product.priceRmb)}</p>
      </Link>
    );
  }

  return (
    <Link href={`/customer/product/${product.id}${query}`} className="panel block p-3 active:scale-[0.995]">
      <div className="flex gap-3">
        <SafeImage
          src={image}
          alt={product.name}
          className="h-20 w-20 shrink-0 rounded-[16px]"
          imgClassName="object-contain scale-[0.9]"
          fallbackText="商品图"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-base font-black text-slate-900">{product.name}</h3>
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">
              {product.category}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{product.description}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-black text-orange-500">{formatCurrency(product.priceRmb)}</span>
            <span className="text-xs font-bold text-slate-400">销量 {sales}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
