"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AdminBadge, AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { useStoreSync } from "@/lib/hooks";
import {
  adminDeleteResource,
  adminUpdateSystemSettings,
  adminUpsertResource,
  formatCurrency,
  formatRock,
  getSystemSettings,
  hasPermission,
  readStore,
} from "@/lib/store";
import type {
  CustomerServiceH5Type,
  CustomerServiceMiniProgramType,
  PaymentChannelKey,
  PaymentChannelSettings,
  ResourceRecord,
  ResourceType,
  SmsProvider,
  StoreShape,
  SystemSettings,
  WithdrawMethod,
} from "@/lib/types";

export type SettingsSectionKey =
  | "basic"
  | "tip"
  | "customer-service"
  | "sms"
  | "notification"
  | "agreement"
  | "worker"
  | "payment"
  | "order"
  | "business-target"
  | "finance"
  | "resources";

const sections: Array<{ key: SettingsSectionKey; label: string; href: string; action: string }> = [
  { key: "basic", label: "基础设置", href: "/admin/settings/basic", action: "update_basic_settings" },
  { key: "tip", label: "打赏设置", href: "/admin/settings/tip", action: "update_tip_settings" },
  { key: "customer-service", label: "客服设置", href: "/admin/settings/customer-service", action: "update_customer_service_settings" },
  { key: "sms", label: "短信配置", href: "/admin/settings/sms", action: "update_sms_settings" },
  { key: "notification", label: "通知设置", href: "/admin/settings/notification", action: "update_notification_settings" },
  { key: "agreement", label: "政策协议", href: "/admin/settings/agreement", action: "update_agreement_settings" },
  { key: "worker", label: "接单员配置", href: "/admin/settings/worker", action: "update_worker_settings" },
  { key: "payment", label: "支付配置", href: "/admin/settings/payment", action: "update_payment_settings" },
  { key: "order", label: "订单设置", href: "/admin/settings/order", action: "update_order_settings" },
  { key: "business-target", label: "经营目标", href: "/admin/settings/business-target", action: "update_business_target" },
  { key: "finance", label: "财务配置", href: "/admin/settings/finance", action: "update_finance_settings" },
  { key: "resources", label: "资源管理", href: "/admin/settings/resources", action: "update_resource_settings" },
];

const sectionToStoreKey: Record<SettingsSectionKey, keyof SystemSettings> = {
  basic: "basic",
  tip: "tip",
  "customer-service": "customerService",
  sms: "sms",
  notification: "notification",
  agreement: "agreements",
  worker: "worker",
  payment: "payment",
  order: "order",
  "business-target": "businessTarget",
  finance: "finance",
  resources: "resources",
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function SettingsModule({ sectionKey }: { sectionKey: SettingsSectionKey }) {
  const safeSection = sections.some((item) => item.key === sectionKey) ? sectionKey : "basic";
  const active = sections.find((item) => item.key === safeSection)!;
  const [store, setStore] = useState<StoreShape>(() => readStore());
  const [settings, setSettings] = useState<SystemSettings>(() => getSystemSettings());
  const [message, setMessage] = useState("");
  const canEdit = hasPermission("settings.edit");
  const refresh = useCallback(() => {
    const nextStore = readStore();
    setStore(nextStore);
    setSettings(nextStore.system_settings);
  }, []);
  useStoreSync(refresh, true, 1500);

  const save = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K], detail: string) => {
    setMessage("");
    try {
      const next = adminUpdateSystemSettings(key, value, active.action, detail);
      setSettings(next);
      setMessage("设置已保存，并写入管理员日志。");
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
  };

  return (
    <AdminLayout title={active.label}>
      <section className="grid gap-4 xl:grid-cols-[240px_1fr]">
        <AdminCard className="p-3">
          <nav className="space-y-1">
            {sections.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`block rounded-xl px-4 py-3 text-sm font-black ${item.key === safeSection ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </AdminCard>
        <div className="space-y-4">
          {message ? <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{message}</p> : null}
          {!canEdit ? <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">当前账号只有 settings.view 权限，可以查看，不能保存。</p> : null}
          {safeSection === "basic" ? <BasicSettings settings={settings} canEdit={canEdit} save={save} /> : null}
          {safeSection === "tip" ? <TipSettings settings={settings} canEdit={canEdit} save={save} /> : null}
          {safeSection === "customer-service" ? <CustomerServiceSettings settings={settings} canEdit={canEdit} save={save} /> : null}
          {safeSection === "sms" ? <SmsSettings settings={settings} canEdit={canEdit} save={save} /> : null}
          {safeSection === "notification" ? <NotificationSettings settings={settings} canEdit={canEdit} save={save} /> : null}
          {safeSection === "agreement" ? <AgreementSettings settings={settings} canEdit={canEdit} save={save} /> : null}
          {safeSection === "worker" ? <WorkerSettings settings={settings} canEdit={canEdit} save={save} /> : null}
          {safeSection === "payment" ? <PaymentSettings settings={settings} canEdit={canEdit} save={save} /> : null}
          {safeSection === "order" ? <OrderSettings settings={settings} canEdit={canEdit} save={save} /> : null}
          {safeSection === "business-target" ? <BusinessTargetSettings settings={settings} canEdit={canEdit} save={save} store={store} /> : null}
          {safeSection === "finance" ? <FinanceSettings settings={settings} canEdit={canEdit} save={save} /> : null}
          {safeSection === "resources" ? <ResourcesSettings settings={settings} store={store} canEdit={canEdit} refresh={refresh} /> : null}
        </div>
      </section>
    </AdminLayout>
  );
}

function CardHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <h2 className="text-xl font-black">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block text-sm font-black text-slate-600 ${wide ? "md:col-span-2" : ""}`}>
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`h-7 w-12 rounded-full p-1 transition disabled:opacity-50 ${checked ? "bg-blue-600" : "bg-slate-300"}`}
      onClick={() => onChange(!checked)}
    >
      <span className={`block h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

function SaveButton({ canEdit, onClick }: { canEdit: boolean; onClick: () => void }) {
  if (!canEdit) return null;
  return <button className="admin-confirm" onClick={onClick}>保存配置</button>;
}

function BasicSettings({ settings, canEdit, save }: SettingsProps) {
  const [form, setForm] = useState(() => clone(settings.basic));
  return (
    <AdminCard>
      <CardHeader title="基础设置"><SaveButton canEdit={canEdit} onClick={() => save("basic", form, "更新基础设置")} /></CardHeader>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <Field label="应用名称"><input className="admin-input" value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} disabled={!canEdit} /></Field>
        <Field label="站点名称"><input className="admin-input" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} disabled={!canEdit} /></Field>
        <Field label="应用 Logo"><input className="admin-input" value={form.appLogo} onChange={(e) => setForm({ ...form, appLogo: e.target.value })} placeholder="/images/logo.png 或 URL" disabled={!canEdit} /></Field>
        <Field label="站点图标 favicon"><input className="admin-input" value={form.favicon} onChange={(e) => setForm({ ...form, favicon: e.target.value })} disabled={!canEdit} /></Field>
        <Field label="备案信息"><input className="admin-input" value={form.recordInfo} onChange={(e) => setForm({ ...form, recordInfo: e.target.value })} placeholder="粤ICP备xxxx号" disabled={!canEdit} /></Field>
        <Field label="小程序审核模式"><div className="flex items-center gap-3"><Toggle checked={form.miniProgramReviewMode} disabled={!canEdit} onChange={(checked) => setForm({ ...form, miniProgramReviewMode: checked })} /><span>{form.miniProgramReviewMode ? "开启" : "关闭"}</span></div></Field>
        <Field label="版权信息" wide><textarea className="admin-textarea min-h-24" value={form.copyright} onChange={(e) => setForm({ ...form, copyright: e.target.value })} disabled={!canEdit} /></Field>
      </div>
    </AdminCard>
  );
}

type SettingsProps = {
  settings: SystemSettings;
  canEdit: boolean;
  save: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K], detail: string) => void;
};

function TipSettings({ settings, canEdit, save }: SettingsProps) {
  const [enabled, setEnabled] = useState(settings.tip.enabled);
  const [amounts, setAmounts] = useState(settings.tip.quickAmounts.map(String));
  const normalized = () => Array.from(new Set(amounts.map(Number).filter((v) => Number.isFinite(v) && v >= 0.01 && v <= 9999.99))).sort((a, b) => a - b).slice(0, 8);
  return (
    <AdminCard>
      <CardHeader title="打赏设置"><SaveButton canEdit={canEdit} onClick={() => save("tip", { enabled, quickAmounts: normalized().length ? normalized() : [10] }, "更新打赏设置")} /></CardHeader>
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-3 text-sm font-black text-slate-700"><span>打赏功能</span><Toggle checked={enabled} disabled={!canEdit} onChange={setEnabled} /><span>{enabled ? "开启" : "关闭"}</span></div>
        <div>
          <p className="text-sm font-black text-slate-600">快捷金额</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {amounts.map((amount, index) => (
              <div key={index} className="flex items-center gap-2">
                <input className="admin-input w-28" value={amount} onChange={(e) => setAmounts(amounts.map((item, i) => i === index ? e.target.value.replace(/[^\d.]/g, "") : item))} disabled={!canEdit} />
                {canEdit ? <button className="text-sm font-black text-rose-600" onClick={() => setAmounts(amounts.filter((_, i) => i !== index))}>删除</button> : null}
              </div>
            ))}
            {canEdit && amounts.length < 8 ? <button className="admin-secondary" onClick={() => setAmounts([...amounts, ""])}>添加金额</button> : null}
          </div>
          <p className="mt-2 text-xs font-bold text-slate-400">最少 1 个、最多 8 个，保存时自动按金额升序排列。</p>
        </div>
      </div>
    </AdminCard>
  );
}

function CustomerServiceSettings({ settings, canEdit, save }: SettingsProps) {
  const [form, setForm] = useState(() => clone(settings.customerService));
  const [port, setPort] = useState<"miniProgram" | "h5">("miniProgram");
  const current = form[port];
  const setCurrent = (patch: Partial<typeof current>) => setForm({ ...form, [port]: { ...current, ...patch } });
  return (
    <AdminCard>
      <CardHeader title="客服设置"><SaveButton canEdit={canEdit} onClick={() => save("customerService", form, "更新客服设置")} /></CardHeader>
      <div className="space-y-5 p-5">
        <div className="flex gap-2 border-b border-slate-200">
          {[["miniProgram", "小程序端"], ["h5", "公众号 H5 端"]].map(([key, label]) => <button key={key} className={`pb-3 text-sm font-black ${port === key ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500"}`} onClick={() => setPort(key as typeof port)}>{label}</button>)}
        </div>
        <Field label="客服类型">
          <select className="admin-input max-w-md" value={current.type} onChange={(e) => setCurrent({ type: e.target.value as CustomerServiceMiniProgramType & CustomerServiceH5Type })} disabled={!canEdit}>
            <option value="disabled">不启用</option>
            {port === "miniProgram" ? <option value="wechat_mini_customer_service">小程序客服</option> : null}
            <option value="enterprise_wechat">企业微信客服</option>
            <option value="normal">普通客服</option>
            {port === "h5" ? <option value="official_account">公众号客服（占位）</option> : null}
          </select>
        </Field>
        <ServiceFields title="企业微信客服配置" value={current.enterpriseWechat} disabled={!canEdit} onChange={(enterpriseWechat) => setCurrent({ enterpriseWechat })} />
        <NormalServiceFields value={current.normal} disabled={!canEdit} onChange={(normal) => setCurrent({ normal })} />
        {port === "h5" ? <OfficialAccountFields value={form.h5.officialAccount} disabled={!canEdit} onChange={(officialAccount) => setForm({ ...form, h5: { ...form.h5, officialAccount } })} /> : null}
      </div>
    </AdminCard>
  );
}

function ServiceFields({ title, value, disabled, onChange }: { title: string; value: SystemSettings["customerService"]["h5"]["enterpriseWechat"]; disabled: boolean; onChange: (value: SystemSettings["customerService"]["h5"]["enterpriseWechat"]) => void }) {
  return (
    <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
      <h3 className="md:col-span-2 text-sm font-black text-slate-900">{title}</h3>
      <Field label="CorpID"><input className="admin-input" value={value.corpId} onChange={(e) => onChange({ ...value, corpId: e.target.value })} disabled={disabled} /></Field>
      <Field label="客服链接"><input className="admin-input" value={value.serviceUrl} onChange={(e) => onChange({ ...value, serviceUrl: e.target.value })} disabled={disabled} /></Field>
      <Field label="客服 ID"><input className="admin-input" value={value.serviceId} onChange={(e) => onChange({ ...value, serviceId: e.target.value })} disabled={disabled} /></Field>
      <Field label="客服二维码"><input className="admin-input" value={value.qrCode} onChange={(e) => onChange({ ...value, qrCode: e.target.value })} disabled={disabled} /></Field>
      <Field label="是否启用"><Toggle checked={value.enabled} disabled={disabled} onChange={(enabled) => onChange({ ...value, enabled })} /></Field>
    </div>
  );
}

function NormalServiceFields({ value, disabled, onChange }: { value: SystemSettings["customerService"]["h5"]["normal"]; disabled: boolean; onChange: (value: SystemSettings["customerService"]["h5"]["normal"]) => void }) {
  return (
    <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
      <h3 className="md:col-span-2 text-sm font-black text-slate-900">普通客服配置</h3>
      <Field label="客服二维码"><input className="admin-input" value={value.qrCode} onChange={(e) => onChange({ ...value, qrCode: e.target.value })} disabled={disabled} /></Field>
      <Field label="联系电话"><input className="admin-input" value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value })} disabled={disabled} /></Field>
      <Field label="微信号"><input className="admin-input" value={value.wechatId} onChange={(e) => onChange({ ...value, wechatId: e.target.value })} disabled={disabled} /></Field>
    </div>
  );
}

function OfficialAccountFields({ value, disabled, onChange }: { value: SystemSettings["customerService"]["h5"]["officialAccount"]; disabled: boolean; onChange: (value: SystemSettings["customerService"]["h5"]["officialAccount"]) => void }) {
  return (
    <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
      <h3 className="md:col-span-2 text-sm font-black text-slate-900">公众号客服接口预留</h3>
      <Field label="AppID"><input className="admin-input" value={value.appId} onChange={(e) => onChange({ ...value, appId: e.target.value })} disabled={disabled} /></Field>
      <Field label="客服 URL"><input className="admin-input" value={value.customerServiceUrl} onChange={(e) => onChange({ ...value, customerServiceUrl: e.target.value })} disabled={disabled} /></Field>
      <Field label="OAuth Redirect URL"><input className="admin-input" value={value.oauthRedirectUrl} onChange={(e) => onChange({ ...value, oauthRedirectUrl: e.target.value })} disabled={disabled} /></Field>
      <Field label="JSAPI"><Toggle checked={value.jsapiEnabled} disabled={disabled} onChange={(jsapiEnabled) => onChange({ ...value, jsapiEnabled })} /></Field>
    </div>
  );
}

function SmsSettings({ settings, canEdit, save }: SettingsProps) {
  const [form, setForm] = useState(() => clone(settings.sms));
  return (
    <AdminCard>
      <CardHeader title="短信配置"><SaveButton canEdit={canEdit} onClick={() => save("sms", form, "更新短信配置")} /></CardHeader>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <Field label="是否启用短信"><Toggle checked={form.enabled} disabled={!canEdit} onChange={(enabled) => setForm({ ...form, enabled })} /></Field>
        <Field label="短信服务商"><select className="admin-input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value as SmsProvider })} disabled={!canEdit}><option value="disabled">disabled</option><option value="aliyun">aliyun</option><option value="tencent">tencent</option><option value="other">other</option></select></Field>
        <Field label="AccessKey ID"><input className="admin-input" value={form.accessKeyId} onChange={(e) => setForm({ ...form, accessKeyId: e.target.value })} disabled={!canEdit} /></Field>
        <Field label="AccessKey Secret"><input className="admin-input" type="password" value={form.accessKeySecret} onChange={(e) => setForm({ ...form, accessKeySecret: e.target.value })} disabled={!canEdit} /></Field>
        <Field label="签名"><input className="admin-input" value={form.signName} onChange={(e) => setForm({ ...form, signName: e.target.value })} disabled={!canEdit} /></Field>
        <Field label="登录验证码模板 ID"><input className="admin-input" value={form.loginTemplateId} onChange={(e) => setForm({ ...form, loginTemplateId: e.target.value })} disabled={!canEdit} /></Field>
        <Field label="通知模板 ID"><input className="admin-input" value={form.notificationTemplateId} onChange={(e) => setForm({ ...form, notificationTemplateId: e.target.value })} disabled={!canEdit} /></Field>
      </div>
    </AdminCard>
  );
}

function NotificationSettings({ settings, canEdit, save }: SettingsProps) {
  const [form, setForm] = useState(() => clone(settings.notification));
  return (
    <AdminCard>
      <CardHeader title="通知设置"><SaveButton canEdit={canEdit} onClick={() => save("notification", form, "更新通知设置")} /></CardHeader>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <Field label="聊天未读提醒分钟数"><input className="admin-input" type="number" value={form.unreadChatReminderMinutes} onChange={(e) => setForm({ ...form, unreadChatReminderMinutes: Number(e.target.value) })} disabled={!canEdit} /></Field>
        <Field label="订单未接单提醒分钟数"><input className="admin-input" type="number" value={form.unacceptedOrderReminderMinutes} onChange={(e) => setForm({ ...form, unacceptedOrderReminderMinutes: Number(e.target.value) })} disabled={!canEdit} /></Field>
      </div>
    </AdminCard>
  );
}

function AgreementSettings({ settings, canEdit, save }: SettingsProps) {
  const [form, setForm] = useState(() => clone(settings.agreements));
  const [tab, setTab] = useState<"user" | "privacy" | "worker" | "deposit">("user");
  const tabs = [
    ["user", "用户协议", "userAgreementTitle", "userAgreementContent"],
    ["privacy", "隐私协议", "privacyAgreementTitle", "privacyAgreementContent"],
    ["worker", "接单员服务协议", "workerAgreementTitle", "workerAgreementContent"],
    ["deposit", "保证金规则说明", "depositRuleTitle", "depositRuleContent"],
  ] as const;
  const active = tabs.find((item) => item[0] === tab)!;
  const titleKey = active[2];
  const contentKey = active[3];
  return (
    <AdminCard>
      <CardHeader title="政策协议"><SaveButton canEdit={canEdit} onClick={() => save("agreements", form, "更新政策协议")} /></CardHeader>
      <div className="space-y-4 p-5">
        <div className="flex gap-2 border-b border-slate-200">{tabs.map(([key, label]) => <button key={key} className={`pb-3 text-sm font-black ${tab === key ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500"}`} onClick={() => setTab(key)}>{label}</button>)}</div>
        <Field label="协议标题"><input className="admin-input max-w-xl" value={form[titleKey]} onChange={(e) => setForm({ ...form, [titleKey]: e.target.value })} disabled={!canEdit} /></Field>
        <Field label="协议内容"><textarea className="admin-textarea min-h-[420px]" value={form[contentKey]} onChange={(e) => setForm({ ...form, [contentKey]: e.target.value })} disabled={!canEdit} /></Field>
      </div>
    </AdminCard>
  );
}

function WorkerSettings({ settings, canEdit, save }: SettingsProps) {
  const [form, setForm] = useState(() => clone(settings.worker));
  return (
    <AdminCard>
      <CardHeader title="接单员配置"><SaveButton canEdit={canEdit} onClick={() => save("worker", form, "更新接单员配置")} /></CardHeader>
      <div className="space-y-4 p-5">
        <Field label="最低保证金金额"><input className="admin-input max-w-xs" type="number" value={form.minimumDepositAmount} onChange={(e) => setForm({ ...form, minimumDepositAmount: Number(e.target.value) })} disabled={!canEdit} /></Field>
        <p className="text-sm font-bold text-slate-400">低于该金额时，不在顾客端展示且接单员端不可接单。设置为 0 表示不限制。</p>
        <Field label="保证金规则说明"><textarea className="admin-textarea min-h-80" value={form.depositRuleContent} onChange={(e) => setForm({ ...form, depositRuleContent: e.target.value })} disabled={!canEdit} /></Field>
      </div>
    </AdminCard>
  );
}

function PaymentSettings({ settings, canEdit, save }: SettingsProps) {
  const [form, setForm] = useState(() => clone(settings.payment));
  const [editing, setEditing] = useState<PaymentChannelKey | null>(null);
  const updateChannel = (key: PaymentChannelKey, patch: Partial<PaymentChannelSettings>) => setForm({ ...form, channels: form.channels.map((item) => item.key === key ? { ...item, ...patch } : item) });
  const channel = editing ? form.channels.find((item) => item.key === editing) : null;
  return (
    <AdminCard>
      <CardHeader title="支付渠道配置"><SaveButton canEdit={canEdit} onClick={() => save("payment", form, "更新支付配置")} /></CardHeader>
      <div className="overflow-x-auto p-5">
        <table className="admin-table">
          <thead><tr>{["渠道名称", "渠道标识", "配置状态", "启用状态", "排序", "操作"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead>
          <tbody>
            {form.channels.map((item) => (
              <tr key={item.key} className="border-t border-slate-100">
                <td className="px-4 py-4 font-black">{item.name}</td>
                <td className="px-4 py-4"><AdminBadge>{item.key}</AdminBadge></td>
                <td className="px-4 py-4"><AdminBadge tone={item.configured ? "green" : "amber"}>{item.configured ? "已配置" : "未配置"}</AdminBadge></td>
                <td className="px-4 py-4"><Toggle checked={item.enabled} disabled={!canEdit || item.key === "balance"} onChange={(enabled) => updateChannel(item.key, { enabled })} /></td>
                <td className="px-4 py-4"><input className="admin-input w-24" type="number" value={item.sortOrder} onChange={(e) => updateChannel(item.key, { sortOrder: Number(e.target.value) })} disabled={!canEdit} /></td>
                <td className="px-4 py-4">{item.key === "balance" ? "-" : <button className="admin-link" onClick={() => setEditing(item.key)}>配置</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {channel ? <PaymentDialog channel={channel} canEdit={canEdit} onClose={() => setEditing(null)} onSave={(next) => { updateChannel(next.key, next); setEditing(null); }} /> : null}
    </AdminCard>
  );
}

function PaymentDialog({ channel, canEdit, onClose, onSave }: { channel: PaymentChannelSettings; canEdit: boolean; onClose: () => void; onSave: (channel: PaymentChannelSettings) => void }) {
  const [form, setForm] = useState(() => clone(channel));
  const configured = Boolean(form.mchId && form.apiV3Key && (form.officialAccountAppId || form.miniProgramAppId));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-6">
      <section className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between"><h3 className="text-xl font-black">配置 {channel.name}</h3><button className="text-2xl text-slate-400" onClick={onClose}>×</button></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="环境模式"><select className="admin-input" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value as PaymentChannelSettings["environment"] })} disabled={!canEdit}><option value="production">正式环境</option><option value="sandbox">沙箱环境</option></select></Field>
          <Field label="服务商模式"><Toggle checked={form.serviceProviderMode} disabled={!canEdit} onChange={(serviceProviderMode) => setForm({ ...form, serviceProviderMode })} /></Field>
          <Field label="启用日志"><Toggle checked={form.loggingEnabled} disabled={!canEdit} onChange={(loggingEnabled) => setForm({ ...form, loggingEnabled })} /></Field>
          <Field label="公众号 AppID"><input className="admin-input" value={form.officialAccountAppId} onChange={(e) => setForm({ ...form, officialAccountAppId: e.target.value })} disabled={!canEdit} /></Field>
          <Field label="小程序 AppID"><input className="admin-input" value={form.miniProgramAppId} onChange={(e) => setForm({ ...form, miniProgramAppId: e.target.value })} disabled={!canEdit} /></Field>
          <Field label="商户号 mchId"><input className="admin-input" value={form.mchId} onChange={(e) => setForm({ ...form, mchId: e.target.value })} disabled={!canEdit} /></Field>
          <Field label="APIv3 密钥"><input className="admin-input" type="password" value={form.apiV3Key} onChange={(e) => setForm({ ...form, apiV3Key: e.target.value })} disabled={!canEdit} /></Field>
          <Field label="回调地址"><input className="admin-input" value={form.callbackUrl} onChange={(e) => setForm({ ...form, callbackUrl: e.target.value })} disabled={!canEdit} /></Field>
          <Field label="证书内容" wide><textarea className="admin-textarea min-h-28" value={form.certificate} onChange={(e) => setForm({ ...form, certificate: e.target.value })} disabled={!canEdit} /></Field>
          <Field label="私钥内容" wide><textarea className="admin-textarea min-h-28" value={form.privateKey} onChange={(e) => setForm({ ...form, privateKey: e.target.value })} disabled={!canEdit} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-3"><button className="admin-cancel" onClick={onClose}>取消</button>{canEdit ? <button className="admin-confirm" onClick={() => onSave({ ...form, configured })}>保存配置</button> : null}</div>
      </section>
    </div>
  );
}

function OrderSettings({ settings, canEdit, save }: SettingsProps) {
  const [form, setForm] = useState(() => clone(settings.order));
  return (
    <AdminCard>
      <CardHeader title="订单设置"><SaveButton canEdit={canEdit} onClick={() => save("order", form, "更新订单设置")} /></CardHeader>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <Field label="支付超时分钟数"><input className="admin-input" type="number" value={form.paymentTimeoutMinutes} onChange={(e) => setForm({ ...form, paymentTimeoutMinutes: Number(e.target.value) })} disabled={!canEdit} /></Field>
        <Field label="确认超时小时数"><input className="admin-input" type="number" value={form.autoConfirmHours} onChange={(e) => setForm({ ...form, autoConfirmHours: Number(e.target.value) })} disabled={!canEdit} /></Field>
        <Field label="主接单员自选接单员"><Toggle checked={form.primaryWorkerCanSelectAssistants} disabled={!canEdit} onChange={(primaryWorkerCanSelectAssistants) => setForm({ ...form, primaryWorkerCanSelectAssistants })} /></Field>
        <Field label="下单必看说明" wide><textarea className="admin-textarea min-h-80" value={form.mustReadContent} onChange={(e) => setForm({ ...form, mustReadContent: e.target.value })} disabled={!canEdit} /></Field>
      </div>
    </AdminCard>
  );
}

function BusinessTargetSettings({ settings, store, canEdit, save }: SettingsProps & { store: StoreShape }) {
  const [form, setForm] = useState(() => clone(settings.businessTarget));
  const monthlyOrders = store.orders.filter((order) => order.createdAt.slice(0, 7) === form.month);
  const gmv = monthlyOrders.filter((order) => order.status === "settled").reduce((sum, order) => sum + order.amountRmb, 0);
  return (
    <AdminCard>
      <CardHeader title="经营目标"><SaveButton canEdit={canEdit} onClick={() => save("businessTarget", form, "更新经营目标")} /></CardHeader>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <Field label="月份"><input className="admin-input" type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} disabled={!canEdit} /></Field>
        <Field label="GMV 目标"><input className="admin-input" type="number" value={form.gmvTarget ?? ""} onChange={(e) => setForm({ ...form, gmvTarget: e.target.value ? Number(e.target.value) : null })} disabled={!canEdit} /></Field>
        <Field label="订单数目标"><input className="admin-input" type="number" value={form.orderCountTarget ?? ""} onChange={(e) => setForm({ ...form, orderCountTarget: e.target.value ? Number(e.target.value) : null })} disabled={!canEdit} /></Field>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">当前月完成 GMV {formatCurrency(gmv)}，创建订单 {monthlyOrders.length} 单。</div>
      </div>
    </AdminCard>
  );
}

function FinanceSettings({ settings, canEdit, save }: SettingsProps) {
  const [form, setForm] = useState(() => clone(settings.finance));
  return (
    <AdminCard>
      <CardHeader title="财务配置"><SaveButton canEdit={canEdit} onClick={() => save("finance", form, "更新财务配置")} /></CardHeader>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <Field label="最低提现金额"><input className="admin-input" type="number" value={form.minimumWithdrawAmount} onChange={(e) => setForm({ ...form, minimumWithdrawAmount: Number(e.target.value) })} disabled={!canEdit} /></Field>
        <Field label="提现手续费比例"><input className="admin-input" type="number" step="0.01" value={form.withdrawFeeRate} onChange={(e) => setForm({ ...form, withdrawFeeRate: Number(e.target.value) })} disabled={!canEdit} /></Field>
        <Field label="钱包留存金额"><input className="admin-input" type="number" value={form.walletReserveAmount} onChange={(e) => setForm({ ...form, walletReserveAmount: Number(e.target.value) })} disabled={!canEdit} /></Field>
        <Field label="提现方式"><select className="admin-input" value={form.withdrawMethod} onChange={(e) => setForm({ ...form, withdrawMethod: e.target.value as WithdrawMethod })} disabled={!canEdit}><option value="manual_offline">线下人工打款</option><option value="wechat_transfer">微信商家转账（占位）</option><option value="alipay_transfer">支付宝转账（占位）</option><option value="bank_transfer">银行转账（占位）</option></select></Field>
      </div>
    </AdminCard>
  );
}

function ResourcesSettings({ store, canEdit, refresh }: { settings: SystemSettings; store: StoreShape; canEdit: boolean; refresh: () => void }) {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<"all" | ResourceType>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [form, setForm] = useState({ name: "", type: "image" as ResourceType, url: "", size: "" });
  const resources = store.system_settings.resources.records;
  const rows = useMemo(() => resources.filter((item) => (type === "all" || item.type === type) && (!keyword || item.name.includes(keyword) || item.url.includes(keyword))), [keyword, resources, type]);
  const add = () => {
    try {
      adminUpsertResource({ name: form.name || form.url.split("/").pop() || "未命名资源", type: form.type, url: form.url, size: Number(form.size) || 0 });
      setForm({ name: "", type: "image", url: "", size: "" });
      refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "保存失败");
    }
  };
  return (
    <AdminCard>
      <CardHeader title="资源管理"><AdminBadge tone="blue">public/images / URL 占位</AdminBadge></CardHeader>
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          {(["all", "image", "video", "audio", "file"] as const).map((item) => <button key={item} className={`rounded-xl px-4 py-2 text-sm font-black ${type === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`} onClick={() => setType(item)}>{resourceTypeText(item)}</button>)}
        </div>
        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_140px_1fr_120px_auto]">
          <input className="admin-input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索文件名 / 路径" />
          <select className="admin-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ResourceType })} disabled={!canEdit}><option value="image">图片</option><option value="video">视频</option><option value="audio">音频</option><option value="file">文件</option></select>
          <input className="admin-input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="/images/xxx.png 或 URL" disabled={!canEdit} />
          <input className="admin-input" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value.replace(/[^\d]/g, "") })} placeholder="大小 B" disabled={!canEdit} />
          {canEdit ? <button className="admin-confirm" onClick={add}>上传资源</button> : null}
        </div>
        <div className="flex justify-end gap-2"><button className="admin-secondary" onClick={() => setView("grid")}>网格</button><button className="admin-secondary" onClick={() => setView("list")}>列表</button></div>
        {view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {rows.map((item) => <ResourceTile key={item.id} item={item} canEdit={canEdit} refresh={refresh} />)}
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="admin-table"><tbody>{rows.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-4 py-3 font-black">{item.name}</td><td>{item.type}</td><td>{item.url}</td><td>{item.size} B</td><td><ResourceActions item={item} canEdit={canEdit} refresh={refresh} /></td></tr>)}</tbody></table></div>
        )}
      </div>
    </AdminCard>
  );
}

function ResourceTile({ item, canEdit, refresh }: { item: ResourceRecord; canEdit: boolean; refresh: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      {item.type === "image" && item.url ? <img src={item.url} alt={item.name} className="aspect-square w-full rounded-xl object-cover" /> : <div className="grid aspect-square place-items-center rounded-xl bg-white text-sm font-black text-slate-400">{resourceTypeText(item.type)}</div>}
      <p className="mt-3 truncate text-sm font-black">{item.name}</p>
      <p className="mt-1 text-xs font-bold text-slate-400">{item.url}</p>
      <ResourceActions item={item} canEdit={canEdit} refresh={refresh} />
    </div>
  );
}

function ResourceActions({ item, canEdit, refresh }: { item: ResourceRecord; canEdit: boolean; refresh: () => void }) {
  const remove = () => {
    if (!confirm("确认删除该资源记录？")) return;
    adminDeleteResource(item.id);
    refresh();
  };
  return (
    <div className="mt-3 flex gap-3 text-xs font-black">
      <button className="text-blue-600" onClick={() => navigator.clipboard?.writeText(item.url)}>复制路径</button>
      <a className="text-slate-600" href={item.url} target="_blank">预览</a>
      {canEdit ? <button className="text-rose-600" onClick={remove}>删除</button> : null}
    </div>
  );
}

function resourceTypeText(type: "all" | ResourceType) {
  return { all: "全部", image: "图片", video: "视频", audio: "音频", file: "文件" }[type];
}
