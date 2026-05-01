import React from "react";
import { Card, Title, Button } from "@tremor/react";
import { SearchX } from "lucide-react";

interface EmptyStateProps {
  syncHistory: () => void;
  isSyncing: boolean;
}

export function EmptyState({ syncHistory, isSyncing }: EmptyStateProps) {
  return (
    <Card className="p-20 flex flex-col items-center justify-center rounded-[3rem] border-dashed border-2 border-slate-200">
      <SearchX size={48} className="text-slate-300" />
      <Title className="mt-4 text-slate-400 uppercase font-black italic">Sem dados processados</Title>
      <Button onClick={syncHistory} className="mt-4 rounded-xl font-black uppercase italic tracking-widest text-xs bg-slate-900 border-none">
        {isSyncing ? "Sincronizando..." : "Processar Agora"}
      </Button>
    </Card>
  );
}