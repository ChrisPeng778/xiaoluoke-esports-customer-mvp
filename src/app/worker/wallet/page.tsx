"use client";

import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { WorkerBottomNav } from "@/components/WorkerBottomNav";
import { WorkerHeader } from "@/components/WorkerHeader";
import { useWorkerSession } from "@/lib/hooks";
import { formatRock, readStore } from "@/lib/store";

export default function WorkerWalletPage() {
  const { session, ready } = useWorkerSession();

  if (!ready) return null;

  if (!session) {
    return (
      <main className="page-shell">
        <WorkerHeader />
        <EmptyState title="请先登录接单员端" description="登录后可以查看收益和钱包流水。" />
        <Link href="/worker/login" className="primary-button mt-4 w-full">进入接单员登录</Link>
      </main>
    );
  }

  const store = readStore();
  const ledgers = store.wallet_ledger.filter((item) => item.userId === session.worker.id).slice(0, 20);

  return (
    <main className="page-shell">
      <WorkerHeader session={session} />

      <section className="space-y-4">
        <div className="rounded-[26px] bg-slate-950 p-5 text-white shadow-soft">
          <p className="text-xs font-black text-rock-gold">接单员钱包</p>
          <h1 className="mt-2 text-3xl font-black">{formatRock(session.wallet.availableBalance)} 洛克贝</h1>
          <p className="mt-2 text-sm font-bold text-white/65">当前为 mock 钱包，真实版本会接提取申请和管理员审批。</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="累计获得" value={formatRock(session.worker.totalEarned)} />
            <Metric label="服务收入" value={formatRock(session.worker.serviceIncome)} />
            <Metric label="打赏收入" value={formatRock(session.worker.tipIncome)} />
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="text-lg font-black text-slate-900">提取申请</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-stone-500">
            提取功能正在完善中。后续接单员提交洛克贝提取申请，管理员审批后线下处理。
          </p>
        </div>

        <div className="panel p-4">
          <h2 className="text-lg font-black text-slate-900">收益流水</h2>
          <div className="mt-3 space-y-3">
            {ledgers.length ? (
              ledgers.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between border-b border-stone-100 pb-3 last:border-none last:pb-0">
                  <div>
                    <p className="text-sm font-black text-slate-900">{entry.description}</p>
                    <p className="mt-1 text-xs font-bold text-stone-400">{new Date(entry.createdAt).toLocaleString("zh-CN")}</p>
                  </div>
                  <p className="text-sm font-black text-orange-500">+{formatRock(entry.amount)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm font-bold text-stone-500">暂无收益流水。</p>
            )}
          </div>
        </div>
      </section>

      <WorkerBottomNav />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-white/10 p-3">
      <p className="text-[10px] font-bold text-white/60">{label}</p>
      <p className="mt-1 text-sm font-black text-rock-gold">{value}</p>
    </div>
  );
}
