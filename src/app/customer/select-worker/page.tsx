"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { WorkerCard } from "@/components/WorkerCard";
import { useCustomerSession } from "@/lib/hooks";
import { getSystemSettings, getWorkers } from "@/lib/store";

export default function SelectWorkerPage() {
  return (
    <Suspense fallback={null}>
      <SelectWorkerContent />
    </Suspense>
  );
}

function SelectWorkerContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const { session, ready } = useCustomerSession();
  const [search, setSearch] = useState("");
  const minimumDeposit = getSystemSettings().worker.minimumDepositAmount;
  const workers = useMemo(() => getWorkers(search).filter((worker) => minimumDeposit <= 0 || (worker.depositStatus === "paid" && (worker.depositAmount ?? 0) >= minimumDeposit)), [minimumDeposit, search]);

  if (!ready) return null;

  return (
    <main className="page-shell">
      <AppHeader session={session} />
      <section className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900">选择指定接单员</h1>
        <input className="field" placeholder="请输入接单员名称" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="space-y-3">
          {workers.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              selectableHref={
                productId
                  ? `/customer/order-confirm/${productId}?workerId=${worker.id}`
                  : `/customer/categories?workerId=${worker.id}`
              }
            />
          ))}
        </div>
      </section>
      <BottomNav />
    </main>
  );
}
