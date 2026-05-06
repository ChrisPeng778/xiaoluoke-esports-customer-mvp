"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { SafeImage } from "@/components/SafeImage";
import { useCustomerSession } from "@/lib/hooks";
import { formatTime, getAnnouncements, getProducts, getUnreadPinnedAnnouncement, getVisibleProductCategories, incrementAnnouncementView, markAnnouncementRead } from "@/lib/store";
import type { Announcement, ProductCategory } from "@/lib/types";

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
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [autoAnnouncement, setAutoAnnouncement] = useState<Announcement | null>(null);
  const categories = ["全部分类", ...getVisibleProductCategories().map((item) => item.name)] as Array<ProductCategory | "全部分类">;
  const products = getProducts(activeCategory);
  const announcement = getAnnouncements("customer")[0];
  const workerId = searchParams.get("workerId");
  const announcementUserId = session?.user.id ?? "guest_customer";

  useEffect(() => {
    if (!ready) return;
    const unread = getUnreadPinnedAnnouncement("customer", announcementUserId);
    if (unread) setAutoAnnouncement(unread);
  }, [announcementUserId, ready]);

  const openAnnouncement = (item: Announcement) => {
    incrementAnnouncementView(item.id);
    setSelectedAnnouncement(item);
  };

  const closeAutoAnnouncement = () => {
    if (autoAnnouncement) markAnnouncementRead("customer", announcementUserId, autoAnnouncement.id);
    setAutoAnnouncement(null);
  };

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

        {announcement ? (
          <button className="panel flex w-full items-center gap-2 px-4 py-3 text-left" onClick={() => openAnnouncement(announcement)}>
            <span className="rounded-full bg-rock-gold px-2 py-1 text-xs font-black text-slate-900">公告</span>
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-600">{announcement.title}：{announcement.content}</p>
          </button>
        ) : null}

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
      {selectedAnnouncement ? (
        <AnnouncementModal announcement={selectedAnnouncement} onClose={() => setSelectedAnnouncement(null)} />
      ) : null}
      {autoAnnouncement ? (
        <AnnouncementModal announcement={autoAnnouncement} onClose={closeAutoAnnouncement} />
      ) : null}
    </main>
  );
}

function AnnouncementModal({ announcement, onClose }: { announcement: Announcement; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-5">
      <section className="max-h-[78vh] w-full max-w-[390px] overflow-y-auto rounded-[24px] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-amber-600">公告</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">{announcement.title}</h2>
            <p className="mt-1 text-xs font-bold text-slate-400">{formatTime(announcement.publishAt || announcement.createdAt)}</p>
          </div>
          <button className="rounded-full bg-slate-100 px-3 py-1 text-lg font-black text-slate-500" onClick={onClose}>×</button>
        </div>
        {announcement.coverImage ? <SafeImage src={announcement.coverImage} alt={announcement.title} className="mt-4 aspect-[16/9] w-full rounded-2xl" imgClassName="object-cover" /> : null}
        <p className="mt-4 whitespace-pre-wrap text-sm font-bold leading-7 text-slate-600">{announcement.content}</p>
      </section>
    </div>
  );
}
