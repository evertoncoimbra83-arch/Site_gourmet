import React from "react";
import { Search, Users, ChevronLeft, ChevronRight, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AdminLoyaltyUsers({ state, actions, data }: any) {
  return (
    <div className="space-y-6">
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
        <Input 
          placeholder="PESQUISAR CLIENTE POR NOME OU E-MAIL..." 
          className="h-14 w-full pl-12 rounded-[1.5rem] bg-white border-none shadow-sm font-bold text-xs uppercase" 
          value={state.search} 
          onChange={e => actions.setSearch(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.customers?.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
            <UserX size={40} className="mx-auto text-slate-200 mb-2" />
            <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Nenhum cliente encontrado</p>
          </div>
        ) : (
          data.customers?.map((c: any) => (
            <div key={c.id} onClick={() => actions.setSelectedCustomer(c)} className="bg-white rounded-3xl p-5 border border-slate-50 shadow-sm hover:shadow-md hover:border-emerald-100 cursor-pointer transition-all flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Users size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-900 uppercase italic text-base truncate leading-tight">{c.name || 'Membro'}</h3>
                <p className="text-[10px] font-bold text-slate-400 truncate">{c.email}</p>
              </div>
              <Badge className="bg-emerald-600 text-white font-black px-3 py-1 italic shrink-0 rounded-lg border-none shadow-sm shadow-emerald-200">
                {Number(c.points).toLocaleString()} PTS
              </Badge>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center bg-white px-6 py-4 rounded-[1.5rem] border border-slate-50 shadow-sm">
        <Button variant="ghost" disabled={state.page === 1} onClick={() => actions.setPage(state.page - 1)} className="font-black text-[10px] uppercase text-slate-400">
          <ChevronLeft className="mr-1" size={16}/> Anterior
        </Button>
        <span className="font-black italic text-[10px] text-slate-900 uppercase tracking-widest">Página {state.page}</span>
        <Button variant="ghost" disabled={state.page >= data.totalPages} onClick={() => actions.setPage(state.page + 1)} className="font-black text-[10px] uppercase text-slate-400">
          Próxima <ChevronRight className="ml-1" size={16}/>
        </Button>
      </div>
    </div>
  );
}