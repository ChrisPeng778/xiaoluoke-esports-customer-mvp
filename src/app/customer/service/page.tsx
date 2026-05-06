"use client";

import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { CustomerServicePanel } from "@/components/CustomerServicePanel";
import { useCustomerSession } from "@/lib/hooks";

export default function CustomerServicePage() {
  const { session, ready } = useCustomerSession();
  if (!ready) return null;
  return (
    <main className="page-shell">
      <AppHeader session={session} />
      <CustomerServicePanel />
      <BottomNav />
    </main>
  );
}
