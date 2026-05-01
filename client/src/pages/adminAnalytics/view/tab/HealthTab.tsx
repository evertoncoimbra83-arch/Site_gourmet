import React from "react";
import { Card, Text, Title } from "@tremor/react";
import { AlertCircle, CheckCircle2, Database, Server, Zap } from "lucide-react";
import { trpc } from "@/_core/trpc";

function getIcon(componentId: string) {
  if (componentId === "database") return Database;
  if (componentId === "redis") return Zap;
  return Server;
}

export function HealthTab() {
  const { data, isLoading, error } = trpc.admin.health.checkStatus.useQuery(undefined, {
    refetchInterval: 30000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card className="rounded-3xl border-slate-100 shadow-sm">
        <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Verificando infraestrutura...
        </Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-3xl border-rose-100 bg-rose-50 shadow-sm">
        <div className="flex items-center gap-3 text-rose-600">
          <AlertCircle size={20} />
          <Text className="font-black uppercase tracking-widest text-[10px]">
            Falha ao consultar saude do sistema
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {(data?.components || []).map((component) => {
        const Icon = getIcon(component.id);
        const isOnline = component.status === "online";

        return (
          <Card
            key={component.id}
            className="rounded-3xl border-slate-100 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <Icon size={18} />
                  <Text className="text-[10px] font-black uppercase tracking-widest">
                    {component.id}
                  </Text>
                </div>
                <Title className="text-base font-black text-slate-900">
                  {component.name}
                </Title>
                <Text className="text-xs font-bold text-slate-400">
                  {component.latency}ms
                </Text>
              </div>
              {isOnline ? (
                <CheckCircle2 className="text-emerald-500" size={22} />
              ) : (
                <AlertCircle className="text-rose-500" size={22} />
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
