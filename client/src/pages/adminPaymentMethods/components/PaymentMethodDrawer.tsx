import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Image as ImageIcon, Wallet, PlusCircle } from "lucide-react";

// ✅ Import corrigido para o MediaLibraryDrawer que revisamos
import { MediaLibraryDrawer } from "../../adminMedia/view/MediaLibraryDrawer";

export function PaymentMethodDrawer({ open, onClose, method, onSubmit, isPending }: any) {
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
   * ✅ Helper para visualização local (Preview)
   */
  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return "";
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/')) {
      return url;
    }
    // Endereço do seu backend para servir o arquivo estático
    return `http://localhost:3001/uploads/${url}`;
  };

  // ✅ Sincronização ao carregar dados existentes
  useEffect(() => {
    if (open) {
      if (method) {
        setFormData({
          name: method.name || "",
          discountPercentage: (method.discount_percentage ?? method.discountPercentage ?? "0").toString(),
          description: method.description || "",
          icon: method.icon || "",
          brandName: method.brand_name ?? method.brandName ?? "",
          brandLogoUrl: getImageUrl(method.brand_logo_url ?? method.brandLogoUrl)
        });
      } else {
        setFormData({ name: "", discountPercentage: "0", description: "", icon: "", brandName: "", brandLogoUrl: "" });
      }
    }
  }, [method, open]);

  /**
   * ✅ Recebe a seleção da Galeria
   */
  const handleImageSelect = (fileName: string) => {
    // A galeria agora nos envia apenas o nome do arquivo (ex: pix.png)
    // Atualizamos o estado com a URL completa para o Preview funcionar
    const previewUrl = getImageUrl(fileName);
    
    setFormData(prev => ({ ...prev, brandLogoUrl: previewUrl }));
    setIsMediaOpen(false);
  };

  /**
   * ✅ Envio final para o Backend
   */
  const handleSubmit = () => {
    // 🔍 Limpeza final: Salvamos apenas o nome do arquivo no banco
    const cleanFileName = formData.brandLogoUrl.split('/').pop() || "";

    const payload = {
      name: formData.name,
      description: formData.description,
      icon: formData.icon,
      brand_name: formData.brandName,
      brand_logo_url: cleanFileName, 
      discount_percentage: parseFloat(formData.discountPercentage) || 0,
    };
    
    onSubmit(payload);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 border-none bg-[#F8FAFC] flex flex-col h-screen outline-none z-[100]">
        
        {/* HEADER */}
        <div className="p-8 md:p-10 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <Wallet size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Financeiro & Checkout</span>
          </div>
          <SheetTitle className="text-3xl font-black uppercase text-slate-900 tracking-tighter italic leading-none">
            {method ? "Editar" : "Novo"} <span className="text-emerald-600">Pagamento</span>
          </SheetTitle>
          <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">
            Configure descontos e a logo que aparece para o cliente.
          </SheetDescription>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10 space-y-10 pb-32">
          
          {/* NOME E DESCONTO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="space-y-2">
              <Label className="font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Método *</Label>
              <Input 
                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Ex: PIX"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-black uppercase text-[9px] tracking-[0.2em] text-slate-400 text-center">Desconto (%)</Label>
              <Input 
                type="number" 
                className="h-14 rounded-2xl bg-slate-50 border-none font-black text-xl text-emerald-600 text-center" 
                value={formData.discountPercentage} 
                onChange={e => setFormData({...formData, discountPercentage: e.target.value})} 
              />
            </div>
          </div>

          {/* PREVIEW DA LOGO */}
          <div className="space-y-4">
            <Label className="font-black uppercase text-[10px] tracking-widest text-slate-400 ml-1 flex items-center gap-2">
              <ImageIcon size={14} /> Logo da Bandeira
            </Label>
            
            <div 
              onClick={() => setIsMediaOpen(true)}
              className="group relative h-48 w-full rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center cursor-pointer transition-all hover:border-emerald-500 overflow-hidden"
            >
              {formData.brandLogoUrl ? (
                <div className="relative w-full h-full flex items-center justify-center bg-slate-50/50">
                  <img 
                    src={formData.brandLogoUrl} 
                    className="h-full w-full object-contain p-6 transition-transform group-hover:scale-105" 
                    alt="Preview"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/400x400/f1f5f9/cbd5e1?text=Erro+no+Link";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white font-black text-[10px] uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">Alterar Imagem</span>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <PlusCircle size={32} className="mx-auto text-slate-200" />
                  <p className="text-[10px] font-black uppercase text-slate-400">Escolher Logo</p>
                </div>
              )}
            </div>
          </div>

          {/* CAMPOS ADICIONAIS */}
          <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="space-y-2">
              <Label className="font-black uppercase text-[9px] text-slate-400 ml-1">Descrição Comercial</Label>
              <Textarea 
                className="rounded-2xl bg-slate-50 border-none font-medium h-24 p-4 resize-none" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Descreva as vantagens deste método..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Bandeira" value={formData.brandName} onChange={e => setFormData({...formData, brandName: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
              <Input placeholder="Ícone CSS" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 md:p-10 bg-white border-t border-slate-100 shrink-0 flex gap-4">
          <Button variant="ghost" onClick={onClose} className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase text-slate-400">
            Descartar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isPending} 
            className="flex-[2] h-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[11px] shadow-xl"
          >
            {isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
            Salvar
          </Button>
        </div>

        {/* COMPONENTE DE MÍDIA */}
        <MediaLibraryDrawer 
          open={isMediaOpen} 
          onClose={() => setIsMediaOpen(false)} 
          onSelect={handleImageSelect} 
        />
      </SheetContent>
    </Sheet>
  );
}