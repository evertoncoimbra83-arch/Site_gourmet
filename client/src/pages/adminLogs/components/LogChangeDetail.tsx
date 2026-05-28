import { Badge } from "@/components/ui/badge";
import type { AdminLog } from "../logic/useAdminLogs";

interface LogChangeDetailProps {
  log: AdminLog;
}

export function LogChangeDetail({ log }: LogChangeDetailProps) {
  if (log.isErrorLog || log.action === "ERROR") {
    return (
      <Badge
        variant="outline"
        className="rounded-none border-rose-200 bg-rose-50 text-[10px] font-black uppercase tracking-widest text-rose-700"
      >
        erro técnico
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="rounded-none text-[10px] font-black uppercase tracking-widest text-slate-500"
    >
      {log.hasDetails ? "ver detalhes" : "sem snapshot"}
    </Badge>
  );
}
