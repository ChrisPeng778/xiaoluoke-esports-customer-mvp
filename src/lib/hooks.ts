"use client";

import { useEffect, useState } from "react";
import type { CustomerSession, WorkerSession } from "./types";
import { getCurrentSession, getCurrentWorkerSession, mockWechatLogin, mockWorkerLogin, STORE_UPDATED_EVENT } from "./store";

export function useCustomerSession() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = () => {
    const next = getCurrentSession();
    setSession(next);
    setReady(true);
    return next;
  };

  const login = () => {
    const next = mockWechatLogin();
    setSession(next);
    setReady(true);
    return next;
  };

  useEffect(() => {
    refresh();
  }, []);

  return { session, ready, refresh, login };
}

export function useWorkerSession() {
  const [session, setSession] = useState<WorkerSession | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = () => {
    const next = getCurrentWorkerSession();
    setSession(next);
    setReady(true);
    return next;
  };

  const login = (workerId: string) => {
    const next = mockWorkerLogin(workerId);
    setSession(next);
    setReady(true);
    return next;
  };

  useEffect(() => {
    refresh();
  }, []);

  return { session, ready, refresh, login };
}

export function useStoreSync(callback: () => void, enabled = true, intervalMs = 2000) {
  useEffect(() => {
    if (!enabled) return;

    callback();

    const handleUpdate = () => callback();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") callback();
    };
    const timer = window.setInterval(callback, intervalMs);

    window.addEventListener(STORE_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener(STORE_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [callback, enabled, intervalMs]);
}
