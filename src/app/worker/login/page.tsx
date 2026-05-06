"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkerHeader } from "@/components/WorkerHeader";
import { getWorkers, workerLevelLabel } from "@/lib/store";
import { useWorkerSession } from "@/lib/hooks";
import type { Worker } from "@/lib/types";

export default function WorkerLoginPage() {
  const router = useRouter();
  const { login } = useWorkerSession();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setWorkers(getWorkers());
    setReady(true);
  }, []);

  const enter = (workerId: string) => {
    login(workerId);
    router.replace("/worker/home");
  };

  return (
    <main className="page-shell">
      <WorkerHeader />

      <section className="space-y-4">
        <div className="rounded-[26px] bg-gradient-to-br from-slate-900 via-stone-800 to-amber-700 p-5 text-white shadow-soft">
          <p className="text-xs font-black text-rock-gold">Mock Worker Login</p>
          <h1 className="mt-2 text-3xl font-black">接单员登录</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-white/75">
            当前阶段使用 mock 接单员身份，后续再接真实接单员注册、审核和登录。
          </p>
        </div>

        <div className="space-y-3">
          {!ready ? (
            <div className="panel p-4 text-center text-sm font-bold text-stone-500">正在读取接单员测试账号...</div>
          ) : null}

          {workers.map((worker) => (
            <button key={worker.id} className="panel flex w-full items-center gap-3 p-4 text-left" onClick={() => enter(worker.id)}>
              <div className="image-placeholder h-14 w-14 shrink-0 rounded-full">头像</div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black text-slate-900">{worker.name}</h2>
                <p className="mt-1 text-xs font-black text-amber-700">{workerLevelLabel(worker.level)}</p>
                <p className="mt-1 text-xs font-bold text-stone-500">
                  {worker.onlineStatus === "online" ? "可接单" : "离线"} · 已完成 {worker.completedOrderCount} 单
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
