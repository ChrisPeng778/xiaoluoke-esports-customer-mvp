"use client";

import { getSystemSettings } from "@/lib/store";

export function CustomerServicePanel({ audience = "customer" }: { audience?: "customer" | "worker" }) {
  const settings = getSystemSettings();
  const config = settings.customerService.h5.type !== "disabled" ? settings.customerService.h5 : settings.customerService.miniProgram;
  const normal = config.normal;
  const enterprise = config.enterpriseWechat;
  const official = settings.customerService.h5.officialAccount;
  const title = audience === "worker" ? "联系平台运营" : "联系客服";

  const openService = () => {
    if (config.type === "enterprise_wechat" && enterprise.enabled && enterprise.serviceUrl) {
      window.open(enterprise.serviceUrl, "_blank");
      return;
    }
    if (config.type === "official_account" && official.customerServiceUrl) {
      window.open(official.customerServiceUrl, "_blank");
      return;
    }
    alert("客服暂未配置");
  };

  if (config.type === "disabled") {
    return <p className="rounded-[16px] bg-slate-50 p-4 text-sm font-black text-slate-400">客服入口暂未启用。</p>;
  }

  return (
    <section className="panel space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">{title}</h2>
          <p className="mt-1 text-xs font-bold text-slate-400">读取管理端统一客服配置</p>
        </div>
        {(config.type === "enterprise_wechat" || config.type === "official_account") ? <button className="secondary-button min-h-10" onClick={openService}>打开客服</button> : null}
      </div>
      {config.type === "enterprise_wechat" && enterprise.qrCode ? <img src={enterprise.qrCode} alt="企业微信客服二维码" className="mx-auto h-40 w-40 rounded-[18px] object-cover" /> : null}
      {config.type === "normal" && normal.qrCode ? <img src={normal.qrCode} alt="客服二维码" className="mx-auto h-40 w-40 rounded-[18px] object-cover" /> : null}
      {config.type === "normal" ? (
        <div className="grid gap-2">
          {normal.phone ? <Info label="联系电话" value={normal.phone} /> : null}
          {normal.wechatId ? <Info label="微信号" value={normal.wechatId} /> : null}
          {!normal.qrCode && !normal.phone && !normal.wechatId ? <p className="rounded-[16px] bg-slate-50 p-4 text-sm font-black text-slate-400">普通客服暂未配置联系方式。</p> : null}
        </div>
      ) : null}
      {config.type === "wechat_mini_customer_service" ? <p className="rounded-[16px] bg-blue-50 p-4 text-sm font-black text-blue-700">小程序原生客服已预留，当前 H5 测试环境不调用真实微信能力。</p> : null}
      {config.type === "official_account" ? <p className="rounded-[16px] bg-blue-50 p-4 text-sm font-black text-blue-700">公众号客服接口已预留，当前不接真实公众号客服。</p> : null}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <p className="rounded-[14px] bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">{label}：{value}</p>;
}
