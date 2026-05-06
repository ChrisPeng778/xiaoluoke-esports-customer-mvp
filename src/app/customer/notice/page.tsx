"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SafeImage } from "@/components/SafeImage";
import { useCustomerSession } from "@/lib/hooks";
import { formatTime, getAnnouncements, incrementAnnouncementView } from "@/lib/store";
import type { Announcement } from "@/lib/types";

export default function NoticePage() {
  const { session, ready } = useCustomerSession();
  const [selected, setSelected] = useState<Announcement | null>(null);
  const announcements = getAnnouncements("customer");
  if (!ready) return null;

  const open = (item: Announcement) => {
    incrementAnnouncementView(item.id);
    setSelected(item);
  };

  return (
    <main className="page-shell">
      <AppHeader session={session} />
      <section className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900">公告通知</h1>
        {announcements.map((item) => (
          <button key={item.id} className="panel w-full p-4 text-left" onClick={() => open(item)}>
            <h2 className="text-lg font-black text-slate-900">{item.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.content}</p>
            <p className="mt-3 text-xs font-bold text-slate-400">{formatTime(item.publishAt || item.createdAt)}</p>
          </button>
        ))}
        {!announcements.length ? <p className="panel p-5 text-center text-sm font-black text-slate-400">暂无公告</p> : null}
      </section>
      <BottomNav />
      {selected ? <NoticeModal announcement={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}

function NoticeModal({ announcement, onClose }: { announcement: Announcement; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-5">
      <section className="max-h-[78vh] w-full max-w-[390px] overflow-y-auto rounded-[24px] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">{announcement.title}</h2>
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
