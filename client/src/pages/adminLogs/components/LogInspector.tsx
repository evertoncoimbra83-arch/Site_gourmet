import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, User as UserIcon, Globe, Hash, Activity } from "lucide-react"; // ✅ Importado 'Activity'

// --- INTERFACES ---
interface AdminLog {
  id: number | string;
  action: string;
  createdAt: string | Date;
  ipAddress: string | null;
  user: { name: string | null; email: string | null } | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}

interface Props {
  log: AdminLog | null;
  onClose: () => void;
}

/**
 * Renderiza o JSON com cores temáticas (Estilo VS Code / Dracula)
 */
function SyntaxHighlightedJSON({ data }: { data: Record<string, unknown> | null }) {
  if (!data || Object.keys(data).length === 0) {
    return <span className="text-slate-500 italic text-[10px]">Nenhum dado registrado</span>;
  }

  return (
    <div className="font-mono text-[11px] leading-relaxed">
      {Object.entries(data).map(([key, value], index, array) => {
        const isLast = index === array.length - 1;
        
        return (
          <div key={key} className="flex flex-wrap gap-x-2">
            {/* ✅ Corrigido: Aspas escapadas com &quot; */}
            <span className="text-pink-400">&quot;{key}&quot;</span>
            <span className="text-white">:</span>
            
            {typeof value === "object" && value !== null ? (
              <div className="w-full pl-4 border-l border-slate-700/50 my-1">
                <SyntaxHighlightedJSON data={value as Record<string, unknown>} />
              </div>
            ) : (
              <span className={typeof value === "string" ? "text-emerald-400" : "text-amber-400"}>
                {typeof value === "string" ? `&quot;${value}&quot;` : String(value)}
              </span>
            )}
            {!isLast && <span className="text-slate-500">,</span>}
          </div>
        );
      })}
    </div>
  );
}

export function LogInspector({ log, onClose }: Props) {
  return (
    <Sheet open={!!log} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl border-l border-slate-100 bg-white">
        <SheetHeader className="pb-6 border-b border-slate-50">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <Terminal size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Inspector</span>
          </div>
          <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
            Log <span className="text-emerald-600">Details</span>.
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-2">
            <Hash size={10} /> ID: {log?.id} 
            <span className="mx-2 text-slate-200">|</span> 
            {log?.action}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)] mt-6 pr-4">
          <div className="space-y-8 pb-10">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 group">
                <div className="flex items-center gap-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <UserIcon size={12} />
                  <p className="text-[9px] font-black uppercase tracking-tighter">Administrador</p>
                </div>
                <p className="text-xs font-black text-slate-700 mt-2">{log?.user?.name || "Sistema"}</p>
                <p className="text-[10px] text-slate-400 truncate">{log?.user?.email || "Processo Automático"}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 group">
                <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-500 transition-colors">
                  <Globe size={12} />
                  <p className="text-[9px] font-black uppercase tracking-tighter">Origem (IP)</p>
                </div>
                <p className="text-xs font-mono font-black text-slate-700 mt-2">{log?.ipAddress || "127.0.0.1"}</p>
                <p className="text-[10px] text-slate-400">Acesso via Dashboard</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Snapshot Anterior</p>
                </div>
                <div className="p-6 bg-[#1e293b] rounded-[2rem] border border-slate-800 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10 text-white">
                    <Hash size={40} />
                  </div>
                  <SyntaxHighlightedJSON data={log?.oldValues || null} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Mudanças Efetuadas</p>
                </div>
                <div className="p-6 bg-[#0f172a] rounded-[2rem] border border-emerald-900/30 shadow-xl shadow-emerald-900/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-3 opacity-10 text-emerald-400">
                    <Activity size={40} /> {/* ✅ Activity agora está definido */}
                  </div>
                  <SyntaxHighlightedJSON data={log?.newValues || null} />
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}