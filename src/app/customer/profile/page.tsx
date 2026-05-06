"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AuthPrompt } from "@/components/AuthPrompt";
import { BottomNav } from "@/components/BottomNav";
import { useCustomerSession } from "@/lib/hooks";
import { formatRock, getSystemSettings, logout, nextLevelGap, updateCurrentNickname, updateCurrentUserAvatar } from "@/lib/store";
import type { ChangeEvent } from "react";

const orderEntries = [
  ["待付款", "/customer/orders?tab=unpaid"],
  ["待接单", "/customer/orders?tab=pending"],
  ["服务中", "/customer/orders?tab=accepted"],
  ["待结单", "/customer/orders?tab=worker_completed"],
  ["已完成", "/customer/orders?tab=settled"],
  ["有疑问", "/customer/orders?tab=disputed"],
  ["退款/售后", "/customer/after-sale"],
];

const featureEntries = [
  ["消息中心", "/customer/messages"],
  ["退款/售后", "/customer/after-sale"],
  ["接单员申请", "/customer/worker-apply"],
  ["在线客服", "/customer/service"],
  ["举报投诉", "/customer/report"],
  ["公告通知", "/customer/notice"],
  ["用户协议", "/customer/agreement"],
  ["隐私协议", "/customer/privacy"],
];

export default function ProfilePage() {
  const router = useRouter();
  const { session, ready, refresh } = useCustomerSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const settings = getSystemSettings();

  if (!ready) return null;

  if (!session) {
    return (
      <main className="page-shell">
        <AppHeader />
        <section className="panel p-5 text-center">
          <div className="image-placeholder mx-auto h-20 w-20 rounded-full">头像</div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">我的</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">查看余额、订单、会员等级前需要微信登录。</p>
          <button className="primary-button mt-5 w-full" onClick={() => setLoginOpen(true)}>微信一键登录</button>
        </section>
        <AuthPrompt open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={refresh} />
        <BottomNav />
      </main>
    );
  }

  const gap = nextLevelGap(session.wallet.totalSpent);
  const progress = Math.min(100, Math.round(gap.progress * 100));
  const visibleFeatureEntries = settings.basic.miniProgramReviewMode
    ? featureEntries.filter(([label]) => !["在线客服", "举报投诉"].includes(label))
    : featureEntries;

  const exit = () => {
    logout();
    refresh();
    router.replace("/customer/home");
  };

  const saveNickname = () => {
    try {
      updateCurrentNickname(nickname);
      refresh();
      setEditing(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "保存失败");
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
        updateCurrentUserAvatar(String(reader.result));
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
      <AppHeader session={session} />

      <section className="space-y-4">
        <div className="rounded-[26px] bg-gradient-to-br from-amber-300 via-yellow-100 to-white p-5 shadow-[0_18px_45px_rgba(245,158,11,0.18)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-white/80 text-xs font-black text-amber-700 shadow-sm ring-2 ring-white/70"
              onClick={() => avatarInputRef.current?.click()}
              aria-label="更换头像"
            >
              {session.user.avatarUrl ? (
                <img src={session.user.avatarUrl} alt="用户头像" className="h-full w-full object-cover" />
              ) : (
                <span>头像</span>
              )}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={changeAvatar} />
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="flex gap-2">
                  <input className="field h-10" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                  <button className="primary-button min-h-10 px-3" onClick={saveNickname}>保存</button>
                </div>
              ) : (
                <button
                  className="text-left"
                  onClick={() => {
                    setNickname(session.user.nickname);
                    setEditing(true);
                  }}
                >
                  <h1 className="truncate text-2xl font-black text-slate-900">{session.user.nickname}</h1>
                  <p className="mt-1 text-sm font-bold text-slate-600">ID：{session.user.displayId}</p>
                  {avatarMessage ? <p className="mt-1 text-xs font-black text-amber-700">{avatarMessage}</p> : null}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="panel border border-amber-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500">当前会员等级</p>
              <p className="mt-1 text-xl font-black text-amber-700">{session.wallet.memberLevel}</p>
            </div>
            <p className="text-right text-sm font-bold text-slate-500">
              累计消费<br />
              <span className="text-lg font-black text-slate-900">{formatRock(session.wallet.totalSpent)}</span>
            </p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-amber-50">
            <div className="h-full rounded-full bg-rock-gold" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs font-bold text-slate-500">
            {gap.gap > 0 ? `距离 ${gap.next} 还差 ${formatRock(gap.gap)} 洛克贝` : "已达最高等级"}
          </p>
        </div>

        <div className="rounded-[24px] bg-slate-950 p-4 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <h2 className="text-lg font-black">洛克贝余额</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Metric label="可用洛克贝" value={formatRock(session.wallet.availableBalance)} tone="dark" />
            <Metric label="冻结洛克贝" value={formatRock(session.wallet.frozenBalance)} tone="dark" />
          </div>
          <button className="primary-button mt-3 w-full" onClick={() => router.push("/customer/recharge")}>充值</button>
        </div>

        <div className="panel p-4">
          <button className="flex w-full items-center justify-between text-left" onClick={() => router.push("/customer/orders")}>
            <h2 className="text-lg font-black text-slate-900">我的订单</h2>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">全部订单</span>
          </button>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {orderEntries.map(([label, href]) => (
              <button
                key={label}
                className="rounded-[16px] border border-amber-200 bg-amber-100 px-2 py-3 text-xs font-black text-slate-900 shadow-[0_6px_14px_rgba(180,120,20,0.10)] transition active:scale-[0.98]"
                onClick={() => router.push(href)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="text-lg font-black text-slate-900">常用功能</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {visibleFeatureEntries.map(([label, href]) => (
              <button key={label} className="secondary-button min-h-10" onClick={() => router.push(href)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <button className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-black text-white" onClick={exit}>退出登录</button>
      </section>

      <BottomNav />
    </main>
  );
}

function Metric({ label, value, tone = "light" }: { label: string; value: string; tone?: "light" | "dark" }) {
  return (
    <div className={tone === "dark" ? "rounded-[16px] bg-white/10 p-3" : "rounded-[14px] bg-slate-50 p-3"}>
      <p className={tone === "dark" ? "text-xs font-bold text-white/65" : "text-xs font-bold text-slate-500"}>{label}</p>
      <p className={tone === "dark" ? "mt-1 text-xl font-black text-rock-gold" : "mt-1 text-xl font-black text-slate-900"}>{value}</p>
    </div>
  );
}
