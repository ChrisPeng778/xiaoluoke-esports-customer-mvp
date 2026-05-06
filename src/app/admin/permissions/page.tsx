"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPermissionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/permissions/roles");
  }, [router]);

  return null;
}
