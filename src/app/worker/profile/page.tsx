"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { WorkerBottomNav } from "@/components/WorkerBottomNav";
import { WorkerHeader } from "@/components/WorkerHeader";
import { WorkerStatusToggle } from "@/components/WorkerStatusToggle";
import { useWorkerSession } from "@/lib/hooks";
import { formatRock, logoutWorker, setCurrentWorkerOnlineStatus, updateCurrentWorkerAvatar, updateCurrentWorkerIntro, updateCurrentWorkerName, workerLevelLabel } from "@/lib/store";
import type { ChangeEvent } from "react";
import type { WorkerStatus } from "@/lib/types";

const workerFeatureEntries = [
  ["消息中心", "/worker/messages"],
  ["用户中心", "/worker/user-center"],
  ["商务协议", "/worker/business-agreement"],
  ["隐私协议", "/worker/privacy"],
];

export default function WorkerProfilePage() {
  const router = useRouter();
  const { session, ready, refresh } = useWorkerSession();
  const [introOpen, setIntroOpen] = useState(false);
  const [introDraft, setIntroDraft] = useState("");
  const [introMessage, setIntroMessage] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!ready) return null;

  if (!session) {
    return (
      <main className="page-shell">
        <WorkerHeader />
        <EmptyState title="请先登录接单员端" description="登录后可以查看接单员资料。" />
        <Link href="/worker/login" className="primary-button mt-4 w-full">进入接单员登录</Link>
      </main>
    );
  }

  const exit = () => {
    logoutWorker();
    refresh();
    router.replace("/worker/login");
  };

  const changeStatus = (onlineStatus: WorkerStatus) => {
    setCurrentWorkerOnlineStatus(onlineStatus);
    refresh();
  };

  const openIntroEditor = () => {
    setIntroDraft(session.worker.intro);
    setIntroMessage("");
    setIntroOpen(true);
  };

  const saveIntro = () => {
    try {
      updateCurrentWorkerIntro(introDraft);
      refresh();
      setIntroOpen(false);
    } catch (error) {
      setIntroMessage(error instanceof Error ? error.message : "保存失败");
    }
  };

  const startEditName = () => {
    setWorkerName(session.worker.name);
    setEditingName(true);
  };

  const saveWorkerName = () => {
    try {
      updateCurrentWorkerName(workerName);
      refresh();
      setEditingName(false);
    } catch (error) {
      setAvatarMessage(error instanceof Error ? error.message : "名称保存失败");
    }
  };

  const changeAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setAvatarMessage("仅支持 jpg、png、webp 图片。");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMessage("头像不能超过 2MB。");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        updateCurrentWorkerAvatar(String(reader.result));
        refresh();
        setAvatarMessage("头像已更新");
      } catch (error) {
        setAvatarMessage(error instanceof Error ? error.message : "头像保存失败");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="page-shell">
      <WorkerHeader session={session} />

      <section className="space-y-4">
        <div className="rounded-[26px] bg-gradient-to-br from-slate-950 via-stone-800 to-amber-700 p-5 text-white shadow-soft">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-white/15 text-xs font-black text-rock-gold ring-2 ring-white/10"
              onClick={() => avatarInputRef.current?.click()}
              aria-label="更换头像"
            >
              {session.worker.avatarUrl ? (
                <img src={session.worker.avatarUrl} alt="接单员头像" className="h-full w-full object-cover" />
              ) : (
                <span>头像</span>
              )}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={changeAvatar} />
            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    className="h-10 min-w-0 flex-1 rounded-full bg-white px-3 text-sm font-black text-slate-900 outline-none"
                    value={workerName}
                    onChange={(event) => setWorkerName(event.target.value)}
                    maxLength={12}
                  />
                  <button className="rounded-full bg-rock-gold px-3 text-xs font-black text-slate-950" onClick={saveWorkerName}>
                    保存
                  </button>
                </div>
              ) : (
                <button type="button" className="block max-w-full text-left" onClick={startEditName}>
                  <h1 className="truncate text-2xl font-black">{session.worker.name}</h1>
                </button>
              )}
              <p className="mt-1 text-sm font-black text-rock-gold">{workerLevelLabel(session.worker.level)}</p>
              <p className="mt-1 text-xs font-bold text-white/65">
                {session.worker.onlineStatus === "online" ? "可接单" : "离线"}
              </p>
              {avatarMessage ? <p className="mt-2 text-xs font-black text-white/80">{avatarMessage}</p> : null}
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full bg-rock-gold px-4 py-2 text-xs font-black text-slate-950 shadow-soft"
              onClick={openIntroEditor}
            >
              接单员说明
            </button>
          </div>
          <div className="mt-4">
            <WorkerStatusToggle value={session.worker.onlineStatus} onChange={changeStatus} />
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="text-lg font-black text-slate-900">资料概览</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Metric label="完成订单" value={`${session.worker.completedOrderCount} 单`} />
            <Metric label="好评率" value={`${session.worker.rating}%`} />
            <Metric label="可提取洛克贝" value={formatRock(session.wallet.availableBalance)} />
            <Metric label="累计获得" value={formatRock(session.wallet.totalEarned)} />
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="text-lg font-black text-slate-900">常用功能</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {workerFeatureEntries.map(([label, href]) => (
              <button key={label} className="secondary-button min-h-10" onClick={() => router.push(href)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <button className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-black text-white" onClick={exit}>
          退出接单员登录
        </button>
      </section>

      {introOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-[390px] rounded-[26px] bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-900">接单员说明</h2>
              <button className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-500" onClick={() => setIntroOpen(false)}>
                关闭
              </button>
            </div>
            <textarea
              className="mt-4 min-h-32 w-full resize-none rounded-[18px] border border-amber-200 bg-amber-50/40 px-4 py-3 text-sm font-bold leading-6 text-slate-800 outline-none focus:border-rock-gold"
              maxLength={120}
              value={introDraft}
              onChange={(event) => setIntroDraft(event.target.value)}
              placeholder="请输入接单员说明"
            />
            <div className="mt-2 flex items-center justify-between text-xs font-bold text-stone-400">
              <span>{introMessage}</span>
              <span>{introDraft.trim().length}/120</span>
            </div>
            <button className="primary-button mt-4 w-full" onClick={saveIntro}>
              保存说明
            </button>
          </div>
        </div>
      ) : null}

      <WorkerBottomNav />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-amber-100 p-3">
      <p className="text-xs font-bold text-stone-500">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}
