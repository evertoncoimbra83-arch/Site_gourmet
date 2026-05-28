import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LogSeverity } from "../logic/useAdminLogs";

const severityStyles: Record<LogSeverity, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
  error: "border-rose-300 bg-rose-50 text-rose-700",
};

export function LogSeverityBadge({
  severity,
  action,
}: {
  severity: LogSeverity;
  action?: string;
}) {
  const label = action === "ERROR" ? "ERROR" : severity;

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-none px-2 text-[10px] font-black uppercase tracking-widest",
        severityStyles[severity] || severityStyles.info,
      )}
    >
      {label}
    </Badge>
  );
}
