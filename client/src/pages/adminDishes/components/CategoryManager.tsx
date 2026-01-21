import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Layers, Plus, Loader2, Tags, UtensilsCrossed } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccompanimentCategoryForm } from "./AccompanimentCategoryForm"; // O form de ícones
import { CategoryList } from "./CategoryList"; // A lista de categorias de acomp.

interface Category {
  id: number;
  name: string;
  allowAccompaniments: boolean;
  isActive: boolean;
  displayOrder?: number;
}

export function CategoryManager() {
  const utils = trpc.useUtils();
  const adminProxy = trpc.admin as any;

  // Query das Categorias de Pratos
  const { data: categories, isLoading } = adminProxy.categories.list.useQuery();

  const upsert = adminProxy.categories.upsert.useMutation({
    onSuccess: () => {
      (utils.admin as any).categories.list.invalidate();
      toast.success("Configuração atualizada!");
    },
  });

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <Tabs defaultValue="menu" className="w-full space-y-6">
      <TabsList className="bg-slate-100 p-1 rounded-2xl inline-flex">
        <TabsTrigger value="menu" className="rounded-xl px-6 font-black uppercase text-[10px] gap-2">
          <UtensilsCrossed size={14} /> Categorias do Menu
        </TabsTrigger>
        <TabsTrigger value="visual" className="rounded-xl px-6 font-black uppercase text-[10px] gap-2">
          <Tags size={14} /> Ícones de Acompanhamento
        </TabsTrigger>
      </TabsList>

      {/* --- ABA 1: CATEGORIAS DE PRATOS (SEU CÓDIGO ATUAL) --- */}
      <TabsContent value="menu" className="animate-in fade-in duration-500 outline-none">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black uppercase italic">Categorias do Menu<span className="text-emerald-500">.</span></h3>
            <Button variant="outline" className="rounded-2xl border-dashed border-2 text-[10px] font-black uppercase h-10 px-4">
              <Plus size={14} className="mr-2" /> Nova Categoria de Prato
            </Button>
          </div>

          <div className="grid gap-3">
            {categories?.map((cat: Category) => (
              <div key={cat.id} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400">
                    <Layers size={18} />
                  </div>
                  <span className="text-xs font-black text-slate-700 uppercase italic">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl">
                  <Switch 
                    checked={Boolean(cat.allowAccompaniments)} 
                    onCheckedChange={(val) => upsert.mutate({ ...cat, allowAccompaniments: val })} 
                  />
                  <Label className="text-[9px] font-black uppercase text-slate-400">Permitir Acompanhamentos</Label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* --- ABA 2: CATEGORIAS DE ACOMPANHAMENTO (NOVO) --- */}
      <TabsContent value="visual" className="animate-in slide-in-from-bottom-2 duration-500 outline-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 ml-2">Nova Categoria Visual</h3>
            <AccompanimentCategoryForm onSave={() => (utils.admin as any).accompaniments.categories.list.invalidate()} />
          </div>
          <div className="md:col-span-2">
             <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 ml-2">Ícones Ativos</h3>
             <CategoryList />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}