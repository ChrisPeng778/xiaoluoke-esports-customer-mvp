"use client";

import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { AuthPrompt } from "@/components/AuthPrompt";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { useCustomerSession } from "@/lib/hooks";
import {
  formatTime,
  getOrderChat,
  sendChatImageMessage,
  sendChatTextMessage,
  simulateWorkerChatMessage,
} from "@/lib/store";
import type { ChatMessage, ChatSession, Order } from "@/lib/types";

const maxImageSize = 2 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export default function CustomerChatPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const { session, ready, refresh } = useCustomerSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadChat = () => {
    const result = getOrderChat(params.orderId);
    setOrder(result.order);
    setChatSession(result.chatSession);
    setMessages(result.messages);
  };

  useEffect(() => {
    if (!ready || !session) return;
    loadChat();
    const timer = window.setInterval(loadChat, 2000);
    return () => window.clearInterval(timer);
  }, [ready, session?.user.id, params.orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!ready) return null;

  if (!session) {
    return (
      <main className="page-shell">
        <button className="mb-4 text-sm font-black text-stone-500" onClick={() => router.back()}>
          返回
        </button>
        <EmptyState title="请先微信登录" description="登录后可以查看订单沟通记录。" />
        <button className="primary-button mt-4 w-full" onClick={() => setLoginOpen(true)}>
          微信一键登录
        </button>
        <AuthPrompt open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={refresh} />
      </main>
    );
  }

  const canChat = Boolean(
    order?.workerId &&
      order.workerName &&
      chatSession &&
      ["accepted", "worker_completed", "disputed", "settled"].includes(order.status),
  );

  const sendText = () => {
    setError("");
    try {
      sendChatTextMessage(params.orderId, text);
      setText("");
      loadChat();
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送失败");
    }
  };

  const sendImage = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!allowedImageTypes.includes(file.type)) {
      setError("仅支持 jpg、png、webp 图片。");
      return;
    }
    if (file.size > maxImageSize) {
      setError("图片不能超过 2MB。");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        sendChatImageMessage(params.orderId, String(reader.result));
        loadChat();
      } catch (err) {
        setError(err instanceof Error ? err.message : "图片发送失败");
      }
    };
    reader.onerror = () => setError("图片读取失败");
    reader.readAsDataURL(file);
  };

  const simulateReply = (type: "text" | "image") => {
    setError("");
    try {
      simulateWorkerChatMessage(params.orderId, type);
      loadChat();
    } catch (err) {
      setError(err instanceof Error ? err.message : "模拟失败");
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-4">
      <header className="sticky top-0 z-20 -mx-4 mb-4 border-b border-white/55 bg-[#f5efe4]/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button className="rounded-full bg-white/80 px-3 py-2 text-sm font-black text-slate-700" onClick={() => router.back()}>
            返回
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900">订单沟通</h1>
            <p className="text-xs font-bold text-stone-500">小洛克电竞</p>
          </div>
        </div>
      </header>

      {!order ? (
        <EmptyState title="订单不存在" description="可能不是当前账号的订单，或本地 mock 数据已被清空。" />
      ) : (
        <section className="space-y-4">
          <div className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black text-slate-900">{order.productName ?? "服务订单"}</h2>
                <p className="mt-1 text-xs font-bold text-stone-500">{order.orderNo}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-3 grid gap-2 text-sm font-bold text-slate-600">
              <p>接单员：{order.workerName || "等待接单员"}</p>
              <p>沟通状态：{chatSession?.status === "active" ? "可沟通" : chatSession?.status === "closed" ? "已关闭" : "等待接单"}</p>
            </div>
          </div>

          <div className="rounded-[18px] bg-amber-50/80 px-4 py-3 text-xs font-bold leading-5 text-amber-800">
            请勿发送支付密码、身份证、银行卡等敏感信息。平台不保存游戏账号密码，如需提供游戏相关信息，请自行判断风险。
          </div>

          {!canChat ? (
            <EmptyState title="当前订单暂无接单员" description="当前订单暂无接单员，暂不能聊天。" />
          ) : (
            <>
              <div className="space-y-3">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} onPreview={setPreview} />
                ))}
                <div ref={bottomRef} />
              </div>

              {process.env.NODE_ENV === "development" ? (
                <div className="panel border-dashed border-rock-gold/70 p-4">
                  <p className="mb-3 text-sm font-black text-amber-700">开发测试区域</p>
                  <div className="grid gap-2">
                    <button className="secondary-button w-full" onClick={() => simulateReply("text")}>
                      模拟接单员回复
                    </button>
                    {order.status === "accepted" ? (
                      <button className="secondary-button w-full" onClick={() => simulateReply("image")}>
                        模拟接单员发送图片
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      )}

      {error ? (
        <div className="fixed inset-x-0 bottom-24 z-40 mx-auto max-w-[430px] px-4">
          <p className="rounded-[16px] bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 shadow-soft">{error}</p>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-[#f7f1e8]/95 px-3 pb-3 pt-2 backdrop-blur">
        <div className="mx-auto flex max-w-[430px] gap-2">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={sendImage} />
          <button className="secondary-button min-h-11 px-3" disabled={!canChat} onClick={() => fileInputRef.current?.click()}>
            图片
          </button>
          <input
            className="field h-11 flex-1 text-sm"
            placeholder="请输入消息..."
            value={text}
            maxLength={500}
            disabled={!canChat}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendText();
            }}
          />
          <button className="primary-button min-h-11 px-4" disabled={!canChat || !text.trim()} onClick={sendText}>
            发送
          </button>
        </div>
      </div>

      {preview ? (
        <button className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5" onClick={() => setPreview(null)}>
          <img src={preview} alt="聊天图片预览" className="max-h-full max-w-full rounded-[18px] object-contain" />
        </button>
      ) : null}
    </main>
  );
}

function MessageBubble({ message, onPreview }: { message: ChatMessage; onPreview: (url: string) => void }) {
  if (message.senderRole === "system") {
    return (
      <div className="text-center">
        <span className="inline-flex rounded-full bg-stone-200/80 px-3 py-1 text-xs font-bold text-stone-600">
          {message.content}
        </span>
      </div>
    );
  }

  const fromCustomer = message.senderRole === "customer";

  return (
    <div className={`flex ${fromCustomer ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] ${fromCustomer ? "text-right" : "text-left"}`}>
        <p className="mb-1 px-1 text-xs font-bold text-stone-500">
          {message.senderName} · {formatTime(message.createdAt)}
        </p>
        <div
          className={`rounded-[18px] px-3 py-2 text-sm font-bold leading-6 shadow-sm ${
            fromCustomer ? "rounded-tr-sm bg-rock-gold text-slate-950" : "rounded-tl-sm bg-white text-slate-800"
          }`}
        >
          {message.messageType === "image" && message.imageUrl ? (
            <button onClick={() => onPreview(message.imageUrl ?? "")}>
              <img src={message.imageUrl} alt={message.content || "聊天图片"} className="max-h-48 rounded-[14px] object-cover" />
            </button>
          ) : (
            message.content
          )}
        </div>
      </div>
    </div>
  );
}
