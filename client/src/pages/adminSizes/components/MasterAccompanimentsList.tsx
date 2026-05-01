import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Apple, Plus, Loader2, Tag, Activity, Database } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { AccDrawer } from "@/components/AccDrawer"; 
import { cn } from "@/lib/utils";

export function MasterAccompanimentsList() {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const utils = trpc.useUtils();

  const { data: items, isLoading } = trpc.admin.accompaniments.options.listAll.useQuery();
  const { data: categories } = trpc.admin.accompaniments.categories.list.useQuery();

  const getSafeGroups = (config: any): any[] => {
    if (!config) return [];
    if (Array.isArray(config)) return config;
    try {
      const parsed = typeof config === 'string' ? JSON.parse(config) : config;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const upsert = trpc.admin.accompaniments.options.upsert.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.options.listAll.invalidate();
      setIsDrawerOpen(false);
      toast.success("Base de dados atualizada!");
    },
    onError: (err) => toast.error("Erro: " + err.message)
  });

  const handleCreate = () => {
    const name = prompt("Nome do novo acompanhamento:");
    if (name) {
      upsert.mutate({ 
        name: name.toUpperCase(), 
        groupsConfig: [],
        isActive: true 
      });
    }
  };

  const openNutrition = (item: any) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-4xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Apple size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase italic text-slate-800 leading-none">Banco de Itens Master</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cadastro técnico e nutricional</p>
          </div>
        </div>
        <Button onClick={handleCreate} className="h-12 bg-slate-950 hover:bg-emerald-600 rounded-2xl px-6 font-black text-[10px] uppercase gap-2 transition-all shadow-lg">
          <Plus size={16} /> Novo Acompanhamento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items?.map(item => {
          // ✅ CORREÇÃO: Verifica se qualquer coluna nutricional existe em vez de uma coluna JSON inexistente
          const hasNutrition = !!(item.energyKcal || item.proteins || item.carbs);
          
          return (
            <div key={item.id} className="group p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all flex flex-col gap-4">
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Item #{item.id}</span>
                  <h4 className="font-black uppercase text-sm italic text-slate-700 block">{item.name}</h4>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => openNutrition(item)}
                  className={cn(
                    "h-10 w-10 rounded-xl transition-all",
                    hasNutrition ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-300 hover:text-emerald-500"
                  )}
                >
                  <Activity size={18} />
                </Button>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2 mb-1">
                  <Tag size={10} className="text-slate-400" />
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Categoria Visual (Ícone)</label>
                </div>
                <select 
                  value={item.accompanimentCategoryId || ""}
                  onChange={(e) => {
                    upsert.mutate({ 
                      id: item.id,
                      name: item.name,
                      isActive: item.isActive,
                      displayOrder: item.displayOrder,
                      showNutrition: item.showNutrition,
                      // ✅ REMOVIDO: nutritionalInfo (pois o banco usa colunas planas)
                      groupsConfig: getSafeGroups(item.groupsConfig),
                      accompanimentCategoryId: Number(e.target.value) || null 
                    });
                  }}
                  className="w-full bg-slate-50 border-none rounded-xl h-10 text-[10px] font-black uppercase px-4 cursor-pointer focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  <option value="">Sem Categoria (Nenhum Ícone)</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {hasNutrition && (
                <div className="flex items-center gap-2 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase text-emerald-700">Tabela Nutricional Ativa</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AccDrawer 
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        acc={selectedItem}
        onSubmit={(nutritionData: any) => {
          // ✅ CORREÇÃO: Mapeia o objeto do Drawer para as colunas planas do seu Schema
          upsert.mutate({ 
            id: selectedItem.id,
            name: selectedItem.name,
            isActive: selectedItem.isActive,
            displayOrder: selectedItem.displayOrder,
            accompanimentCategoryId: selectedItem.accompanimentCategoryId,
            groupsConfig: getSafeGroups(selectedItem.groupsConfig),
            
            // Colunas Planas
            energyKcal: Number(nutritionData.energyKcal),
            proteins: String(nutritionData.proteins),
            carbs: String(nutritionData.carbs),
            fatTotal: String(nutritionData.fatTotal),
            showNutrition: true
          });
        }}
      />
    </div>
  );
}