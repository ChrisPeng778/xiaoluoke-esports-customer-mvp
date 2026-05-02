"use client";

import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { useCustomerSession } from "@/lib/hooks";
import { formatTime, getAnnouncements } from "@/lib/store";

export default function NoticePage() {
  const { session, ready } = useCustomerSession();
  const announcements = getAnnouncements();
  if (!ready) return null;

  return (
    <main className="page-shell">
      <AppHeader session={session} />
      <section className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900">公告通知</h1>
        {announcements.map((item) => (
          <article key={item.id} className="panel p-4">
            <h2 className="text-lg font-black text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.content}</p>
            <p className="mt-3 text-xs font-bold text-slate-400">{formatTime(item.createdAt)}</p>
          </article>
        ))}
      </section>
      <BottomNav />
    </main>
  );
}
