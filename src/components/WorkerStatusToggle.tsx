"use client";

import type { WorkerStatus } from "@/lib/types";

export function WorkerStatusToggle({
  value,
  onChange,
}: {
  value: WorkerStatus;
  onChange: (status: WorkerStatus) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-[18px] bg-white/75 p-2">
      <button
        type="button"
        className={`h-11 rounded-[14px] text-sm font-black transition active:scale-[0.98] ${
          value === "online" ? "bg-emerald-500 text-white shadow-soft" : "bg-white text-stone-500"
        }`}
        onClick={() => onChange("online")}
      >
        在线接单
      </button>
      <button
        type="button"
        className={`h-11 rounded-[14px] text-sm font-black transition active:scale-[0.98] ${
          value === "offline" ? "bg-slate-900 text-white shadow-soft" : "bg-white text-stone-500"
        }`}
        onClick={() => onChange("offline")}
      >
        离线休息
      </button>
    </div>
  );
}
