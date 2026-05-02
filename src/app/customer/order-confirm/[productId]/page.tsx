"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AuthPrompt } from "@/components/AuthPrompt";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { SafeImage } from "@/components/SafeImage";
import { useCustomerSession } from "@/lib/hooks";
import {
  createServiceOrder,
  formatCurrency,
  formatRock,
  getProduct,
  getWorker,
} from "@/lib/store";
import type { AssignmentType, PaymentMethod } from "@/lib/types";

export default function OrderConfirmPage() {
  return (
    <Suspense fallback={null}>
      <OrderConfirmContent />
    </Suspense>
  );
}

function OrderConfirmContent() {
  const params = useParams<{ productId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session, ready, refresh } = useCustomerSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const [gameNickname, setGameNickname] = useState("");
  const [gameId, setGameId] = useState("");
  const [quantityText, setQuantityText] = useState("1");
  const [remark, setRemark] = useState("");
  const [assignmentType, setAssignmentType] = useState<AssignmentType>(searchParams.get("workerId") ? "specified" : "random");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("locke_coin");
  const [agreed, setAgreed] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [message, setMessage] = useState("");

  const product = getProduct(params.productId);
  const selectedWorker = searchParams.get("workerId") ? getWorker(searchParams.get("workerId")!) : null;
  const quantity = Math.max(1, Number(quantityText) || 1);
  const total = useMemo(
    () => ({
      rmb: product ? product.priceRmb * quantity : 0,
      locke: product ? product.priceLockeCoin * quantity : 0,
    }),
    [product, quantity],
  );

  if (!ready) return null;

  if (!product) {
    return (
      <main className="page-shell">
        <AppHeader session={session} />
        <EmptyState title="商品不存在" description="商品可能已下架。" />
        <BottomNav />
      </main>
    );
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (!session) {
      setLoginOpen(true);
      return;
    }
    if (!agreed) {
      setMessage("请先阅读并同意《下单协议》");
      return;
    }

    const result = createServiceOrder({
      productId: product.id,
      gameNickname,
      gameId,
      quantity,
      remark,
      assignmentType,
      specifiedWorkerId: assignmentType === "specified" ? selectedWorker?.id ?? null : null,
      paymentMethod,
    });

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

      <form onSubmit={submit} className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900">确认下单</h1>

        <div className="panel p-4">
          <div className="flex gap-3">
            <SafeImage
              src={product.imageUrl}
              alt={product.name}
              className="h-20 w-20 shrink-0 rounded-[16px]"
              imgClassName="object-contain scale-[0.9]"
              fallbackText="商品图"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-slate-900">{product.name}</h2>
              <p className="mt-1 text-sm font-bold text-orange-500">单价 {formatCurrency(product.priceRmb)}</p>
              <p className="mt-1 text-xs text-slate-500">数量 {quantity}，商品金额 {formatCurrency(total.rmb)}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">洛克贝金额 {formatRock(total.locke)} 洛克贝</p>
            </div>
          </div>
        </div>

        <div className="panel space-y-3 p-4">
          <h2 className="text-lg font-black text-slate-900">下单信息</h2>
          <input className="field" placeholder="游戏昵称" value={gameNickname} onChange={(e) => setGameNickname(e.target.value)} />
          <input className="field" placeholder="ID 编号" value={gameId} onChange={(e) => setGameId(e.target.value)} />
          <input
            className="field"
            inputMode="numeric"
            placeholder="下单数量"
            value={quantityText}
            onChange={(e) => setQuantityText(e.target.value.replace(/[^\d]/g, "") || "1")}
          />
          <textarea
            className="min-h-24 w-full rounded-[12px] border border-slate-200 px-3 py-3 text-sm outline-none focus:border-rock-gold focus:ring-4 focus:ring-rock-gold/20"
            placeholder="下单备注"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`h-11 rounded-full text-sm font-black ${assignmentType === "random" ? "bg-rock-gold" : "bg-slate-100 text-slate-500"}`}
              onClick={() => setAssignmentType("random")}
            >
              随机安排
            </button>
            <Link href={`/customer/select-worker?productId=${product.id}`} className={`grid h-11 place-items-center rounded-full text-sm font-black ${assignmentType === "specified" ? "bg-rock-gold" : "bg-slate-100 text-slate-500"}`}>
              指定接单员
            </Link>
          </div>
          {assignmentType === "specified" ? (
            <p className="rounded-[12px] bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
              {selectedWorker ? `已指定：${selectedWorker.name}` : "请选择接单员"}
            </p>
          ) : null}
        </div>

        <div className="panel p-4">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            我已阅读并同意
            <button type="button" className="font-black text-amber-700" onClick={() => setAgreementOpen(true)}>
              《下单协议》
            </button>
          </label>
        </div>

        <div className="panel space-y-3 p-4">
          <h2 className="text-lg font-black text-slate-900">支付方式</h2>
          <PayButton label={`微信支付：${formatCurrency(total.rmb)}`} active={paymentMethod === "wechat"} onClick={() => setPaymentMethod("wechat")} />
          <PayButton label={`支付宝支付：${formatCurrency(total.rmb)}`} active={paymentMethod === "alipay"} onClick={() => setPaymentMethod("alipay")} />
          <PayButton label={`洛克贝支付：${formatRock(total.locke)} 洛克贝`} active={paymentMethod === "locke_coin"} onClick={() => setPaymentMethod("locke_coin")} />
        </div>

        <div className="panel flex items-center justify-between p-4">
          <span className="text-sm font-bold text-slate-500">合计金额</span>
          <span className="text-right text-sm font-black text-slate-700">
            <span className="block text-xl text-orange-500">{formatCurrency(total.rmb)}</span>
            <span>{formatRock(total.locke)} 洛克贝</span>
          </span>
        </div>

        {message ? <p className="rounded-[14px] bg-rose-50 px-4 py-3 text-sm font-black text-rose-600">{message}</p> : null}

        <button className="primary-button w-full" type="submit">
          立即下单
        </button>
      </form>

      {agreementOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/35 px-4 pb-4">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-[20px] bg-white p-5">
            <h2 className="text-xl font-black text-slate-900">下单协议</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{agreementText}</p>
            <button className="primary-button mt-5 w-full" onClick={() => setAgreementOpen(false)}>
              我知道了
            </button>
          </div>
        </div>
      ) : null}

      <AuthPrompt open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={refresh} title="提交订单前需要微信登录" />
      <BottomNav />
    </main>
  );
}

function PayButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 w-full rounded-[14px] text-left px-4 text-sm font-black ${
        active ? "bg-rock-gold text-slate-900" : "bg-slate-50 text-slate-600"
      }`}
    >
      {label}
    </button>
  );
}

const agreementText =
  "本平台提供人工协助类服务，下单后请确认自己填写的游戏昵称、ID 编号等信息准确无误。\n\n下单后订单会进入待接单状态，请耐心等待接单员接单。接单员接单后，您可以在订单详情中与接单员沟通服务细节。\n\n如订单长时间无人接单，您可以联系客服或等待系统处理。若服务未完成或存在疑问，请在订单页面提交“有疑问”，平台管理员会根据订单记录进行处理。\n\n请勿恶意辱骂、催促或骚扰接单员。平台禁止外挂、脚本、BUG、盗号、违规刷取资源等行为。";
