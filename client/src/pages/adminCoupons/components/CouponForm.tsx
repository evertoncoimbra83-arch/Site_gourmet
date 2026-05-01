import React from "react"; 
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ImagePlus, Palette, Loader2, Save, Ticket, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
// ✅ IMPORT CORRIGIDO: Usando o novo componente global de mídia
import { MediaPickerModal } from "@/components/MediaPickerModal";

// --- INTERFACES ---
interface CouponFormState {
  id?: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string | number;
  minOrderValue: string | number;
  usageLimit: string | number;
  description: string;
  logoUrl: string;
  bannerColor: string;
}

interface CouponFormProps {
  state: {
    formState: CouponFormState;
    isMediaModalOpen: boolean;
  };
  actions: {
    setFormState: React.Dispatch<React.SetStateAction<CouponFormState>>;
    setMediaModalOpen: (open: boolean) => void;
    handleSelectMedia: (url: string) => void;
    resetForm: () => void;
    handleSubmit: () => void;
  };
  mutations?: {
    isPending?: boolean;
    createCoupon?: { isPending: boolean };
    updateCoupon?: { isPending: boolean };
  };
}

export function CouponForm({ state, actions, mutations }: CouponFormProps) {
  if (!state?.formState || !actions) return null;

  const { formState } = state;
  const isPending = mutations?.isPending || 
                    mutations?.createCoupon?.isPending || 
                    mutations?.updateCoupon?.isPending || 
                    false;

  // ✅ RESOLUÇÃO DE URL (Suporta Cloudinary e Legado)
  const getPreviewUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
    const cleanPath = url.replace(/^\/?public\//, "").replace(/^\//, "");
    return `${apiBase}/${cleanPath}`;
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col lg:flex-row gap-8 md:gap-10">
        
        {/* IDENTIDADE VISUAL */}
        <div className="w-full lg:w-1/4 flex flex-col sm:flex-row lg:flex-col items-center gap-6 lg:border-r lg:border-slate-100 lg:pr-8">
          
          <div className="space-y-3 w-full text-center sm:text-left lg:text-center flex-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block italic">Logo da Campanha</Label>
            <div className="relative group mx-auto sm:mx-0 lg:mx-auto h-28 w-28 md:h-32 md:w-32">
              <button 
                type="button"
                onClick={() => actions.setMediaModalOpen(true)}
                className={cn(
                  "h-full w-full rounded-4xl bg-slate-50 border-2 border-dashed flex items-center justify-center overflow-hidden transition-all shadow-inner relative",
                  formState.logoUrl ? "border-emerald-200" : "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30"
                )}
              >
                {formState.logoUrl ? (
                  <>
                    <img 
                      src={getPreviewUrl(formState.logoUrl) || ""} 
                      className="w-full h-full object-contain p-3 z-10 animate-in fade-in zoom-in duration-300" 
                      alt="Preview Cupom" 
                      onError={(e) => { 
                        e.currentTarget.src = "https://placehold.co/200x200?text=Logo+Invalida"; 
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 backdrop-blur-[1px]">
                       <Camera size={16} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Ticket size={24} className="text-slate-200" />
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Biblioteca</span>
                  </div>
                )}
              </button>
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 p-2 rounded-xl shadow-xl text-white z-30 border-2 border-white pointer-events-none group-hover:scale-110 transition-transform">
                  <ImagePlus size={14} />
              </div>
            </div>
          </div>

          <div className="space-y-3 w-full flex-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block text-center sm:text-left lg:text-center italic">Visual do Card</Label>
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-sm w-full">
              <div 
                className="h-10 w-10 shrink-0 rounded-xl shadow-md border border-white/40 relative overflow-hidden"
                style={{ backgroundColor: formState.bannerColor || "#10b981" }}
              >
                <input 
                  type="color" 
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer scale-[3]"
                  value={formState.bannerColor || "#10b981"}
                  onChange={(e) => actions.setFormState((prev) => ({...prev, bannerColor: e.target.value}))}
                />
                <Palette size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
              </div>
              <Input 
                className="h-8 bg-transparent border-none font-mono text-[10px] font-black p-0 uppercase focus-visible:ring-0 text-slate-600 w-full" 
                value={formState.bannerColor || ""}
                onChange={(e) => actions.setFormState((prev) => ({...prev, bannerColor: e.target.value}))}
              />
            </div>
          </div>
        </div>

        {/* DADOS DO CUPOM */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
          <div className="sm:col-span-2 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Código Promocional</Label>
            <Input 
              className="h-14 md:h-16 rounded-2xl bg-slate-50 border-none font-black text-xl md:text-2xl uppercase tracking-tighter focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all" 
              placeholder="EX: NATAL2026"
              value={formState.code || ""} 
              onChange={e => actions.setFormState((prev) => ({...prev, code: e.target.value.toUpperCase()}))} 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Modelo</Label>
            <Select 
              value={formState.discountType || "percentage"} 
              onValueChange={val => actions.setFormState((prev) => ({...prev, discountType: val as "percentage" | "fixed"}))}
            >
              <SelectTrigger className="h-12 md:h-14 rounded-2xl bg-slate-50 border-none font-black uppercase text-[10px]">
                <SelectValue placeholder="Tipo..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 font-black uppercase text-[10px]">
                <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-1 italic font-black">Benefício</Label>
            <Input 
              className="h-12 md:h-14 rounded-2xl bg-emerald-50/50 border border-emerald-100 font-black text-lg text-emerald-700" 
              type="number"
              value={formState.discountValue || ""} 
              onChange={e => actions.setFormState((prev) => ({...prev, discountValue: e.target.value}))} 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Compra Mínima (R$)</Label>
            <Input 
              className="h-12 md:h-14 rounded-2xl bg-slate-50 border-none font-black" 
              type="number" 
              placeholder="0.00" 
              value={formState.minOrderValue || ""} 
              onChange={e => actions.setFormState((prev) => ({...prev, minOrderValue: e.target.value}))} 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Limite Resgates</Label>
            <Input 
              className="h-12 md:h-14 rounded-2xl bg-slate-50 border-none font-black" 
              type="number" 
              placeholder="Ilimitado" 
              value={formState.usageLimit || ""} 
              onChange={e => actions.setFormState((prev) => ({...prev, usageLimit: e.target.value}))} 
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição Comercial</Label>
            <Input 
              className="h-12 md:h-14 rounded-2xl bg-slate-50 border-none font-medium italic" 
              placeholder="Ex: Válido para compras acima de R$ 100..." 
              value={formState.description || ""} 
              onChange={e => actions.setFormState((prev) => ({...prev, description: e.target.value}))} 
            />
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-50">
        <Button 
          type="button"
          variant="ghost" 
          onClick={() => actions.resetForm()} 
          className="w-full sm:w-auto h-12 md:h-14 rounded-xl font-black uppercase text-[10px] text-slate-400"
        >
          Descartar
        </Button>
        <Button 
          type="button"
          onClick={() => actions.handleSubmit()}
          disabled={isPending}
          className="w-full sm:w-auto h-12 md:h-14 px-10 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all"
        >
          {isPending ? (
            <Loader2 className="animate-spin mr-2" size={18} />
          ) : (
            <div className="flex items-center gap-2">
              <Save size={16} /> 
              <span>{formState.id ? "Salvar Alterações" : "Lançar Campanha"}</span>
            </div>
          )}
        </Button>
      </div>

      {/* ✅ MODAL GLOBAL ATUALIZADO */}
      <MediaPickerModal 
        open={state.isMediaModalOpen || false}
        onClose={() => actions.setMediaModalOpen(false)}
        onSelect={(url: string) => {
          actions.handleSelectMedia(url);
          actions.setMediaModalOpen(false);
        }}
        defaultFolder="logo"
      />
    </div>
  );
}