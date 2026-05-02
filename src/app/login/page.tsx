"use client";

import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { mockWechatLogin } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="page-shell">
      <AppHeader />

      <section className="space-y-5 pt-8">
        <div className="panel overflow-hidden">
          <div className="bg-gradient-to-br from-rock-gold via-amber-200 to-white px-5 py-8">
            <p className="text-sm font-black text-amber-700">H5 / Web App</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900">小洛克电竞</h1>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              顾客可先浏览首页、分类、商品详情、接单员和排行榜，需要下单、充值、打赏时再登录。
            </p>
          </div>
        </div>

        <div className="panel p-4">
          <button
            className="primary-button w-full"
            onClick={() => {
              mockWechatLogin();
              router.replace("/customer/home");
            }}
          >
            微信一键登录
          </button>
          <button className="secondary-button mt-3 w-full" onClick={() => router.push("/customer/home")}>
            先进入首页浏览
          </button>
        </div>

        <details className="panel p-4">
          <summary className="cursor-pointer text-sm font-black text-slate-700">开发测试说明</summary>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            当前为 mock 微信登录：openid 使用 mock_openid_xxx，后续预留微信公众号网页授权登录，不使用 wx.login。
          </p>
        </details>
      </section>
    </main>
  );
}
