"use client";

import { useParams } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkerHeader } from "@/components/WorkerHeader";
import { useWorkerSession } from "@/lib/hooks";
import {
  formatTime,
  getWorkerOrderChat,
  sendWorkerChatImageMessage,
  sendWorkerChatTextMessage,
} from "@/lib/store";
import type { ChatMessage, ChatSession, Order } from "@/lib/types";

const maxImageSize = 2 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export default function WorkerChatPage() {
  const params = useParams<{ orderId: string }>();
  const { session, ready } = useWorkerSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadChat = () => {
    const result = getWorkerOrderChat(params.orderId);
    setOrder(result.order);
    setChatSession(result.chatSession);
    setMessages(result.messages);
  };

  useEffect(() => {
    if (!ready || !session) return;
    loadChat();
    const timer = window.setInterval(loadChat, 2000);
    return () => window.clearInterval(timer);
  }, [ready, session?.worker.id, params.orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!ready) return null;

  if (!session) {
    return (
      <main className="page-shell">
        <WorkerHeader />
        <EmptyState title="请先登录接单员端" description="登录后可以查看订单沟通记录。" />
      </main>
    );
  }

  const canChat = Boolean(order?.workerId === session.worker.id && chatSession);

  const sendText = () => {
    setError("");
    try {
      sendWorkerChatTextMessage(params.orderId, text);
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
        sendWorkerChatImageMessage(params.orderId, String(reader.result));
        loadChat();
      } catch (err) {
        setError(err instanceof Error ? err.message : "图片发送失败");
      }
    };
    reader.onerror = () => setError("图片读取失败");
    reader.readAsDataURL(file);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-4">
      <WorkerHeader session={session} />

      {!order ? (
        <EmptyState title="订单不存在" description="该订单可能已被其他接单员处理，或本地 mock 数据已被清空。" />
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
            <p className="mt-3 text-sm font-bold text-slate-600">顾客：{order.customerName}</p>
          </div>

          <div className="rounded-[18px] bg-amber-50/80 px-4 py-3 text-xs font-bold leading-5 text-amber-800">
            请勿索要支付密码、身份证、银行卡等敏感信息。平台聊天当前为本地 mock，后续会接实时消息服务。
          </div>

          {!canChat ? (
            <EmptyState title="暂不能聊天" description="请先接单，或确认当前登录接单员是否为该订单接单员。" />
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} onPreview={setPreview} />
              ))}
              <div ref={bottomRef} />
            </div>
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

  const fromWorker = message.senderRole === "worker";

  return (
    <div className={`flex ${fromWorker ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] ${fromWorker ? "text-right" : "text-left"}`}>
        <p className="mb-1 px-1 text-xs font-bold text-stone-500">
          {message.senderName} · {formatTime(message.createdAt)}
        </p>
        <div
          className={`rounded-[18px] px-3 py-2 text-sm font-bold leading-6 shadow-sm ${
            fromWorker ? "rounded-tr-sm bg-rock-gold text-slate-950" : "rounded-tl-sm bg-white text-slate-800"
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
