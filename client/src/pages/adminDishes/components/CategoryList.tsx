import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Info } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function CategoryList() {
  const utils = trpc.useUtils();

  // 🔍 Busca as categorias de acompanhamento
  const { data: categories, isLoading } = trpc.admin.accompaniments.categories.list.useQuery();

  // 🗑️ Mutação para deletar
  const deleteMutation = trpc.admin.accompaniments.categories.delete.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.categories.list.invalidate();
      toast.success("Categoria removida!");
    },
    onError: (err) => toast.error("Erro ao remover: " + err.message)
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-slate-300" />
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-4xl p-10 flex flex-col items-center justify-center text-slate-400">
        <Info size={32} strokeWidth={1} className="mb-2" />
        <p className="text-[10px] font-black uppercase tracking-widest">Nenhum ícone cadastrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {categories.map((cat) => {
        // Renderiza o ícone dinamicamente baseado na string salva no banco
        const Icon = (LucideIcons as any)[cat.iconKey || "HelpCircle"] || LucideIcons.HelpCircle;
        
        // Mapeamento de cores simples (podemos expandir conforme o seu CSS)
        const colorClasses: Record<string, string> = {
          red: "text-red-500 bg-red-50",
          amber: "text-amber-500 bg-amber-50",
          emerald: "text-emerald-500 bg-emerald-50",
          blue: "text-blue-500 bg-blue-50",
          slate: "text-slate-500 bg-slate-50",
        };

        return (
          <div 
            key={cat.id} 
            className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[1.8rem] hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                colorClasses[cat.color || "slate"]
              )}>
                <Icon size={22} />
              </div>
              <div>
                <h4 className="font-black uppercase text-xs text-slate-700 italic leading-none">
                  {cat.name}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">
                  Chave: {cat.iconKey} • Ordem: {cat.displayOrder}
                </p>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if(confirm("Deseja realmente excluir esta categoria?")) {
                  deleteMutation.mutate({ id: cat.id });
                }
              }}
              className="h-10 w-10 rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              {deleteMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            </Button>
          </div>
        );
      })}
    </div>
  );
}