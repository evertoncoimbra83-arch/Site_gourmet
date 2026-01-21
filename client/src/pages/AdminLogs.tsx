import { trpc } from "@/_core/trpc";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, User as UserIcon, Activity, ArrowRight, Monitor, Loader2 } from "lucide-react";

export default function AdminLogs() {
  const { data: logs, isLoading } = trpc.admin.logs.list.useQuery({ limit: 50 });

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("AUTH")) return <Badge className="bg-blue-500 border-none hover:bg-blue-600">AUTENTICAÇÃO</Badge>;
    if (act.includes("PASSWORD")) return <Badge className="bg-amber-500 border-none hover:bg-amber-600">SEGURANÇA</Badge>;
    if (act.includes("ORDER")) return <Badge className="bg-emerald-500 border-none hover:bg-emerald-600">PEDIDO</Badge>;
    if (act.includes("MARKETING")) return <Badge className="bg-orange-500 border-none hover:bg-orange-600">MARKETING</Badge>;
    return <Badge variant="outline" className="text-[10px] uppercase font-bold">{action}</Badge>;
  };

  // ✅ Função para renderizar as mudanças de forma legível
  const renderChanges = (log: any) => {
    const oldV = log.oldValues;
    const newV = log.newValues;

    if (!newV || Object.keys(newV).length === 0) {
      return <span className="text-slate-400 text-[10px] italic font-medium">Sem dados detalhados</span>;
    }

    // Caso seja alteração de Marketing (Pedido Mínimo)
    if (log.action.includes("MARKETING")) {
      return (
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400 line-through font-medium">
              R$ {oldV?.valor || oldV?.generalMinOrderAmount || '0,00'}
            </span>
            <ArrowRight size={10} className="text-slate-300" />
            <span className="text-emerald-600 font-black">
              R$ {newV?.generalMinOrderAmount || newV?.valor}
            </span>
          </div>
          {(newV.minOrderMessage || oldV?.message) && (
            <p className="text-[9px] text-slate-400 font-bold truncate w-48 uppercase tracking-tighter">
              📝 Msg: {newV.minOrderMessage || "Alterada"}
            </p>
          )}
        </div>
      );
    }

    // Fallback genérico para outras ações (exibe JSON formatado caso não tenha regra específica)
    return (
      <div className="group relative">
        <p className="text-[10px] text-slate-500 truncate w-40 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
          {JSON.stringify(newV)}
        </p>
      </div>
    );
  };

  if (isLoading) return (
    <div className="p-20 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-orange-500" size={40} />
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Sincronizando Histórico...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center text-emerald-400 shadow-lg shadow-slate-200">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">
              Auditoria <span className="text-slate-300">do</span> Sistema
            </h2>
          </div>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest ml-12">
            Rastreamento de integridade e ações administrativas
          </p>
        </div>
        <Activity className="text-slate-100" size={64} />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 pl-8 h-14">Data/Hora</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Usuário</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Ação</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Origem (IP)</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 pr-8">Mudanças Efetuadas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.map((log) => (
              <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                <TableCell className="pl-8 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800 leading-none tracking-tighter">
                      {new Date(log.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase">
                      {new Date(log.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                      <UserIcon size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-800 leading-none">{log.user?.name || "Sistema"}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{log.user?.email || 'Ação Automatizada'}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Monitor size={12} className="text-slate-300" />
                    <span className="text-[10px] font-mono font-bold tracking-tight">
                      {log.ipAddress || "127.0.0.1"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="pr-8">
                  {renderChanges(log)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {logs?.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center gap-3">
            <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Activity size={24} />
            </div>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Nenhum log registrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}