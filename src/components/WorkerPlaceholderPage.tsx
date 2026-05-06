"use client";

import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { WorkerBottomNav } from "@/components/WorkerBottomNav";
import { WorkerHeader } from "@/components/WorkerHeader";
import { useWorkerSession } from "@/lib/hooks";

export function WorkerPlaceholderPage({
  title,
  description = "功能正在完善中，我们会在测试阶段逐步开放。",
}: {
  title: string;
  description?: string;
}) {
  const { session, ready } = useWorkerSession();
  if (!ready) return null;

  if (!session) {
    return (
      <main className="page-shell">
        <WorkerHeader />
        <EmptyState title="请先登录接单员端" description="登录后可以查看该功能。" />
        <Link href="/worker/login" className="primary-button mt-4 w-full">进入接单员登录</Link>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <WorkerHeader session={session} />
      <section className="panel p-5">
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
        <p className="mt-3 text-sm font-bold leading-6 text-stone-500">{description}</p>
      </section>
      <WorkerBottomNav />
    </main>
  );
}
