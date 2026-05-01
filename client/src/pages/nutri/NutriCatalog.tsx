import React, { useState } from "react";
import { trpc } from "@/_core/trpc";
import { 
  Utensils, Search, Plus, Loader2, 
  Edit3, Trash2, Scale, Flame 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- INTERFACES ---

interface DishSize {
  id?: number | string;
  name: string;
  weight?: string | null;
  mainDishWeight?: string | null;
}

interface CatalogDish {
  id: number;
  name: string;
  categoryName?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  availableSizes: DishSize[];
}

export function NutriCatalog() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: dishes, isLoading } = trpc.nutri.getAvailableCatalog.useQuery();

  if (isLoading) return (
    <div className="p-20 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-emerald-500" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carregando Cardápio...</p>
    </div>
  );

  return (
    <div className="p-6 space-y-8 text-left bg-slate-50/50 min-h-screen">
      
      {/* HEADER ESTILO "MASTER" */}
      <div className="flex justify-between items-end px-2">
        <div className="space-y-1 text-left">
          <h2 className="text-3xl font-black uppercase italic text-slate-900 tracking-tighter">
            Catálogo Nutri <span className="text-emerald-500">.</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Gestão de Pratos e Prescrições Ativas
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="BUSCAR PRATO..." 
              className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl w-64 font-bold text-[10px] uppercase tracking-widest focus-visible:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest h-14 px-8 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 flex gap-3 border-none"
          >
            <Plus size={18} strokeWidth={3} />
            Nova Sugestão
          </Button>
        </div>
      </div>

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {dishes?.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map((dish) => {
          // Cast seguro para a interface local
          const d = dish as unknown as CatalogDish;

          return (
            <div key={d.id} className="group p-6 bg-white border border-slate-100 rounded-4xl shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col gap-6 relative overflow-hidden text-left">
              
              {/* TAG DE CATEGORIA FLUTUANTE */}
              <div className="absolute top-6 right-6">
                <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-tighter">
                  {d.categoryName || "Geral"}
                </span>
              </div>

              <div className="flex gap-4 items-center">
                {/* MINIATURA DO PRATO */}
                <div className="h-20 w-20 rounded-3xl bg-slate-50 overflow-hidden border border-slate-100 shrink-0 group-hover:scale-105 transition-transform">
                  {d.imageUrl ? (
                    <img src={d.imageUrl} className="h-full w-full object-cover" alt={d.name} />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-300">
                      <Utensils size={32} />
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center gap-1 text-left">
                  <h4 className="font-black text-lg text-slate-800 uppercase leading-tight tracking-tighter">
                    {d.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {d.availableSizes.map((s, i) => (
                        <div key={i} title={s.name} className="h-6 w-6 rounded-full bg-emerald-500 border-2 border-white text-[8px] flex items-center justify-center text-white font-black uppercase">
                          {s.name ? s.name[0] : '?'}
                        </div>
                      ))}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2">
                      {d.availableSizes.length} Tamanhos
                    </span>
                  </div>
                </div>
              </div>

              {/* INFO DE COMPOSIÇÃO RÁPIDA */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100/50">
                  <Flame className="text-orange-500" size={16} />
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black text-slate-800 uppercase leading-none">--- Kcal</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Média Estimada</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100/50">
                  <Scale className="text-emerald-500" size={16} />
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black text-slate-800 uppercase leading-none">
                      {d.availableSizes[0]?.weight || "---"}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Peso Principal</span>
                  </div>
                </div>
              </div>

              {/* FOOTER DO CARD / AÇÕES */}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest gap-2 border-none">
                  <Edit3 size={14} strokeWidth={3} />
                  Visualizar Detalhes
                </Button>
                <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={18} />
                </Button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}