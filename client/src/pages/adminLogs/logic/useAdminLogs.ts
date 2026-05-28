import { trpc } from "@/_core/trpc";
import { useEffect, useMemo, useState } from "react";

export type LogSeverity = "info" | "warning" | "critical" | "error";

export interface AdminLog {
  id: number | string;
  action: string;
  module: string;
  severity: LogSeverity;
  entity: string | null;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  requestId: string | null;
  createdAt: string | Date;
  ipAddress: string | null;
  userAgent: string | null;
  user: {
    id?: string | null;
    name: string | null;
    email: string | null;
  } | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  hasDetails?: boolean;
  isErrorLog?: boolean;
}

export interface AdminLogFilters {
  module: string;
  severity: "all" | LogSeverity;
  action: string;
  entityType: string;
  userId: string;
  requestId: string;
  startDate: string;
  endDate: string;
  search: string;
}

const emptyFilters: AdminLogFilters = {
  module: "",
  severity: "all",
  action: "",
  entityType: "",
  userId: "",
  requestId: "",
  startDate: "",
  endDate: "",
  search: "",
};

const fallbackModules = [
  "client",
  "frontend",
  "catalog",
  "system",
  "trpc",
  "express",
  "backup",
  "integrations",
  "orders",
  "settings",
  "payments",
  "shipping",
  "loyalty",
  "marketing",
  "zebra",
  "security",
];

function clean(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function shortRequestId(requestId: string | null | undefined) {
  if (!requestId) return "sem-id";
  if (requestId.length <= 12) return requestId;
  return `${requestId.slice(0, 8)}...${requestId.slice(-4)}`;
}

export function useAdminLogs(pageSize = 50) {
  const utils = trpc.useUtils();
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);
  const [filters, setFilters] = useState<AdminLogFilters>(emptyFilters);
  const [debouncedTextFilters, setDebouncedTextFilters] = useState({
    action: "",
    userId: "",
    requestId: "",
    search: "",
  });
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedTextFilters({
        action: filters.action,
        userId: filters.userId,
        requestId: filters.requestId,
        search: filters.search,
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [filters.action, filters.userId, filters.requestId, filters.search]);

  const queryInput = useMemo(
    () => ({
      limit: pageSize,
      offset,
      module: clean(filters.module),
      severity: filters.severity === "all" ? undefined : filters.severity,
      action: clean(debouncedTextFilters.action),
      entityType: clean(filters.entityType),
      userId: clean(debouncedTextFilters.userId),
      requestId: clean(debouncedTextFilters.requestId),
      startDate: clean(filters.startDate),
      endDate: clean(filters.endDate),
      search: clean(debouncedTextFilters.search),
    }),
    [
      debouncedTextFilters.action,
      debouncedTextFilters.requestId,
      debouncedTextFilters.search,
      debouncedTextFilters.userId,
      filters.endDate,
      filters.entityType,
      filters.module,
      filters.severity,
      filters.startDate,
      offset,
      pageSize,
    ]
  );

  const query = trpc.admin.logs.list.useQuery(queryInput, {
    staleTime: 1000 * 30,
    retry: false,
    placeholderData: previousData => previousData,
  });

  const modulesQuery = trpc.admin.logs.modules.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const selectedLogId =
    selectedLog?.id !== undefined && selectedLog?.id !== null
      ? Number(selectedLog.id)
      : undefined;

  const detailQuery = trpc.admin.logs.detail.useQuery(
    { id: selectedLogId || 0 },
    {
      enabled: Boolean(selectedLogId),
      staleTime: 1000 * 60,
      retry: false,
    }
  );

  const payload = query.data as
    | {
        items: AdminLog[];
        total: number;
        hasMore: boolean;
        nextOffset: number | null;
      }
    | AdminLog[]
    | undefined;

  const logs = Array.isArray(payload) ? payload : payload?.items || [];
  const total = Array.isArray(payload) ? payload.length : payload?.total || 0;
  const hasMore = Array.isArray(payload) ? false : Boolean(payload?.hasMore);
  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const stats = useMemo(() => {
    return {
      total,
      pageTotal: logs.length,
      critical: logs.filter(
        log => log.severity === "critical" || log.severity === "error"
      ).length,
      warnings: logs.filter(log => log.severity === "warning").length,
      withRequestId: logs.filter(log => Boolean(log.requestId)).length,
    };
  }, [logs, total]);

  const updateFilter = (key: keyof AdminLogFilters, value: string) => {
    setFilters(current => ({ ...current, [key]: value }));
    setOffset(0);
  };

  const actions = {
    refresh: () => {
      utils.admin.logs.list.invalidate();
    },
    selectLog: (log: AdminLog) => {
      setSelectedLog(log);
    },
    clearSelection: () => {
      setSelectedLog(null);
    },
    updateFilter,
    clearFilters: () => {
      setFilters(emptyFilters);
      setDebouncedTextFilters({
        action: "",
        userId: "",
        requestId: "",
        search: "",
      });
      setOffset(0);
    },
    filterByRequestId: (requestId: string | null | undefined) => {
      if (!requestId) return;
      setFilters(current => ({ ...current, requestId }));
      setDebouncedTextFilters(current => ({ ...current, requestId }));
      setOffset(0);
    },
    nextPage: () => {
      if (hasMore) setOffset(current => current + pageSize);
    },
    previousPage: () => {
      setOffset(current => Math.max(0, current - pageSize));
    },
  };

  return {
    logs,
    total,
    pageSize,
    currentPage,
    totalPages,
    hasMore,
    isLoading: query.isLoading,
    isInitialLoading: query.isLoading && !query.data,
    isRefetching: query.isRefetching,
    error: query.error,
    detailError: detailQuery.error,
    isDetailLoading: detailQuery.isLoading || detailQuery.isFetching,
    selectedLogDetails: detailQuery.data || null,
    moduleOptions:
      modulesQuery.data && modulesQuery.data.length > 0
        ? modulesQuery.data
        : fallbackModules,
    isModulesLoading: modulesQuery.isLoading,
    stats,
    state: {
      selectedLog,
      filters,
      offset,
    },
    actions,
  };
}
