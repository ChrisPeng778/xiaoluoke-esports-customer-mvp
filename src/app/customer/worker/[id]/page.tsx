"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AuthPrompt } from "@/components/AuthPrompt";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { useCustomerSession } from "@/lib/hooks";
import { getWorker, workerLevelLabel } from "@/lib/store";
import { useState } from "react";

export default function WorkerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session, ready, refresh } = useCustomerSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const worker = getWorker(params.id);

  if (!ready) return null;

  if (!worker) {
    return (
      <main className="page-shell">
        <AppHeader session={session} />
        <EmptyState title="接单员不存在" description="该接单员资料暂不可查看。" />
        <BottomNav />
      </main>
    );
  }

  const goTip = () => {
    if (!session) {
      setLoginOpen(true);
      return;
    }
    router.push(`/customer/tip/${worker.id}`);
  };

  return (
    <main className="page-shell">
      <AppHeader session={session} />

      <section className="space-y-4">
        <div className="panel p-5 text-center">
          <div className="image-placeholder mx-auto h-24 w-24 rounded-full">头像</div>
          <h1 className="mt-3 text-2xl font-black text-slate-900">{worker.name}</h1>
          <p className="mt-1 text-sm font-black text-amber-700">{workerLevelLabel(worker.level)}</p>
          <p
            className={`mx-auto mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${
              worker.onlineStatus === "online" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {worker.onlineStatus === "online" ? "可接单" : "离线"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold text-slate-600">
            <div className="rounded-[14px] bg-amber-50 p-3">已完成 {worker.completedOrderCount}</div>
            <div className="rounded-[14px] bg-blue-50 p-3">{worker.ratingAvg ? `评分 ${worker.ratingAvg.toFixed(1)} · ` : ""}好评率 {worker.rating}%</div>
          </div>
        </div>

        <Info title="Ta 的介绍" text={worker.intro} />

        <div className="grid grid-cols-3 gap-3">
          <Link href={`/customer/report?type=feedback`} className="secondary-button">
            举报
          </Link>
          <button className="secondary-button" onClick={goTip}>
            打赏
          </button>
          <Link href={`/customer/categories?workerId=${worker.id}`} className="primary-button">
            点单
          </Link>
        </div>
      </section>

      <AuthPrompt open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={refresh} title="打赏前需要微信登录" />
      <BottomNav />
    </main>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="panel p-4">
      <h2 className="text-lg font-black text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
