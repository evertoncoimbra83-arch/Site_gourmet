import React, { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast"; 
import { Layers, Plus, Loader2, UtensilsCrossed, Tags } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Componentes internos
import { CategoryDrawer } from "./CategoryDrawer"; 
import { AccompanimentCategoryForm } from "./AccompanimentCategoryForm"; 
import { CategoryList } from "./CategoryList"; 

// ✅ Interface unificada para garantir compatibilidade entre tabelas e formulários
interface MenuCategory {
  id: string | number;
  name: string;
  iconKey?: string | null;
  color?: string | null;
  isActive: boolean | number;
  displayOrder: number; 
}

export function CategoryManager() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  
  const utils = trpc.useUtils();

  /* --- QUERIES --- */
  const menuQuery = trpc.admin.categories.list.useQuery();
  const accompanimentsQuery = trpc.admin.accompaniments.categories.list.useQuery();

  /* --- MUTATIONS --- */
  const upsertMenuCat = trpc.admin.categories.upsert.useMutation({
    onSuccess: () => {
      utils.admin.categories.list.invalidate();
      // ✅ CORREÇÃO LINHA 45: Removido 'any', usado cast duplo para satisfazer o ESLint 8
      toast({ 
        title: "Sucesso", 
        description: "Categoria atualizada!" 
      } as unknown as Parameters<typeof toast>[0]);
    },
  });

  /* --- HANDLERS --- */
  const handleEditMenuCat = (cat: MenuCategory) => {
    setSelectedCategory(cat);
    setIsDrawerOpen(true);
  };

  const handleCreateMenuCat = () => {
    setSelectedCategory(null);
    setIsDrawerOpen(true);
  };

  if (menuQuery.isLoading || accompanimentsQuery.isLoading) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sincronizando banco de dados...</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="menu" className="w-full space-y-6">
      <div className="px-2 md:px-0">
        <TabsList className="bg-slate-100 p-1 rounded-2xl inline-flex mb-4 w-full md:w-auto overflow-x-auto no-scrollbar">
          <TabsTrigger value="menu" className="flex-1 md:flex-none rounded-xl px-4 md:px-6 font-black uppercase text-[9px] md:text-[10px] gap-2 data-[state=active]:bg-white whitespace-nowrap">
            <UtensilsCrossed size={14} /> Categorias do Menu
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex-1 md:flex-none rounded-xl px-4 md:px-6 font-black uppercase text-[9px] md:text-[10px] gap-2 data-[state=active]:bg-white whitespace-nowrap">
            <Tags size={14} /> Ícones Visuais
          </TabsTrigger>
        </TabsList>
      </div>

      {/* --- ABA 1: CATEGORIAS DO MENU --- */}
      <TabsContent value="menu" className="animate-in fade-in duration-500 outline-none m-0">
        <div className="bg-white rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-50 mx-2 md:mx-0 text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-2">
            <div>
              <h3 className="text-lg font-black uppercase italic text-slate-800">Menu Principal.</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Organização dos pratos no cardápio</p>
            </div>
            <Button onClick={handleCreateMenuCat} variant="outline" className="w-full sm:w-auto rounded-2xl border-dashed border-2 text-[10px] font-black h-10 px-4">
              <Plus size={14} className="mr-2" /> Nova Categoria
            </Button>
          </div>

          <div className="grid gap-3">
            {(menuQuery.data as unknown as MenuCategory[])?.map((cat) => {
              const IconComponent = cat.iconKey 
                ? (LucideIcons[cat.iconKey as keyof typeof LucideIcons] as React.ElementType) || Layers
                : Layers;

              return (
                <div key={cat.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-5 rounded-[1.8rem] bg-slate-50 border border-transparent hover:border-slate-200 transition-all group gap-4">
                  
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={cn(
                      "w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border transition-all",
                      cat.color === 'emerald' ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : 
                      cat.color === 'red' ? 'text-red-500 bg-red-50 border-red-100' : 'text-slate-400 bg-white border-slate-100'
                    )}>
                      <IconComponent size={20} />
                    </div>
                    <span className="text-xs font-black text-slate-700 uppercase italic truncate">{cat.name}</span>
                  </div>

                  <div className="flex flex-row items-center gap-2 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-2 bg-white px-3 h-10 rounded-xl border border-slate-100 shadow-sm shrink-0">
                      <Switch 
                        checked={Boolean(cat.isActive)} 
                        onCheckedChange={(val) => upsertMenuCat.mutate({ 
                          ...cat, 
                          id: Number(cat.id),
                          isActive: val 
                        } as unknown as Parameters<typeof upsertMenuCat.mutate>[0])} 
                        className="scale-75"
                      />
                      <Label className="text-[8px] font-black uppercase text-slate-400">Ativa</Label>
                    </div>

                    <Button 
                      onClick={() => handleEditMenuCat(cat)} 
                      variant="ghost" 
                      size="sm" 
                      className="h-10 px-4 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0"
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="visual" className="animate-in slide-in-from-bottom-2 duration-500 outline-none m-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start px-2 md:px-0 text-left">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-black uppercase text-slate-800 mb-6 flex items-center gap-2">
                <Plus size={14} className="text-emerald-500" /> Novo Ícone Visual
              </h3>
              <AccompanimentCategoryForm onSave={() => utils.admin.accompaniments.categories.list.invalidate()} />
            </div>
          </div>
          <div className="lg:col-span-2">
             <div className="bg-white p-4 md:p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <h3 className="text-[10px] font-black uppercase text-slate-800 mb-6 px-2">Biblioteca de Ícones Ativos</h3>
               <CategoryList />
             </div>
          </div>
        </div>
      </TabsContent>

      <CategoryDrawer 
        open={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        category={selectedCategory as unknown as Parameters<typeof CategoryDrawer>[0]['category']} 
      />
    </Tabs>
  );
}