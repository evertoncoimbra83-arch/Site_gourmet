import React, { useEffect, useMemo, useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Loader2, Search, UserPlus, X, User } from "lucide-react";

// --- INTERFACES REFINADAS ---
interface CustomerAddress {
  street: string;
  number: string;
  neighborhood: string;
  complement?: string | null;
  city: string;
  state: string;
  zipCode: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: CustomerAddress | null;
  availablePoints?: number;
}

interface Props {
  selected?: Customer | null;
  onSelect: (selection: Customer | null) => void;
  isSinglePageView?: boolean;
}

function useDebouncedValue<T>(value: T, delayMs = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function StepCustomer({ selected, onSelect, isSinglePageView }: Props) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [page, setPage] = useState(1);

  // 🔴 DEBUG PARA RASTREAR O CLIENTE
  useEffect(() => {
    if (selected) {
      ;
    }
  }, [selected]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const query = trpc.admin.usersAdmin.list.useQuery(
    {
      page,
      limit: 10,
      search: debouncedSearch.trim().length >= 2 ? debouncedSearch.trim() : null,
    },
    {
      enabled: debouncedSearch.trim().length >= 2,
    }
  );

  const listToRender = useMemo<Customer[]>(() => {
    const data = query.data as any;
    return Array.isArray(data?.items) ? data.items : [];
  }, [query.data]);

  return (
    <div className={cn("space-y-4 animate-in fade-in duration-500", isSinglePageView ? "p-4" : "space-y-6")}>
      
      {/* CARD DE CLIENTE SELECIONADO */}
      {selected ? (
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-[1.8rem] flex items-center justify-between animate-in zoom-in-95 duration-300 shadow-sm shadow-emerald-100/50 text-left">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg shadow-emerald-200">
              {/* Ícone de usuário caso não tenha foto */}
              <User size={20} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-emerald-600 tracking-[0.2em] mb-0.5">Cliente Identificado</p>
              <h4 className="font-black text-slate-900 uppercase tracking-tighter text-sm">
                {selected.name || "Cliente sem nome"}
              </h4>
              <p className="text-[10px] font-bold text-slate-500 italic">
                {selected.email || selected.phone || "Dados de contato não importados"}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            type="button"
            onClick={() => onSelect(null)} 
            className="text-emerald-400 hover:text-red-500 hover:bg-red-50 rounded-full h-10 w-10 transition-colors"
          >
            <X size={20} />
          </Button>
        </div>
      ) : (
        /* CAMPO DE BUSCA (Só aparece se não houver cliente selecionado) */
        <div className="space-y-4">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome ou e-mail..."
              className="pl-12 h-14 rounded-2xl border-slate-100 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs font-bold uppercase placeholder:text-slate-300"
            />
          </div>

          {/* LISTA DE RESULTADOS */}
          {search.trim().length >= 2 && (
            <div className="rounded-[2rem] border border-slate-100 overflow-hidden bg-white shadow-2xl animate-in slide-in-from-top-2 duration-300 text-left">
              {query.isLoading ? (
                <div className="p-10 flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-emerald-500" size={24} />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Consultando Base...</span>
                </div>
              ) : listToRender.length === 0 ? (
                <div className="p-10 text-center space-y-4">
                  <p className="text-[10px] font-black uppercase text-slate-400">Nenhum cliente encontrado</p>
                  <Button size="sm" variant="outline" className="rounded-xl h-10 border-dashed border-slate-200 text-[10px] font-black uppercase hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200">
                    <UserPlus size={14} className="mr-2"/> Novo Cadastro
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-[350px] overflow-y-auto custom-scrollbar">
                  {listToRender.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => {
                          onSelect(c);
                          setSearch(""); 
                      }}
                      className="w-full text-left px-8 py-5 hover:bg-emerald-50/50 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-black text-slate-900 uppercase text-xs tracking-tight group-hover:text-emerald-600 transition-colors">{c.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 italic mt-0.5">{c.email || c.phone}</div>
                      </div>
                      <div className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all">
                        <Check size={14} className="text-white opacity-0 group-hover:opacity-100" strokeWidth={3} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* RODAPÉ E ESTADOS VAZIOS */}
      {!isSinglePageView && !selected && search.trim().length < 2 && (
        <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
           <Search size={32} className="mx-auto text-slate-200 mb-4" />
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aguardando pesquisa de cliente</p>
        </div>
      )}
      
      {!isSinglePageView && selected && (
        <Button
          onClick={() => onSelect(selected)}
          className="w-full h-16 rounded-[1.5rem] font-black uppercase text-sm tracking-widest bg-slate-900 hover:bg-emerald-600 text-white shadow-xl transition-all"
        >
          Confirmar e continuar
        </Button>
      )}
    </div>
  );
}