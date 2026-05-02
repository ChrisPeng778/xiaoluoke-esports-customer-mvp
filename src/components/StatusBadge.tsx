import type { OrderStatus } from "@/lib/types";
import { statusText, statusTone } from "@/lib/status";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusTone[status]}`}>
      {statusText[status]}
    </span>
  );
}
