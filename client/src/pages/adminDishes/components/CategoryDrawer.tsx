import React, { useEffect, useState } from "react"; 
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast"; 
import { 
  Beef, Apple, Leaf, Soup, Utensils, Check,
  PiggyBank, Drumstick, Fish, Pizza 
} from "lucide-react"; 
import { cn } from "@/lib/utils";

// --- INTERFACES ---

// ✅ Ajustado para alinhar com o retorno do backend
interface Category {
  id: number; // No banco é sempre number
  name: string;
  iconKey: string | null;
  color: string | null;
  isActive: boolean;
  displayOrder: number;
}

// ✅ Interface de formulário compatível com o input do tRPC
interface CategoryFormData {
  id?: number; 
  name: string;
  iconKey: string;
  color: string;
  isActive: boolean;
  displayOrder: number;
}

const AVAILABLE_ICONS = [
  { key: "Beef", icon: Beef, label: "Vaca" },
  { key: "Drumstick", icon: Drumstick, label: "Frango" },
  { key: "Fish", icon: Fish, label: "Peixe" },
  { key: "PiggyBank", icon: PiggyBank, label: "Porco" },
  { key: "Utensils", icon: Utensils, label: "Massas" },
  { key: "Leaf", icon: Leaf, label: "Vegetariano" },
  { key: "Soup", icon: Soup, label: "Sopas" },
  { key: "Pizza", icon: Pizza, label: "Pizzas" },
  { key: "Apple", icon: Apple, label: "Doces" },
];

const COLORS = [
  { key: "slate", bg: "bg-slate-100", text: "text-slate-500" },
  { key: "emerald", bg: "bg-emerald-100", text: "text-emerald-500" },
  { key: "amber", bg: "bg-amber-100", text: "text-amber-500" },
  { key: "red", bg: "bg-red-100", text: "text-red-500" },
  { key: "blue", bg: "bg-blue-100", text: "text-blue-500" },
];

interface CategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
}

export function CategoryDrawer({ open, onClose, category }: CategoryDrawerProps) {
  const [formData, setFormData] = useState<CategoryFormData>({ 
    name: "", 
    iconKey: "Beef", 
    color: "slate",
    isActive: true,
    displayOrder: 0
  });
  
  const utils = trpc.useUtils();

  useEffect(() => {
    if (open) {
      if (category) {
        setFormData({
          id: Number(category.id), // ✅ Garante que seja number
          name: category.name,
          iconKey: category.iconKey || "Beef",
          color: category.color || "slate",
          isActive: category.isActive ?? true,
          displayOrder: category.displayOrder ?? 0
        });
      } else {
        setFormData({ name: "", iconKey: "Beef", color: "slate", isActive: true, displayOrder: 0 });
      }
    }
  }, [category, open]);

  const upsert = trpc.admin.categories.upsert.useMutation({
    onSuccess: () => {
      utils.admin.categories.list.invalidate();
      toast.success(category ? "Categoria atualizada!" : "Categoria criada!");
      onClose();
    },
    onError: (err) => toast.error("Erro ao salvar: " + err.message)
  });

  // ✅ Função de envio tipada corretamente para evitar casts inseguros
  const handleSubmit = () => {
    if (!formData.name) return;
    
    // O tRPC agora reconhece o formData diretamente sem precisar de 'as any' ou 'as unknown'
    upsert.mutate(formData);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 border-none bg-white flex flex-col shadow-2xl">
        <SheetHeader className="p-8 pb-4 shrink-0 text-left">
          <SheetTitle className="text-2xl font-black uppercase italic text-slate-900">
            {category ? "Editar" : "Nova"} Categoria<span className="text-emerald-500">.</span>
          </SheetTitle>
          <SheetDescription className="text-[10px] font-bold uppercase text-slate-400">
            Configure o nome, ícone e a cor de destaque para o site.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-8 custom-scrollbar text-left">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome da Categoria</Label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="Ex: Carne de Vaca"
              className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Escolha o Ícone</Label>
            <div className="grid grid-cols-3 gap-3">
              {AVAILABLE_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = formData.iconKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFormData({...formData, iconKey: item.key})}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-[1.5rem] border-2 transition-all gap-2",
                      isSelected 
                        ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100" 
                        : "border-slate-50 bg-slate-50 hover:bg-white hover:border-slate-200"
                    )}
                  >
                    <IconComp size={24} className={isSelected ? "text-emerald-600" : "text-slate-400"} />
                    <span className={cn("text-[8px] font-black uppercase", isSelected ? "text-emerald-700" : "text-slate-400")}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cor de Destaque</Label>
            <div className="flex flex-wrap gap-4">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setFormData({...formData, color: c.key})}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-4",
                    c.bg,
                    formData.color === c.key ? "border-slate-900 scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  {formData.color === c.key && <Check size={20} className={c.text} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t mt-auto">
          <Button 
            disabled={upsert.isPending || !formData.name}
            onClick={handleSubmit}
            className="w-full h-16 rounded-[1.8rem] bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-emerald-600 transition-all text-xs shadow-xl"
          >
            {upsert.isPending ? "Salvando..." : "Salvar Categoria"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}