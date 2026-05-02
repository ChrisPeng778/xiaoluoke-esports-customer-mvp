"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AuthPrompt } from "@/components/AuthPrompt";
import { BottomNav } from "@/components/BottomNav";
import { Notice } from "@/components/Notice";
import { useCustomerSession } from "@/lib/hooks";
import { formatCurrency, formatRock, rechargeCurrentCustomer, validateRechargeAmount } from "@/lib/store";

export default function RechargePage() {
  const { session, ready, refresh } = useCustomerSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const [amountText, setAmountText] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const preview = useMemo(() => {
    const result = validateRechargeAmount(amountText);
    return result.ok ? formatCurrency(result.amount) : formatCurrency(0);
  }, [amountText]);

  if (!ready) return null;

  const submitRecharge = () => {
    setMessage("");
    setSuccess("");
    if (!session) {
      setLoginOpen(true);
      return;
    }
    const result = validateRechargeAmount(amountText);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    const order = rechargeCurrentCustomer(result.amount);
    refresh();
    setAmountText("");
    setSuccess(`模拟充值成功，充值单号 ${order.rechargeNo}`);
  };

  return (
    <main className="page-shell">
      <AppHeader session={session} />

      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">充值洛克贝</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">兑换比例：1 RMB = 1 洛克贝。本阶段做 mock 充值。</p>
        </div>

        <div className="panel p-4">
          <p className="text-sm font-bold text-slate-500">当前洛克贝余额</p>
          <p className="mt-2 text-4xl font-black text-orange-500">{formatRock(session?.wallet.availableBalance ?? 0)}</p>
        </div>

        <div className="panel space-y-4 p-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">请输入充值洛克贝数量</span>
            <input className="field" inputMode="decimal" value={amountText} onChange={(event) => setAmountText(event.target.value)} placeholder="例如：10" />
          </label>
          <div className="rounded-[14px] bg-amber-50 px-3 py-3">
            <p className="text-sm font-bold text-slate-500">需支付</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{preview}</p>
          </div>
          {message ? <p className="rounded-[14px] bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600">{message}</p> : null}
          {success ? <p className="rounded-[14px] bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{success}</p> : null}
          <button className="primary-button w-full" onClick={submitRecharge}>模拟充值</button>
        </div>

        <Notice>洛克贝为平台内部服务积分，仅用于小洛克电竞平台订单和结算记录。</Notice>
      </section>

      <AuthPrompt open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={refresh} title="充值前需要微信登录" />
      <BottomNav />
    </main>
  );
}
