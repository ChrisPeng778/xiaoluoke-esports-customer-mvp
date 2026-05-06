"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { WorkerBottomNav } from "@/components/WorkerBottomNav";
import { WorkerHeader } from "@/components/WorkerHeader";
import { EmptyState } from "@/components/EmptyState";
import { SafeImage } from "@/components/SafeImage";
import { StatusBadge } from "@/components/StatusBadge";
import { useStoreSync, useWorkerSession } from "@/lib/hooks";
import { acceptOrderAsCurrentWorker, formatRock, formatTime, getAnnouncements, getCurrentWorkerOrders, getCurrentWorkerSupportRecords, getSystemSettings, getUnreadPinnedAnnouncement, incrementAnnouncementView, markAnnouncementRead } from "@/lib/store";
import type { Announcement } from "@/lib/types";

export default function WorkerHomePage() {
  const { session, ready, refresh } = useWorkerSession();
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<ReturnType<typeof getCurrentWorkerOrders>>([]);
  const [supportRecords, setSupportRecords] = useState<ReturnType<typeof getCurrentWorkerSupportRecords>>({ complaints: [], aftersales: [], reviews: [] });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [autoAnnouncement, setAutoAnnouncement] = useState<Announcement | null>(null);
  const loadOrders = useCallback(() => {
    setOrders(getCurrentWorkerOrders());
    setSupportRecords(getCurrentWorkerSupportRecords());
  }, []);
  useStoreSync(loadOrders, ready && Boolean(session), 1500);
  const announcement = getAnnouncements("worker")[0];
  const announcementUserId = session?.worker.id ?? "guest_worker";

  useEffect(() => {
    if (!ready || !session) return;
    const unread = getUnreadPinnedAnnouncement("worker", announcementUserId);
    if (unread) setAutoAnnouncement(unread);
  }, [announcementUserId, ready, session]);

  if (!ready) return null;

  if (!session) {
    return (
      <main className="page-shell">
        <WorkerHeader />
        <EmptyState title="请先登录接单员端" description="选择 mock 接单员身份后，可以查看待接订单和收益。" />
        <Link href="/worker/login" className="primary-button mt-4 w-full">进入接单员登录</Link>
      </main>
    );
  }

  const pendingOrders = orders.filter((order) => order.orderType === "service" && order.status === "pending").slice(0, 3);
  const activeOrders = orders.filter((order) => ["accepted", "worker_completed", "disputed"].includes(order.status)).slice(0, 3);
  const minimumDeposit = getSystemSettings().worker.minimumDepositAmount;
  const depositInsufficient = minimumDeposit > 0 && (session.worker.depositStatus !== "paid" || (session.worker.depositAmount ?? 0) < minimumDeposit);

  const accept = (orderId: string) => {
    try {
      acceptOrderAsCurrentWorker(orderId);
      refresh();
      setMessage("已接单，可以进入订单沟通。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "接单失败");
    }
  };

  const openAnnouncement = (item: Announcement) => {
    incrementAnnouncementView(item.id);
    setSelectedAnnouncement(item);
  };

  const closeAutoAnnouncement = () => {
    if (autoAnnouncement) markAnnouncementRead("worker", announcementUserId, autoAnnouncement.id);
    setAutoAnnouncement(null);
  };

  return (
    <main className="page-shell">
      <WorkerHeader session={session} />

      <section className="space-y-4">
        <div className="rounded-[26px] bg-gradient-to-br from-slate-950 via-stone-800 to-amber-700 p-5 text-white shadow-soft">
          <p className="text-xs font-black text-rock-gold">今日接单</p>
          <h1 className="mt-2 text-3xl font-black">{session.worker.name}</h1>
          <p className="mt-2 text-sm font-bold text-white/70">{session.worker.intro}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="可提取" value={`${formatRock(session.worker.availableBalance)} 洛克贝`} />
            <Metric label="累计获得" value={`${formatRock(session.worker.totalEarned)} 洛克贝`} />
            <Metric label="已完成" value={`${session.worker.completedOrderCount} 单`} />
          </div>
        </div>

        {announcement ? (
          <button className="panel flex w-full items-center gap-2 px-4 py-3 text-left" onClick={() => openAnnouncement(announcement)}>
            <span className="rounded-full bg-rock-gold px-2 py-1 text-xs font-black text-slate-900">公告</span>
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-600">{announcement.title}：{announcement.content}</p>
          </button>
        ) : null}

        {message ? <p className="rounded-[14px] bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-700">{message}</p> : null}
        {depositInsufficient ? <p className="rounded-[14px] bg-amber-50 px-3 py-3 text-sm font-black text-amber-700">保证金低于 {formatRock(minimumDeposit)} 洛克贝，暂不能接单。请联系平台运营处理保证金。</p> : null}

        {supportRecords.complaints.some((item) => ["pending", "processing"].includes(item.status)) || supportRecords.aftersales.some((item) => ["pending", "processing"].includes(item.status)) ? (
          <Link href="/worker/messages" className="panel block border-rose-100 bg-rose-50 p-4">
            <p className="text-sm font-black text-rose-700">投诉 / 售后提醒</p>
            <p className="mt-1 text-xs font-bold text-rose-500">
              当前有 {supportRecords.complaints.filter((item) => ["pending", "processing"].includes(item.status)).length} 条投诉、
              {supportRecords.aftersales.filter((item) => ["pending", "processing"].includes(item.status)).length} 条售后与您相关
            </p>
          </Link>
        ) : null}

        <SectionTitle title="待接订单" href="/worker/orders?tab=pending" />
        {pendingOrders.length ? (
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <div key={order.id} className="panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">{order.productName}</h2>
                    <p className="mt-1 text-xs font-bold text-stone-500">{formatTime(order.createdAt)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <button className="primary-button mt-3 w-full" onClick={() => accept(order.id)}>立即接单</button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="暂无待接订单" description="顾客下单后，可接订单会出现在这里。" />
        )}

        <SectionTitle title="进行中" href="/worker/orders?tab=active" />
        {activeOrders.length ? (
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <Link key={order.id} href={`/worker/order/${order.id}`} className="panel block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">{order.productName}</h2>
                    <p className="mt-1 text-xs font-bold text-stone-500">{order.customerName}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <WorkerBottomNav />
      {selectedAnnouncement ? <AnnouncementModal announcement={selectedAnnouncement} onClose={() => setSelectedAnnouncement(null)} /> : null}
      {autoAnnouncement ? <AnnouncementModal announcement={autoAnnouncement} onClose={closeAutoAnnouncement} /> : null}
    </main>
  );
}

function AnnouncementModal({ announcement, onClose }: { announcement: Announcement; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-5">
      <section className="max-h-[78vh] w-full max-w-[390px] overflow-y-auto rounded-[24px] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-amber-600">接单员公告</p>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-white/10 p-3">
      <p className="text-[10px] font-bold text-white/60">{label}</p>
      <p className="mt-1 text-sm font-black text-rock-gold">{value}</p>
    </div>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-black text-slate-900">{title}</h2>
      <Link href={href} className="text-xs font-black text-stone-500">查看全部</Link>
    </div>
  );
}
