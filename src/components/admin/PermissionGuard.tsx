"use client";

import { ReactNode, useEffect, useState } from "react";
import { hasAnyPermission, hasPermission } from "@/lib/store";

export function PermissionGuard({
  permission,
  anyOf,
  children,
  fallback = null,
}: {
  permission?: string;
  anyOf?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(permission ? hasPermission(permission) : hasAnyPermission(anyOf ?? []));
  }, [permission, anyOf]);

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}

export function NoPermission({ text = "无权限操作" }: { text?: string }) {
  return <span className="text-xs font-bold text-slate-400">{text}</span>;
}
