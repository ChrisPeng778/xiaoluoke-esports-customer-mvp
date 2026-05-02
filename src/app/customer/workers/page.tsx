"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { WorkerCard } from "@/components/WorkerCard";
import { useCustomerSession } from "@/lib/hooks";
import { getWorkers } from "@/lib/store";

export default function WorkersPage() {
  const { session, ready } = useCustomerSession();
  const [search, setSearch] = useState("");
  const workers = useMemo(() => getWorkers(search), [search]);

  if (!ready) return null;

  return (
    <main className="page-shell">
      <AppHeader session={session} />

      <section className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900">接单员列表</h1>
        <input
          className="field"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="请输入接单员名称"
        />
        <div className="space-y-3">
          {workers.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
