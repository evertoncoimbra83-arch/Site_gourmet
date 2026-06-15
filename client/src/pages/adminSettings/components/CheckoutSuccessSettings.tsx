import React, { useState } from "react";
import { Plus, Trash2, Link as LinkIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MediaLibraryDrawer } from "../../adminMedia/view/MediaLibraryDrawer";
import {
  getImageFallback,
  normalizeImageUrlForStorage,
  resolveImageUrl,
} from "@shared/utils/image-url";

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

export function CheckoutSuccessSettings({
  settings,
  onUpdate,
}: CheckoutSuccessSettingsProps) {
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [activePartnerIdx, setActivePartnerIdx] = useState<number | null>(null);

  const partners = React.useMemo<Partner[]>(() => {
    try {
      const raw = settings?.partners_json;
      if (!raw) return [];
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return [];
    }
  }, [settings?.partners_json]);

  const updatePartners = (newList: Partner[]) => {
    onUpdate("partners_json", JSON.stringify(newList));
  };

  const addPartner = () => {
    const newPartner: Partner = {
      name: "Novo Parceiro",
      link: "",
      logo_url: "",
      discount_text: "",
    };
    updatePartners([...partners, newPartner]);
  };

  const removePartner = (index: number) => {
    const newList = partners.filter((_, i) => i !== index);
    updatePartners(newList);
  };

  const editPartner = (
    index: number,
    field: keyof Partner,
    value: string,
  ) => {
    const newList = [...partners];
    newList[index] = { ...newList[index], [field]: value };
    updatePartners(newList);
  };

  const handleOpenMedia = (index: number) => {
    setActivePartnerIdx(index);
    setIsMediaOpen(true);
  };

  const handleLogoSelect = (url: string) => {
    if (activePartnerIdx !== null) {
      editPartner(activePartnerIdx, "logo_url", normalizeImageUrlForStorage(url));
    }
    setIsMediaOpen(false);
    setActivePartnerIdx(null);
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 space-y-10 text-left duration-700 fade-in">
      <div className="space-y-4 rounded-[2.5rem] border border-slate-100 bg-white p-6 text-left shadow-sm md:p-8">
        <div className="ml-2 flex flex-col gap-1 text-left">
          <Label className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400">
            Mensagem de Sucesso (Order Success)
          </Label>
          <p className="text-left text-[10px] italic text-slate-400">
            Esta mensagem aparece no card de confirmacao do pedido para o
            cliente.
          </p>
        </div>

        <Textarea
          value={settings?.success_order_message || ""}
          onChange={(e) => onUpdate("success_order_message", e.target.value)}
          placeholder="Ex: Seu pedido foi recebido com sucesso! Em breve entraremos em contato via WhatsApp."
          className="min-h-[100px] rounded-2xl border-none bg-slate-50/50 p-4 text-left font-medium text-slate-600 transition-all focus-visible:ring-4 focus-visible:ring-emerald-500/5"
        />
      </div>

      <div className="space-y-6 text-left">
        <div className="flex flex-col gap-3 px-2 text-left md:flex-row md:items-start md:justify-between">
          <div className="space-y-1 text-left">
            <h3 className="text-left text-xl font-black uppercase italic tracking-tighter text-slate-900">
              Parceiros exibidos{" "}
              <span className="text-emerald-600">apos o pedido</span>
            </h3>
            <p className="text-left text-[11px] font-medium leading-relaxed text-slate-500">
              Esses cards aparecem na tela de sucesso do pedido. Eles nao
              alteram regras de pontuacao, cashback ou resgate do programa de
              fidelidade.
            </p>
          </div>
          <Button
            onClick={addPartner}
            className="h-11 rounded-xl bg-slate-900 px-6 text-[10px] font-black uppercase text-white hover:bg-emerald-600"
          >
            <Plus size={16} className="mr-2" /> Adicionar
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="group relative rounded-[2rem] border border-slate-100 bg-white p-6 text-left shadow-sm transition-all hover:border-emerald-100"
            >
              <button
                type="button"
                onClick={() => removePartner(index)}
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500 hover:text-white"
              >
                <Trash2 size={14} />
              </button>

              <div className="flex gap-4 text-left">
                <div
                  onClick={() => handleOpenMedia(index)}
                  className="relative flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-emerald-400 hover:bg-emerald-50/30"
                >
                  {partner.logo_url ? (
                    <img
                      src={resolveImageUrl(partner.logo_url, "logo")}
                      alt="Logo"
                      className="h-full w-full object-contain p-2"
                      onError={(e) => {
                        e.currentTarget.src = getImageFallback("logo");
                      }}
                    />
                  ) : (
                    <>
                      <Search size={16} className="text-slate-300" />
                      <span className="mt-1 text-[7px] font-black uppercase text-slate-400">
                        Logo
                      </span>
                    </>
                  )}
                </div>

                <div className="flex-1 space-y-3 text-left">
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="space-y-1 text-left">
                      <Label className="text-left text-[8px] font-black uppercase text-slate-400">
                        Nome
                      </Label>
                      <Input
                        value={partner.name}
                        onChange={(e) =>
                          editPartner(index, "name", e.target.value)
                        }
                        className="h-8 rounded-lg border-none bg-slate-50 text-left text-[10px] font-bold"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <Label className="text-left text-[8px] font-black uppercase text-emerald-600">
                        Texto do beneficio
                      </Label>
                      <Input
                        value={partner.discount_text}
                        onChange={(e) =>
                          editPartner(index, "discount_text", e.target.value)
                        }
                        className="h-8 rounded-lg border-none bg-emerald-50/50 text-left text-[10px] font-bold text-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <Label className="text-left text-[8px] font-black uppercase text-slate-400">
                      Link
                    </Label>
                    <div className="relative text-left">
                      <LinkIcon
                        size={10}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300"
                      />
                      <Input
                        value={partner.link}
                        onChange={(e) =>
                          editPartner(index, "link", e.target.value)
                        }
                        className="h-8 rounded-lg border-none bg-slate-50 pl-6 text-left text-[10px] font-medium text-blue-500"
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
