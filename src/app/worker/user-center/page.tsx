"use client";

import { CustomerServicePanel } from "@/components/CustomerServicePanel";
import { WorkerBottomNav } from "@/components/WorkerBottomNav";
import { WorkerHeader } from "@/components/WorkerHeader";
import { useWorkerSession } from "@/lib/hooks";

export default function WorkerUserCenterPage() {
  const { session, ready } = useWorkerSession();
  if (!ready) return null;
  return (
    <main className="page-shell">
      <WorkerHeader session={session} />
      <CustomerServicePanel audience="worker" />
      <WorkerBottomNav />
    </main>
  );
}
