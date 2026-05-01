import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PackageSlotsEditor } from "./PackageSlotsEditor";
import { Sparkles, Package as PackageIcon, Info, Plus, Image as ImageIcon, Tag } from "lucide-react"; 
import MediaLibraryModal from "@/components/MediaLibraryModal";
import { cn } from "@/lib/utils";

export function PackageDrawer({ open, onClose, pkg, onSubmit, logic }: any) {
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  
  const imageUrl = watch("image_url");
  const pkgName = watch("name");

  // ✅ Sincronização robusta: Dispara sempre que o objeto 'pkg' ou o estado 'open' mudar
  useEffect(() => {
    if (open) {
      if (pkg) {
        reset({
          name: pkg.name || "", 
          slug: pkg.slug || "",
          base_price: String(pkg.base_price || pkg.price || "0.00"), 
          sale_price: String(pkg.salePrice || pkg.sale_price || ""),
          image_url: pkg.imageUrl || pkg.image_url || "",
          number_of_options: pkg.numberOfOptions || pkg.number_of_options || 10,
          display_order: pkg.displayOrder || pkg.display_order || 0,
        });
      } else {
        reset({ 
          name: "", 
          slug: "", 
          base_price: "0.00", 
          sale_price: "", 
          image_url: "", 
          number_of_options: 10,
          display_order: 0 
        });
      }
    }
  }, [pkg, open, reset]); // ✅ 'open' incluído para garantir o reset ao abrir

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-4xl p-0 border-none shadow-2xl bg-[#F8FAFC] flex flex-col h-screen outline-none"
      >
        
        <div className="p-8 md:p-10 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 text-slate-300 mb-2">
            <Sparkles size={18} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Configurador de Assinaturas</span>
          </div>
          <SheetHeader className="p-0 space-y-0 text-left">
            <SheetTitle className="text-3xl md:text-4xl font-black uppercase text-slate-900 tracking-tighter italic leading-none">
              {pkg ? "Editar" : "Criar"} <span className="text-emerald-600">Pacote</span><span className="text-emerald-600">.</span>
            </SheetTitle>
            <SheetDescription className="sr-only">
              Configure aqui os detalhes do plano de marmitas.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 md:p-10 space-y-12 pb-32">
            
            <form id="pkg-form" onSubmit={handleSubmit(onSubmit)} className="space-y-12">
              
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-400 ml-1">
                  <PackageIcon size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Informações do Plano</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  
                  <div className="md:col-span-12 space-y-3">
                    <Label className="font-black uppercase text-[9px] tracking-[0.2em] text-slate-400 ml-1">Capa do Pacote</Label>
                    <div 
                      onClick={() => setIsMediaOpen(true)}
                      className={cn(
                        "w-full h-40 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group",
                        imageUrl ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                      )}
                    >
                      {imageUrl ? (
                        <>
                          <img 
                            src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:3001${imageUrl}`} 
                            className="w-full h-full object-cover" 
                            alt={pkgName || "Capa"} 
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-black text-[10px] uppercase">Trocar Imagem</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={24} className="text-slate-300 mb-2" />
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Biblioteca</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-10 space-y-2">
                    <Label className="font-black uppercase text-[9px] tracking-[0.2em] text-slate-400 ml-1">Nome Comercial</Label>
                    <Input 
                      {...register("name", { required: true })} // ✅ Adicionado required nativo
                      placeholder="Ex: Kit Fit 10 Marmitas" 
                      className="rounded-2xl h-14 bg-slate-50 border-none font-bold text-lg focus:ring-2 focus:ring-emerald-500/10 shadow-none" 
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label className="font-black uppercase text-[9px] tracking-[0.2em] text-slate-400 ml-1">Ordem (#)</Label>
                    <Input 
                      {...register("display_order")} 
                      type="number"
                      className="rounded-2xl h-14 bg-slate-50 border-none font-bold text-lg text-center shadow-none" 
                    />
                  </div>
                  
                  <div className="md:col-span-4 space-y-2">
                    <Label className="font-black uppercase text-[9px] tracking-[0.2em] text-slate-400 ml-1">Preço Base (R$)</Label>
                    <Input 
                      {...register("base_price")} 
                      className="rounded-2xl h-14 bg-slate-50 border-none font-bold text-lg text-slate-500 focus:ring-2 focus:ring-emerald-500/10 shadow-none" 
                    />
                  </div>

                  <div className="md:col-span-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="font-black uppercase text-[9px] tracking-[0.2em] text-emerald-600 ml-1">Preço Promo (R$)</Label>
                      <Tag size={10} className="text-emerald-500" />
                    </div>
                    <Input 
                      {...register("sale_price")} 
                      placeholder="0.00"
                      className="rounded-2xl h-14 bg-emerald-50/50 border border-emerald-100 font-bold text-lg text-emerald-700 focus:ring-2 focus:ring-emerald-500/10 placeholder:text-emerald-200 shadow-none" 
                    />
                  </div>

                  <div className="md:col-span-4 space-y-2">
                    <Label className="font-black uppercase text-[9px] tracking-[0.2em] text-slate-400 ml-1">Total Marmitas</Label>
                    <Input 
                      {...register("number_of_options")} 
                      type="number" 
                      className="rounded-2xl h-14 bg-slate-50 border-none font-bold text-lg focus:ring-2 focus:ring-emerald-500/10 shadow-none" 
                    />
                  </div>

                  <input type="hidden" {...register("slug")} />
                  <input type="hidden" {...register("image_url")} />
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex justify-between items-end px-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Plus size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Arquitetura de Slots</span>
                    </div>
                    <h3 className="font-black uppercase italic text-2xl text-slate-900 tracking-tighter">
                      Configuração de <span className="text-emerald-600">Marmitas</span>
                    </h3>
                  </div>

                  <Button 
                    type="button" 
                    onClick={logic.actions.addSlot} 
                    className="rounded-2xl bg-white border border-slate-200 text-slate-900 font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm h-12 px-6"
                  >
                    + Adicionar Slot
                  </Button>
                </div>
                
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <PackageSlotsEditor 
                    slots={logic.state.config.slots}
                    allDishes={logic.data.allDishes}
                    allGroups={logic.data.allGroups}
                    onUpdateName={logic.actions.updateSlotName}
                    onUpdateDishes={logic.actions.updateSlotDishes}
                    onUpdateGroups={logic.actions.updateSlotGroups}
                    onRemoveSlot={logic.actions.removeSlot}
                    onReorderSlots={logic.actions.reorderSlots}
                  />
                </div>
              </div>

            </form>
          </div>
        </div>

        <div className="p-8 md:p-10 bg-white border-t border-slate-100 shrink-0 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300 italic">
            <Info size={14} />
            <p className="text-[9px] font-bold uppercase tracking-tight">O cliente montará o kit baseado nestas regras.</p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="flex-1 md:flex-none h-14 px-10 rounded-2xl font-black text-[10px] tracking-widest uppercase text-slate-400 hover:bg-slate-50"
            >
              Descartar
            </Button>
            <Button 
              form="pkg-form" 
              type="submit" 
              disabled={logic.mutations.createMutation.isPending || logic.mutations.updateMutation.isPending}
              className="flex-2 md:flex-none h-14 px-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest shadow-xl transition-all active:scale-95"
            >
              {logic.mutations.createMutation.isPending || logic.mutations.updateMutation.isPending ? "Processando..." : "Finalizar Assinatura"}
            </Button>
          </div>
        </div>

        <MediaLibraryModal 
          open={isMediaOpen} 
          onClose={() => setIsMediaOpen(false)} 
          onSelect={(url) => {
            setValue("image_url", url);
            setIsMediaOpen(false);
          }}
          selectedUrl={imageUrl}
        />

      </SheetContent>
    </Sheet>
  );
}