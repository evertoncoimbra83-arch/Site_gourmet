// pages/nutri/components/Dashboard/ClientList.tsx
import React, { useState } from "react";
import { 
  User as UserIcon, 
  Loader2, 
  ChevronDown, 
  Plus, 
  Edit3, 
  Trash2, 
  FileText,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Prescription {
  id: string;
  planName: string;
  createdAt: string | Date;
  status: string;
}

interface ClientListItem {
  id: string;
  client: Client;
  prescriptions: Prescription[];
}

interface ClientListProps {
  clients: ClientListItem[] | undefined;
  isLoading: boolean;
  onOpen: (id: string, name: string, diet: Prescription | null) => void;
  onDeletePrescription?: (id: string) => void;
}

export function ClientList({ clients, isLoading, onOpen, onDeletePrescription }: ClientListProps) {
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-20 flex justify-center w-full">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }
  
  if (!clients?.length) {
    return (
      <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-4xl bg-white/50">
        <Users className="mx-auto text-slate-300 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          Nenhum paciente vinculado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {clients.map((item) => {
        if (!item.client) return null;
        const isExpanded = expandedClientId === item.client.id;
        

        // ✅ GARANTIA DE 4 SLOTS: Criamos o array de tamanho 4 SEMPRE
        const prescriptionsArray = Array.isArray(item.prescriptions) ? item.prescriptions : [];
        const slots = [0, 1, 2, 3].map(i => prescriptionsArray[i] || null);

        return (
          <div 
            key={item.id} 
            className={cn(
              "bg-white rounded-3xl border-2 transition-all overflow-hidden",
              isExpanded ? "border-emerald-200 shadow-xl" : "border-slate-100 shadow-sm"
            )}
          >
            {/* HEADER */}
            <div 
              onClick={() => setExpandedClientId(isExpanded ? null : item.client.id)}
              className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-5">
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-colors",
                  isExpanded ? "bg-emerald-500 text-white border-emerald-400" : "bg-slate-50 text-slate-400 border-slate-100"
                )}>
                  <UserIcon size={24} />
                </div>
                <div className="text-left">
                  <h4 className="font-black text-lg text-slate-800 uppercase italic leading-none">
                    {item.client.name}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 block">
                    {item.client.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={cn("transition-transform duration-300", isExpanded && "rotate-180")}>
                  <ChevronDown size={20} className="text-slate-400" />
                </div>
              </div>
            </div>

            {/* CONTEÚDO EXPANSÍVEL */}
            {isExpanded && (
              <div className="p-6 pt-0 border-t-2 border-slate-50 bg-slate-50/30 space-y-4">
                <div className="flex items-center gap-2 pt-4">
                   <FileText size={12} className="text-slate-400" />
                   <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-left">
                     Slots de Prescrição (Máximo 4)
                   </span>
                </div>

                {/* ✅ GRID FORÇADO: grid-cols-2 no mobile, grid-cols-4 no desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                  {slots.map((p, index) => (
                    p ? (
                      <div 
                        key={p.id} 
                        className="flex flex-col justify-between p-4 bg-white rounded-2xl border-2 border-slate-100 group hover:border-emerald-300 transition-all shadow-sm h-36"
                      >
                        <div className="text-left">
                          <div className={cn(
                            "h-1.5 w-6 rounded-full mb-2",
                            p.status === 'active' ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-slate-300"
                          )} />
                          <p className="font-black uppercase italic text-[10px] text-slate-700 leading-tight line-clamp-2">
                            {p.planName}
                          </p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => onOpen(item.client.id, item.client.name, p)} className="flex-1 h-8 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg text-slate-600 flex items-center justify-center transition-all"><Edit3 size={14} /></button>
                          <button onClick={() => onDeletePrescription?.(p.id)} className="h-8 w-8 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg text-red-500 flex items-center justify-center transition-all"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ) : (
                      <button
                        key={`empty-${index}`}
                        onClick={() => onOpen(item.client.id, item.client.name, null)}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 text-slate-300 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all h-36 group"
                      >
                        <div className="h-8 w-8 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Plus size={16} strokeWidth={3} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tighter">Vazio</span>
                      </button>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}