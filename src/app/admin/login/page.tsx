"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { adminLogin, isAdminLoggedIn } from "@/lib/store";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isAdminLoggedIn()) router.replace("/admin/dashboard");
  }, [router]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = adminLogin(username, password);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    router.replace("/admin/dashboard");
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-900 text-xl font-black text-amber-300">洛</div>
        <h1 className="mt-5 text-center text-2xl font-black text-slate-900">小洛克电竞管理端</h1>
        <p className="mt-2 text-center text-sm font-bold text-slate-400">Admin Dashboard MVP</p>
        <label className="mt-8 block text-sm font-black text-slate-700">管理员账号</label>
        <input
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base font-bold outline-none focus:border-blue-300"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="admin"
        />
        <label className="mt-5 block text-sm font-black text-slate-700">管理员密码</label>
        <input
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base font-bold outline-none focus:border-blue-300"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入 0000"
        />
        {message ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{message}</p> : null}
        <button className="mt-6 h-12 w-full rounded-xl bg-blue-600 text-sm font-black text-white shadow-sm">登录管理端</button>
      </form>
    </main>
  );
}
