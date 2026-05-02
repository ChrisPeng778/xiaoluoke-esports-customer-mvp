"use client";

import { mockWechatLogin } from "@/lib/store";
import type { CustomerSession } from "@/lib/types";

export function AuthPrompt({
  open,
  onClose,
  onLogin,
  title = "需要微信登录",
}: {
  open: boolean;
  onClose: () => void;
  onLogin: (session: CustomerSession) => void;
  title?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/35 px-4 pb-4">
      <div className="w-full max-w-[430px] rounded-[20px] bg-white p-5 shadow-soft">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          当前阶段使用 mock 微信登录，后续预留微信公众号网页授权登录。
        </p>
        <button
          className="primary-button mt-5 w-full"
          onClick={() => {
            const session = mockWechatLogin();
            onLogin(session);
            onClose();
          }}
        >
          微信一键登录
        </button>
        <button className="secondary-button mt-3 w-full" onClick={onClose}>
          先逛逛
        </button>
      </div>
    </div>
  );
}
