"use client";

import { useCallback, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { useStoreSync } from "@/lib/hooks";
import { getSystemSettings } from "@/lib/store";

const defaultMustReadContent =
  "下单前请确认游戏昵称和 ID 编号准确。\n平台仅提供人工协助类服务，禁止外挂、脚本、BUG、盗号等违规行为。\n接单员接单后，顾客可在订单详情中沟通具体需求。\n服务完成后，顾客确认结单，订单才会完成。\n如订单存在疑问，可在订单详情中提交“有疑问”。\n当前网站仍为测试版本，真实支付和正式售后规则以后续公告为准。";

export default function MustReadPage() {
  const [content, setContent] = useState(defaultMustReadContent);
  const refresh = useCallback(() => {
    const configuredContent = getSystemSettings().order.mustReadContent.trim();
    setContent(configuredContent || defaultMustReadContent);
  }, []);
  useStoreSync(refresh, true, 2000);
  const notes = useMemo(() => content.split(/\r?\n/).map((item) => item.trim()).filter(Boolean), [content]);

  return (
    <main className="page-shell">
      <AppHeader />

      <section className="space-y-4">
        <div className="rounded-[26px] bg-gradient-to-br from-amber-300 via-yellow-200 to-white p-5 shadow-[0_18px_45px_rgba(245,158,11,0.18)]">
          <p className="text-xs font-black text-amber-800">下单前确认</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">下单必看</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            为了让服务更顺利，请先确认信息准确、规则清楚，再提交订单。
          </p>
        </div>

        <div className="panel p-4">
          <div className="space-y-3">
            {notes.map((note, index) => (
              <div key={note} className="flex gap-3 rounded-[18px] bg-amber-50 px-3 py-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rock-gold text-xs font-black text-slate-950">
                  {index + 1}
                </span>
                <p className="text-sm font-bold leading-6 text-slate-700">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
