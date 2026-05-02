"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AuthPrompt } from "@/components/AuthPrompt";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { useCustomerSession } from "@/lib/hooks";
import {
  createTipOrder,
  formatCurrency,
  formatRock,
  getWorker,
  validateTipAmount,
  workerLevelLabel,
} from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";

const quickAmounts = [1, 5, 10, 20];

export default function TipPage() {
  const params = useParams<{ workerId: string }>();
  const router = useRouter();
  const { session, ready, refresh } = useCustomerSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const [amountText, setAmountText] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("locke_coin");
  const [remark, setRemark] = useState("");
  const [message, setMessage] = useState("");
  const worker = getWorker(params.workerId);
  const preview = validateTipAmount(amountText);

  if (!ready) return null;

  if (!worker) {
    return (
      <main className="page-shell">
        <AppHeader session={session} />
        <EmptyState title="接单员不存在" description="暂时无法打赏。" />
        <BottomNav />
      </main>
    );
  }

  const submit = () => {
    setMessage("");
    if (!session) {
      setLoginOpen(true);
      return;
    }
    const valid = validateTipAmount(amountText);
    if (!valid.ok) {
      setMessage(valid.message);
      return;
    }
    const result = createTipOrder({ workerId: worker.id, amount: valid.amount, paymentMethod, remark });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    refresh();
    router.replace(`/customer/order/${result.order.id}`);
  };

  return (
    <main className="page-shell">
      <AppHeader session={session} />

      <section className="space-y-4">
        <div className="panel p-5 text-center">
          <div className="image-placeholder mx-auto h-20 w-20 rounded-full">头像</div>
          <h1 className="mt-3 text-2xl font-black text-slate-900">{worker.name}</h1>
          <p className="mt-1 text-sm font-black text-amber-700">{workerLevelLabel(worker.level)}</p>
        </div>

        <div className="panel space-y-3 p-4">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700">输入打赏金额</span>
            <input className="field" inputMode="decimal" value={amountText} onChange={(e) => setAmountText(e.target.value)} />
          </label>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((amount) => (
              <button key={amount} className="secondary-button min-h-10 px-2" onClick={() => setAmountText(String(amount))}>
                ¥{amount}
              </button>
            ))}
          </div>
          <textarea
            className="min-h-24 w-full rounded-[12px] border border-slate-200 px-3 py-3 text-sm outline-none"
            placeholder="想对接单员说的话"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>

        <div className="panel space-y-3 p-4">
          <h2 className="text-lg font-black text-slate-900">支付方式</h2>
          <Pay label={`微信支付：${preview.ok ? formatCurrency(preview.amount) : "¥0.00"}`} active={paymentMethod === "wechat"} onClick={() => setPaymentMethod("wechat")} />
          <Pay label={`支付宝支付：${preview.ok ? formatCurrency(preview.amount) : "¥0.00"}`} active={paymentMethod === "alipay"} onClick={() => setPaymentMethod("alipay")} />
          <Pay label={`洛克贝支付：${preview.ok ? formatRock(preview.amount) : "0"} 洛克贝`} active={paymentMethod === "locke_coin"} onClick={() => setPaymentMethod("locke_coin")} />
        </div>

        {message ? <p className="rounded-[14px] bg-rose-50 px-4 py-3 text-sm font-black text-rose-600">{message}</p> : null}

        <button className="primary-button w-full" onClick={submit}>
          确认打赏
        </button>
      </section>

      <AuthPrompt open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={refresh} title="打赏前需要微信登录" />
      <BottomNav />
    </main>
  );
}

function Pay({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`h-11 rounded-[14px] px-4 text-left text-sm font-black ${active ? "bg-rock-gold" : "bg-slate-50 text-slate-600"}`} onClick={onClick}>
      {label}
    </button>
  );
}
