"use client";

import { useEffect, useState } from "react";
import type { CustomerSession } from "./types";
import { getCurrentSession, mockWechatLogin } from "./store";

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
