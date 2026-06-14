import React, { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Info, HelpCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// ✅ Interface alinhada
interface CategoryItem {
  id: string | number;
  name: string;
  iconKey?: string | null;
  color?: string | null;
  displayOrder?: number;
}

export function CategoryList() {
  const utils = trpc.useUtils();
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  // ✅ Busca a lista de categorias
  const { data: categories, isLoading } = trpc.admin.categories.list.useQuery();

  /**
   * ✅ FIX TS2339: Alterado de .remove para .delete para bater com o router do backend
   * ✅ FIX TS7006: Tipagem do erro para evitar 'any' implícito
   */
  const deleteMutation = trpc.admin.categories.delete.useMutation({
    onSuccess: () => {
      // Invalida a lista para atualizar a UI automaticamente
      utils.admin.categories.list.invalidate();
      toast.success("Categoria removida com sucesso!");
    },
    onError: (err: { message: string }) => {
      toast.error("Erro ao remover: " + err.message);
    }
  });

  if (isLoading) {
    return (
      <div className="py-10 flex justify-center">
        <Loader2 className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="mx-2 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2rem] p-10 flex flex-col items-center justify-center text-slate-400">
        <Info size={32} strokeWidth={1} className="mb-2 opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-widest text-center">Nenhuma categoria cadastrada</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-2 md:px-0">
      {(categories as unknown as CategoryItem[]).map((cat) => {
        // ✅ Acesso seguro via keyof typeof LucideIcons
        const iconName = cat.iconKey as keyof typeof LucideIcons;
        const IconComponent = (LucideIcons[iconName] as React.ElementType) || HelpCircle;

        const colorClasses: Record<string, string> = {
          red: "text-red-500 bg-red-50 border-red-100",
          amber: "text-amber-500 bg-amber-50 border-amber-100",
          emerald: "text-emerald-500 bg-emerald-50 border-emerald-100",
          blue: "text-blue-500 bg-blue-50 border-blue-100",
          slate: "text-slate-500 bg-slate-50 border-slate-100",
        };

        return (
          <div
            key={cat.id}
            className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all group overflow-hidden w-full"
          >
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className={cn(
                "w-12 h-12 shrink-0 rounded-[1.2rem] flex items-center justify-center border transition-all",
                colorClasses[cat.color || "slate"]
              )}>
                <IconComponent size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-black uppercase text-[11px] md:text-xs text-slate-800 italic leading-none truncate">
                  {cat.name}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-tighter truncate opacity-80">
                   {cat.iconKey} • Ordem: {cat.displayOrder ?? 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deleteMutation.isPending}
                  onClick={() => setCategoryToDelete(cat)}
                  className="h-10 w-10 rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  {deleteMutation.isPending ? (
                      <Loader2 className="animate-spin" size={16} />
                  ) : (
                      <Trash2 size={18} />
                  )}
                </Button>
            </div>
          </div>
        );
      })}

      <ConfirmDialog
        open={categoryToDelete !== null}
        title="Excluir Categoria"
        description={categoryToDelete ? `Deseja realmente excluir a categoria "${categoryToDelete.name}"?` : ""}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        destructive={true}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (categoryToDelete) {
            deleteMutation.mutate({ id: Number(categoryToDelete.id) });
            setCategoryToDelete(null);
          }
        }}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}