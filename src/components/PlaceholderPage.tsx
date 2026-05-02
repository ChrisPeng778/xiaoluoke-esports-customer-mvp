"use client";

import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { useCustomerSession } from "@/lib/hooks";

export function PlaceholderPage({ title, description = "功能正在完善中，我们会在测试阶段逐步开放。" }: { title: string; description?: string }) {
  const { session, ready } = useCustomerSession();
  if (!ready) return null;

  return (
    <main className="page-shell">
      <AppHeader session={session} />
      <section className="panel p-5">
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      </section>
      <BottomNav />
    </main>
  );
}
