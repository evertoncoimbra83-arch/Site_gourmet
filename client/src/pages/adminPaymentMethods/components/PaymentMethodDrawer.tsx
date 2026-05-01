import React, { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetTitle,
  SheetHeader,
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Image as ImageIcon, Wallet, PlusCircle, Camera } from "lucide-react";

// ✅ Import atualizado para o componente global de nuvem
import { MediaPickerModal } from "@/components/MediaPickerModal";
import { cn } from "@/lib/utils";

// --- INTERFACES ---

interface PaymentMethod {
  id?: string | number;
  name: string;
  discountPercentage?: string | number;
  discount_percentage?: string | number;
  description?: string;
  icon?: string;
  brandName?: string;
  brand_name?: string;
  brandLogoUrl?: string;
  brand_logo_url?: string;
}

interface PaymentMethodDrawerProps {
  open: boolean;
  onClose: () => void;
  method: PaymentMethod | null;
  onSubmit: (payload: Record<string, unknown>) => void;
  isPending: boolean;
}

export function PaymentMethodDrawer({ open, onClose, method, onSubmit, isPending }: PaymentMethodDrawerProps) {
  const [formData, setFormData] = useState({
    name: "", 
    discountPercentage: "0", 
    description: "", 
    icon: "", 
    brandName: "", 
    brandLogoUrl: ""
  });

  const [isMediaOpen, setIsMediaOpen] = useState(false);

  /**
   * ✅ Utilitário de URL Blindado (Cloudinary + Local)
   */
  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return "";
    
    // Se for Cloudinary ou base64, retorna direto
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    
    // Limpeza de paths locais legados
    const cleanPath = url
      .replace(/^\/?public\//, "")
      .replace(/^\//, "");

    const apiBase = (import.meta.env.VITE_API_URL as string || "").replace(/\/$/, "");
    
    return cleanPath.includes('uploads/') 
      ? `${apiBase}/${cleanPath}` 
      : `${apiBase}/uploads/${cleanPath}`;
  };

  useEffect(() => {
    if (open) {
      if (method) {
        setFormData({
          name: method.name || "",
          discountPercentage: (method.discount_percentage ?? method.discountPercentage ?? "0").toString(),
          description: method.description || "",
          icon: method.icon || "",
          brandName: method.brand_name ?? method.brandName ?? "",
          brandLogoUrl: method.brand_logo_url ?? method.brandLogoUrl ?? ""
        });
      } else {
        setFormData({ name: "", discountPercentage: "0", description: "", icon: "", brandName: "", brandLogoUrl: "" });
      }
    }
  }, [method, open]);

  const handleImageSelect = (url: string) => {
    setFormData(prev => ({ ...prev, brandLogoUrl: url }));
    setIsMediaOpen(false);
  };

  const handleSubmit = () => {
    const payload = {
      name: formData.name,
      description: formData.description,
      icon: formData.icon,
      brand_name: formData.brandName,
      brand_logo_url: formData.brandLogoUrl, // ✅ Enviamos a URL completa (Cloudinary amigável)
      discount_percentage: parseFloat(formData.discountPercentage) || 0,
    };
    
    onSubmit(payload);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 border-none bg-[#F8FAFC] flex flex-col h-screen outline-none z-100 text-left">
        
        {/* HEADER */}
        <SheetHeader className="p-8 md:p-10 bg-white border-b border-slate-100 shrink-0 text-left">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <Wallet size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Financeiro & Checkout</span>
          </div>
          <SheetTitle className="text-3xl font-black uppercase text-slate-900 tracking-tighter italic leading-none text-left">
            {method ? "Editar" : "Novo"} <span className="text-emerald-600">Pagamento</span>
          </SheetTitle>
          <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 text-left">
            Configure descontos e a logo que aparece para o cliente no checkout.
          </SheetDescription>
        </SheetHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10 space-y-10 pb-32 text-left">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
            <div className="space-y-2 text-left">
              <Label className="font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Método *</Label>
              <Input 
                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg focus-visible:ring-emerald-500" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Ex: PIX"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label className="font-black uppercase text-[9px] tracking-[0.2em] text-slate-400 text-center">Desconto (%)</Label>
              <Input 
                type="number" 
                className="h-14 rounded-2xl bg-slate-50 border-none font-black text-xl text-emerald-600 text-center focus-visible:ring-emerald-500" 
                value={formData.discountPercentage} 
                onChange={e => setFormData({...formData, discountPercentage: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-4 text-left">
            <Label className="font-black uppercase text-[10px] tracking-widest text-slate-400 ml-1 flex items-center gap-2">
              <ImageIcon size={14} /> Logo da Bandeira
            </Label>
            
            <div 
              onClick={() => setIsMediaOpen(true)}
              className={cn(
                "group relative h-48 w-full rounded-4xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-white",
                formData.brandLogoUrl ? "border-emerald-200 shadow-inner" : "border-slate-200 hover:border-emerald-500"
              )}
            >
              {formData.brandLogoUrl ? (
                <div className="relative w-full h-full flex items-center justify-center bg-slate-50/50">
                  <img 
                    src={getImageUrl(formData.brandLogoUrl)} 
                    className="h-full w-full object-contain p-6 transition-transform group-hover:scale-105" 
                    alt="Preview"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/400x400/f1f5f9/cbd5e1?text=Erro+no+Link";
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                     <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-xl">
                        <Camera size={14} className="text-emerald-600" />
                        <span className="text-slate-900 text-[10px] font-black uppercase tracking-widest">Alterar Logo</span>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <PlusCircle size={32} className="mx-auto text-slate-200 group-hover:text-emerald-500 transition-colors" />
                  <p className="text-[10px] font-black uppercase text-slate-400 group-hover:text-slate-600">Escolher na Biblioteca</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 bg-white p-8 rounded-4xl border border-slate-100 shadow-sm text-left">
            <div className="space-y-2">
              <Label className="font-black uppercase text-[9px] text-slate-400 ml-1">Descrição Comercial</Label>
              <Textarea 
                className="rounded-2xl bg-slate-50 border-none font-medium h-24 p-4 resize-none focus-visible:ring-emerald-500" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Ex: Pagamento instantâneo com aprovação imediata."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-300 ml-1">Bandeira</Label>
                <Input placeholder="Ex: Visa" value={formData.brandName} onChange={e => setFormData({...formData, brandName: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold focus-visible:ring-emerald-500" />
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-300 ml-1">Ícone CSS</Label>
                <Input placeholder="Opcional" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold focus-visible:ring-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 md:p-10 bg-white border-t border-slate-100 shrink-0 flex gap-4 text-left">
          <Button variant="ghost" onClick={onClose} className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase text-slate-400 hover:bg-slate-50">
            Descartar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isPending} 
            className="flex-[2] h-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[11px] shadow-xl transition-all active:scale-95"
          >
            {isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
            {method ? "Salvar Alterações" : "Criar Método"}
          </Button>
        </div>

        <MediaPickerModal 
          open={isMediaOpen} 
          onClose={() => setIsMediaOpen(false)} 
          onSelect={handleImageSelect} 
          defaultFolder="logo"
        />
      </SheetContent>
    </Sheet>
  );
}