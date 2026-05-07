"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import { adminAdjustUserBalance, adminAdjustUserTotalSpent, formatRock, formatTime, hasAnyPermission, hasPermission, money, readStore } from "@/lib/store";
import { statusText } from "@/lib/status";
import type { StoreShape } from "@/lib/types";

type AdjustmentMode = "increase" | "decrease" | "set";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [balanceMode, setBalanceMode] = useState<AdjustmentMode>("increase");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceRemark, setBalanceRemark] = useState("");
  const [consumptionDialogOpen, setConsumptionDialogOpen] = useState(false);
  const [consumptionMode, setConsumptionMode] = useState<AdjustmentMode>("increase");
  const [consumptionAmount, setConsumptionAmount] = useState("");
  const [consumptionRemark, setConsumptionRemark] = useState("");
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => setStore(readStore()), []);
  useStoreSync(refresh, true, 2000);

  const user = store.users.find((item) => item.id === params.id);
  const wallet = store.wallet_accounts.find((item) => item.userId === params.id);
  const orders = store.orders.filter((order) => order.customerId === params.id);
  const recharges = store.recharge_orders.filter((order) => order.userId === params.id);
  const ledger = store.wallet_ledger.filter((entry) => entry.userId === params.id);
  const canAdjustBalance = hasAnyPermission(["users.adjust_balance", "finance.wallet.adjust"]);
  const canAdjustConsumption = hasPermission("users.edit");

  const normalizeAmount = (raw: string) => {
    const value = raw.trim();
    if (!value) throw new Error("请填写金额");
    if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("请输入合法金额，最多 2 位小数");
    return money(Number(value));
  };

  const resetBalanceForm = () => {
    setBalanceMode("increase");
    setBalanceAmount("");
    setBalanceRemark("");
  };

  const resetConsumptionForm = () => {
    setConsumptionMode("increase");
    setConsumptionAmount("");
    setConsumptionRemark("");
  };

  const adjustBalance = () => {
    setMessage("");
    try {
      const amount = normalizeAmount(balanceAmount);
      adminAdjustUserBalance({ userId: params.id, mode: balanceMode, amount, remark: balanceRemark });
      resetBalanceForm();
      setBalanceDialogOpen(false);
      refresh();
      setMessage("用户余额调整成功");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "调整失败");
    }
  };

  const adjustConsumption = () => {
    setMessage("");
    try {
      const amount = normalizeAmount(consumptionAmount);
      adminAdjustUserTotalSpent({ userId: params.id, mode: consumptionMode, amount, remark: consumptionRemark });
      resetConsumptionForm();
      setConsumptionDialogOpen(false);
      refresh();
      setMessage("累计消费调整成功");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "调整失败");
    }
  };

  return (
    <AdminLayout title="用户详情">
      {!user ? (
        <AdminCard className="p-8 text-center font-bold text-slate-400">用户不存在</AdminCard>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <AdminCard className="p-5">
              <h2 className="text-xl font-black">{user.nickname}</h2>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <Info label="用户 ID" value={user.displayId} />
                <Info label="会员等级" value={user.memberLevel} />
                <Info label="冻结洛克贝" value={formatRock(wallet?.frozenBalance ?? 0)} />
                <Info label="注册时间" value={formatTime(user.createdAt)} />
              </div>
            </AdminCard>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminCard className="p-5">
                <p className="text-sm font-bold text-slate-400">当前余额</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{formatRock(wallet?.availableBalance ?? 0)} 洛克贝</p>
                <button
                  className={`mt-4 rounded-xl px-4 py-2 text-sm font-black ${canAdjustBalance ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}
                  disabled={!canAdjustBalance}
                  title={canAdjustBalance ? undefined : "无权限操作"}
                  onClick={() => setBalanceDialogOpen(true)}
                >
                  调整余额
                </button>
              </AdminCard>
              <AdminCard className="p-5">
                <p className="text-sm font-bold text-slate-400">当前累计消费</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{formatRock(wallet?.totalSpent ?? 0)} 洛克贝</p>
                <p className="mt-1 text-sm font-bold text-slate-500">会员等级：{wallet?.memberLevel ?? user.memberLevel}</p>
                <button
                  className={`mt-4 rounded-xl px-4 py-2 text-sm font-black ${canAdjustConsumption ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}
                  disabled={!canAdjustConsumption}
                  title={canAdjustConsumption ? undefined : "无权限操作"}
                  onClick={() => setConsumptionDialogOpen(true)}
                >
                  调整累计消费
                </button>
              </AdminCard>
            </div>

            <AdminCard className="p-5">
              <h3 className="text-lg font-black">订单记录</h3>
              <div className="mt-3 space-y-2">
                {orders.map((order) => (
                  <Link key={order.id} href={`/admin/order/${order.id}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-black">{order.productName ?? "打赏订单"}</p>
                      <p className="text-xs font-bold text-slate-400">{order.orderNo}</p>
                    </div>
                    <AdminBadge>{statusText[order.status]}</AdminBadge>
                  </Link>
                ))}
                {!orders.length ? <p className="text-sm font-bold text-slate-400">暂无订单</p> : null}
              </div>
            </AdminCard>
          </div>

          <div className="space-y-4">
            {message ? <AdminCard className="p-4 text-sm font-black text-blue-600">{message}</AdminCard> : null}
            <AdminCard className="p-5">
              <h3 className="text-lg font-black">充值记录</h3>
              <p className="mt-2 text-sm font-bold text-slate-500">共 {recharges.length} 条</p>
            </AdminCard>
            <AdminCard className="p-5">
              <h3 className="text-lg font-black">钱包流水</h3>
              <div className="mt-3 space-y-2">
                {ledger.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-black">{entry.description}</p>
                    <p className="text-xs text-slate-400">{formatTime(entry.createdAt)} · {entry.direction} {formatRock(entry.amount)}</p>
                  </div>
                ))}
              </div>
            </AdminCard>
          </div>
        </section>
      )}
      {balanceDialogOpen ? (
        <AdjustDialog
          title="调整用户余额"
          amount={balanceAmount}
          remark={balanceRemark}
          mode={balanceMode}
          remarkRequired
          remarkPlaceholder="请输入调整原因，例如：人工补偿、测试充值、异常扣款修正"
          modeOptions={[
            ["increase", "增加余额"],
            ["decrease", "扣减余额"],
            ["set", "直接设置余额"],
          ]}
          onAmountChange={setBalanceAmount}
          onRemarkChange={setBalanceRemark}
          onModeChange={setBalanceMode}
          onClose={() => setBalanceDialogOpen(false)}
          onConfirm={adjustBalance}
        />
      ) : null}
      {consumptionDialogOpen ? (
        <AdjustDialog
          title="调整累计消费"
          amount={consumptionAmount}
          remark={consumptionRemark}
          mode={consumptionMode}
          remarkPlaceholder="请输入备注"
          modeOptions={[
            ["increase", "增加累计消费"],
            ["decrease", "扣减累计消费"],
            ["set", "直接设置累计消费"],
          ]}
          onAmountChange={setConsumptionAmount}
          onRemarkChange={setConsumptionRemark}
          onModeChange={setConsumptionMode}
          onClose={() => setConsumptionDialogOpen(false)}
          onConfirm={adjustConsumption}
        />
      ) : null}
    </AdminLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-800">{value}</p>
    </div>
  );
}

function AdjustDialog({
  title,
  mode,
  amount,
  remark,
  remarkRequired = false,
  remarkPlaceholder,
  modeOptions,
  onModeChange,
  onAmountChange,
  onRemarkChange,
  onClose,
  onConfirm,
}: {
  title: string;
  mode: AdjustmentMode;
  amount: string;
  remark: string;
  remarkRequired?: boolean;
  remarkPlaceholder: string;
  modeOptions: Array<[AdjustmentMode, string]>;
  onModeChange: (mode: AdjustmentMode) => void;
  onAmountChange: (amount: string) => void;
  onRemarkChange: (remark: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <button className="rounded-xl border border-slate-200 px-3 py-1 text-sm font-black text-slate-500" onClick={onClose}>关闭</button>
        </div>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-black text-slate-700">
            操作类型
            <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold" value={mode} onChange={(event) => onModeChange(event.target.value as AdjustmentMode)}>
              {modeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black text-slate-700">
            金额
            <input
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
              placeholder="0.00"
              inputMode="decimal"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              onBlur={() => {
                const value = amount.trim();
                if (/^\d+(\.\d{1,2})?$/.test(value)) onAmountChange(money(Number(value)).toFixed(2));
              }}
            />
          </label>
          <label className="grid gap-2 text-sm font-black text-slate-700">
            备注{remarkRequired ? "" : "（可选）"}
            <textarea
              className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              maxLength={200}
              placeholder={remarkPlaceholder}
              value={remark}
              onChange={(event) => onRemarkChange(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600" onClick={onClose}>取消</button>
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white" onClick={onConfirm}>确认</button>
        </div>
      </div>
    </div>
  );
}
