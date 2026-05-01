import React from "react";
import { BookOpen, LayoutGrid, Trash2, Pencil, Loader2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";

// ✅ Interfaces estritas para evitar o uso de 'any'
interface TemplateOption {
  id: string;
  name: string;
}

interface TemplateGroup {
  id: string;
  options?: TemplateOption[];
}

interface TemplateMeal {
  id: string;
  groups?: TemplateGroup[];
}

interface TemplateDataStructure {
  meals?: TemplateMeal[];
}

interface PrescriptionTemplate {
  id: string;
  name: string;
  description?: string | null;
  totalKcalTarget?: number | null;
  data: unknown; // O JSON bruto do banco
  createdAt: string | Date;
}

interface TemplateListProps {
  templates: PrescriptionTemplate[] | undefined;
  isLoading: boolean;
  onEdit: (template: PrescriptionTemplate) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function TemplateList({ templates, isLoading, onEdit, onDelete, onCreate }: TemplateListProps) {
  
  /**
   * ✅ Função de contagem revisada:
   * Trata o dado como string ou objeto e percorre a árvore meals -> groups -> options
   */
  const countTotalDishes = (rawData: unknown): number => {
    if (!rawData) return 0;

    try {
      // 1. Tenta fazer o parse se for string, senão assume que já é objeto
      const parsed: TemplateDataStructure = typeof rawData === 'string' 
        ? JSON.parse(rawData) 
        : (rawData as TemplateDataStructure);

      // 2. Garante que meals existe e é um array
      const meals = parsed?.meals;
      if (!Array.isArray(meals)) return 0;

      // 3. Soma as opções de todos os grupos de todas as refeições
      return meals.reduce((total, meal) => {
        const groups = meal.groups || [];
        const mealDishes = groups.reduce((groupTotal, group) => {
          return groupTotal + (group.options?.length || 0);
        }, 0);
        return total + mealDishes;
      }, 0);

    } catch (error) {
      console.error("Erro ao processar contagem de pratos:", error);
      return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center w-full gap-4">
        <Loader2 className="animate-spin text-amber-500" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carregando Biblioteca...</p>
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-4xl bg-white/50">
        <BookOpen className="mx-auto text-slate-300 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Sua biblioteca está vazia</p>
        <Button onClick={onCreate} variant="outline" className="rounded-xl font-black text-[10px] uppercase shadow-sm">
          Criar primeiro modelo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => {
          const totalDishes = countTotalDishes(template.data);

          return (
            <div 
              key={template.id} 
              className="group p-8 bg-white border border-slate-100 rounded-4xl shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col"
            >
              {/* Badge de Quantidade de Pratos */}
              <div className="absolute top-0 right-0 bg-slate-900 text-white px-5 py-2 rounded-bl-3xl flex items-center gap-2 shadow-lg z-10">
                <Utensils size={10} className="text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-tighter">
                  {totalDishes} {totalDishes === 1 ? 'Prato' : 'Pratos'}
                </span>
              </div>

              <div className="flex flex-col h-full text-left">
                <div className="flex justify-between items-start mb-6">
                  <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-inner">
                    <LayoutGrid size={28} strokeWidth={2.5} />
                  </div>
                  
                  <button 
                    onClick={() => onDelete(template.id)} 
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    title="Excluir Modelo"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex-1">
                  <h4 className="font-black text-xl text-slate-800 uppercase italic mb-2 line-clamp-1 tracking-tighter">
                    {template.name}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-2 min-h-7.5 mb-8">
                    {template.description || "Modelo de prescrição pré-configurado."}
                  </p>
                </div>

                <Button 
                  onClick={() => onEdit(template)} 
                  className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-amber-500 text-white font-black uppercase text-[11px] tracking-widest gap-3 transition-all shadow-lg shadow-slate-200"
                >
                  <Pencil size={16} strokeWidth={3} /> Editar Modelo
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}