"use client";

import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { useCustomerSession } from "@/lib/hooks";
import { getSystemSettings } from "@/lib/store";

export default function CustomerPrivacyPage() {
  const { session, ready } = useCustomerSession();
  if (!ready) return null;
  const agreement = getSystemSettings().agreements;
  return (
    <main className="page-shell">
      <AppHeader session={session} />
      <section className="panel p-5">
        <h1 className="text-2xl font-black text-slate-900">{agreement.privacyAgreementTitle}</h1>
        <p className="mt-4 whitespace-pre-wrap text-sm font-bold leading-7 text-slate-600">{agreement.privacyAgreementContent}</p>
      </section>
      <BottomNav />
    </main>
  );
}
