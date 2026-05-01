import React, { useState } from "react";
import { 
  Plus, Trash2, Link as LinkIcon, 
  Search 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MediaLibraryDrawer } from "../../adminMedia/view/MediaLibraryDrawer";

// --- INTERFACES ---

interface Partner {
  name: string;
  link: string;
  logo_url: string;
  discount_text: string;
}

interface CheckoutSuccessSettingsProps {
  settings: {
    partners_json?: string | Partner[];
    success_order_message?: string;
    [key: string]: unknown;
  };
  onUpdate: (field: string, value: string) => void;
}

export function CheckoutSuccessSettings({ settings, onUpdate }: CheckoutSuccessSettingsProps) {
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [activePartnerIdx, setActivePartnerIdx] = useState<number | null>(null);

  // ✅ Memoriza a lista de parceiros vinda do JSON com tipagem correta
  const partners = React.useMemo<Partner[]>(() => {
    try {
      const raw = settings?.partners_json;
      if (!raw) return [];
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch { 
      return []; 
    }
  }, [settings?.partners_json]);

  // ✅ Sincroniza a lista de parceiros com o estado global
  const updatePartners = (newList: Partner[]) => {
    onUpdate("partners_json", JSON.stringify(newList));
  };

  const addPartner = () => {
    const newPartner: Partner = { name: "Novo Parceiro", link: "", logo_url: "", discount_text: "" };
    updatePartners([...partners, newPartner]);
  };

  const removePartner = (index: number) => {
    const newList = partners.filter((_, i) => i !== index);
    updatePartners(newList);
  };

  const editPartner = (index: number, field: keyof Partner, value: string) => {
    const newList = [...partners];
    newList[index] = { ...newList[index], [field]: value };
    updatePartners(newList);
  };

  const handleOpenMedia = (index: number) => {
    setActivePartnerIdx(index);
    setIsMediaOpen(true);
  };

  /**
   * ✅ 1. TRATAMENTO AO SELECIONAR (SALVAR)
   */
  const handleLogoSelect = (url: string) => {
    if (activePartnerIdx !== null) {
      let cleanPath = url;

      if (url.includes("/uploads/")) {
         const parts = url.split("/uploads/");
         cleanPath = `uploads/${parts[parts.length - 1]}`;
      }

      editPartner(activePartnerIdx, "logo_url", cleanPath);
    }
    setIsMediaOpen(false);
    setActivePartnerIdx(null);
  };

  /**
   * ✅ 2. TRATAMENTO AO EXIBIR (LER)
   */
  const getPreviewUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;

    const baseUrl = (import.meta.env.VITE_API_URL as string || "http://localhost:3001").replace(/\/$/, "");
    
    let clean = path
      .replace(/\\/g, "/")
      .replace(/^\/?public\//, "")
      .replace(/^\//, "");

    if (clean.includes("/uploads/")) {
       clean = clean.split("/uploads/")[1];
    }

    if (!clean.startsWith("uploads/")) {
      clean = `uploads/${clean}`;
    }

    return `${baseUrl}/${clean}`;
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      
      {/* SEÇÃO 1: MENSAGEM DE SUCESSO */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 text-left">
        <div className="flex flex-col gap-1 ml-2 text-left">
          <Label className="font-black uppercase text-[9px] tracking-widest text-slate-400 text-left">
            Mensagem de Sucesso (Order Success)
          </Label>
          <p className="text-[10px] text-slate-400 italic text-left">Esta mensagem aparece no card de confirmação do pedido para o cliente.</p>
        </div>
        
        <Textarea 
          value={settings?.success_order_message || ""}
          onChange={(e) => onUpdate("success_order_message", e.target.value)}
          placeholder="Ex: Seu pedido foi recebido com sucesso! Em breve entraremos em contato via WhatsApp."
          className="min-h-[100px] rounded-2xl bg-slate-50/50 border-none font-medium text-slate-600 focus-visible:ring-4 focus-visible:ring-emerald-500/5 transition-all p-4 text-left"
        />
      </div>

      {/* SEÇÃO 2: PARCEIROS */}
      <div className="space-y-6 text-left">
        <div className="flex justify-between items-center gap-4 px-2 text-left">
          <h3 className="font-black uppercase italic text-xl text-slate-900 tracking-tighter text-left">
            Clube de <span className="text-emerald-600">Benefícios</span>
          </h3>
          <Button onClick={addPartner} className="rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[10px] h-11 px-6">
            <Plus size={16} className="mr-2" /> Adicionar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partners.map((partner, index) => (
            <div key={index} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-emerald-100 transition-all relative group text-left">
              <button 
                type="button"
                onClick={() => removePartner(index)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <Trash2 size={14} />
              </button>

              <div className="flex gap-4 text-left">
                <div 
                  onClick={() => handleOpenMedia(index)}
                  className="h-20 w-20 shrink-0 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all overflow-hidden relative"
                >
                  {partner.logo_url ? (
                    <img 
                      src={getPreviewUrl(partner.logo_url)} 
                      alt="Logo"
                      className="w-full h-full object-contain p-2" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add("bg-red-50");
                      }}
                    />
                  ) : (
                    <>
                      <Search size={16} className="text-slate-300" />
                      <span className="text-[7px] font-black uppercase text-slate-400 mt-1">Logo</span>
                    </>
                  )}
                </div>

                <div className="flex-1 space-y-3 text-left">
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="space-y-1 text-left">
                      <Label className="text-[8px] font-black uppercase text-slate-400 text-left">Nome</Label>
                      <Input 
                        value={partner.name}
                        onChange={(e) => editPartner(index, "name", e.target.value)}
                        className="h-8 rounded-lg bg-slate-50 border-none font-bold text-[10px] text-left"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <Label className="text-[8px] font-black uppercase text-emerald-600 text-left">Benefício</Label>
                      <Input 
                        value={partner.discount_text}
                        onChange={(e) => editPartner(index, "discount_text", e.target.value)}
                        className="h-8 rounded-lg bg-emerald-50/50 border-none font-bold text-[10px] text-emerald-700 text-left"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <Label className="text-[8px] font-black uppercase text-slate-400 text-left">Link</Label>
                    <div className="relative text-left">
                      <LinkIcon size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300" />
                      <Input 
                        value={partner.link}
                        onChange={(e) => editPartner(index, "link", e.target.value)}
                        className="h-8 pl-6 rounded-lg bg-slate-50 border-none font-medium text-[10px] text-blue-500 text-left"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MediaLibraryDrawer 
        open={isMediaOpen} 
        onClose={() => setIsMediaOpen(false)} 
        onSelect={handleLogoSelect}
      />
    </div>
  );
}