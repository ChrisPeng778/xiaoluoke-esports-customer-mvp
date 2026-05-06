"use client";

import { WorkerBottomNav } from "@/components/WorkerBottomNav";
import { WorkerHeader } from "@/components/WorkerHeader";
import { useWorkerSession } from "@/lib/hooks";
import { getSystemSettings } from "@/lib/store";

export default function WorkerPrivacyPage() {
  const { session, ready } = useWorkerSession();
  if (!ready) return null;
  const agreement = getSystemSettings().agreements;
  return (
    <main className="page-shell">
      <WorkerHeader session={session} />
      <section className="panel p-5">
        <h1 className="text-2xl font-black text-slate-900">{agreement.privacyAgreementTitle}</h1>
        <p className="mt-4 whitespace-pre-wrap text-sm font-bold leading-7 text-slate-600">{agreement.privacyAgreementContent}</p>
      </section>
      <WorkerBottomNav />
    </main>
  );
}
