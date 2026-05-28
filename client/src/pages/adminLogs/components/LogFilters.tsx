import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { AdminLogFilters } from "../logic/useAdminLogs";

const severityOptions = ["info", "warning", "critical", "error"] as const;

export function LogFilters({
  filters,
  moduleOptions,
  isModulesLoading,
  onChange,
  onClear,
}: {
  filters: AdminLogFilters;
  moduleOptions: string[];
  isModulesLoading?: boolean;
  onChange: (key: keyof AdminLogFilters, value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="border border-slate-100 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr_1fr_1fr_auto]">
        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Busca textual
          </span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={filters.search}
              onChange={event => onChange("search", event.target.value)}
              placeholder="Buscar acao, entidade, requestId..."
              className="pl-9"
              aria-label="Busca textual nos logs"
            />
          </div>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Modulo
          </span>
          <Select
            value={filters.module || "all"}
            onValueChange={value =>
              onChange("module", value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-full border border-slate-200 px-3">
              <SelectValue
                placeholder={isModulesLoading ? "Carregando..." : "Modulo"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos modulos</SelectItem>
              {moduleOptions.map(module => (
                <SelectItem key={module} value={module}>
                  {module}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Severidade
          </span>
          <Select
            value={filters.severity}
            onValueChange={value => onChange("severity", value)}
          >
            <SelectTrigger className="w-full border border-slate-200 px-3">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {severityOptions.map(severity => (
                <SelectItem key={severity} value={severity}>
                  {severity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Acao
          </span>
          <Input
            value={filters.action}
            onChange={event => onChange("action", event.target.value)}
            placeholder="UPDATE_STATUS"
          />
        </label>

        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Usuario
          </span>
          <Input
            value={filters.userId}
            onChange={event => onChange("userId", event.target.value)}
            placeholder="Usuario ID"
          />
        </label>

        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Request ID
          </span>
          <Input
            value={filters.requestId}
            onChange={event => onChange("requestId", event.target.value)}
            placeholder="Request ID"
          />
        </label>

        <Button variant="outline" onClick={onClear} className="mt-5 gap-2">
          <X className="size-3.5" />
          Limpar
        </Button>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Data inicial
          </span>
          <Input
            type="datetime-local"
            value={filters.startDate}
            onChange={event => onChange("startDate", event.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Data final
          </span>
          <Input
            type="datetime-local"
            value={filters.endDate}
            onChange={event => onChange("endDate", event.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Entidade
          </span>
          <Input
            value={filters.entityType}
            onChange={event => onChange("entityType", event.target.value)}
            placeholder="order, coupon, error..."
          />
        </label>
      </div>
    </div>
  );
}
