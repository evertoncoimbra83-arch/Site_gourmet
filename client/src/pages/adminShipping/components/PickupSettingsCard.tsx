import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { MapPin, Navigation, Save, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function PickupSettingsCard({ settings, onSave, isUpdating }: any) {
  /**
   * ✅ ESTADO LOCAL: Sincronizado com os nomes das colunas do DB.
   * Usamos fallbacks ("") para evitar que o componente quebre antes do carregamento.
   */
  const [localSettings, setLocalSettings] = useState({
    pickupEnabled: false,
    pickupLabel: "",
    pickupInstruction: ""
  });

  /**
   * ✅ SINCRONIZAÇÃO: Sempre que os dados do servidor (settings) mudarem, 
   * atualizamos o formulário local. Isso resolve o erro dos dados sumirem no refresh.
   */
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        pickupEnabled: !!settings.pickupEnabled,
        pickupLabel: settings.pickupLabel || "",
        pickupInstruction: settings.pickupInstruction || ""
      });
    }
  }, [settings]);

  const handleSave = () => {
    // Envia o estado local formatado para a função de salvamento do componente pai
    onSave(localSettings);
  };

  return (
    <Accordion type="single" collapsible className="w-full border-none">
      <AccordionItem value="pickup-settings" className="border-none">
        
        {/* CONTAINER PRINCIPAL */}
        <div className={cn(
          "bg-white rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-500 overflow-hidden",
          localSettings.pickupEnabled ? "border-emerald-100 ring-1 ring-emerald-50" : "opacity-80"
        )}>
          
          {/* HEADER DO CARD */}
          <div className="p-6 md:p-8 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                localSettings.pickupEnabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-300"
              )}>
                <MapPin size={24} />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-xl uppercase italic tracking-tighter text-slate-900 leading-none">
                    Retirada no Local
                  </h3>
                  <Switch 
                    // ✅ SINCRONIZADO: pickupEnabled
                    checked={localSettings.pickupEnabled} 
                    onCheckedChange={(val) => {
                      setLocalSettings({ ...localSettings, pickupEnabled: val });
                    }}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {localSettings.pickupEnabled ? "Ativo no checkout" : "Desabilitado no momento"}
                </p>
              </div>
            </div>

            <AccordionTrigger className="hover:no-underline p-0">
              <div className="h-12 px-6 rounded-xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group border border-transparent hover:border-slate-200 transition-all">
                <Navigation size={14} className="group-hover:text-emerald-600 transition-colors" />
                Configurar Texto
              </div>
            </AccordionTrigger>
          </div>

          {/* CONTEÚDO EDITÁVEL */}
          <AccordionContent className="p-0 border-t border-slate-50 bg-slate-50/30">
            <div className="p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-top-4">
              
              <div className="grid grid-cols-1 gap-6">
                {/* INPUT: Título (Ex: Retirada no Balcão) */}
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Título da Opção (Ex: Retirada no Balcão)
                  </Label>
                  <Input 
                    className="h-14 rounded-2xl bg-white border-none shadow-sm font-bold text-slate-700 focus-visible:ring-emerald-500" 
                    placeholder="Como o cliente verá no botão"
                    value={localSettings.pickupLabel}
                    onChange={(e) => setLocalSettings({ ...localSettings, pickupLabel: e.target.value })}
                  />
                </div>

                {/* TEXTAREA: Instruções (CEP, Endereço, Horários) */}
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Instruções de Retirada (Endereço e Referência)
                  </Label>
                  <Textarea 
                    className="rounded-2xl bg-white border-none shadow-sm font-medium h-28 resize-none p-4 focus-visible:ring-emerald-500" 
                    placeholder="Ex: Rua Saúde, 450. Disponível de segunda a sexta, das 09h às 18h."
                    value={localSettings.pickupInstruction}
                    onChange={(e) => setLocalSettings({ ...localSettings, pickupInstruction: e.target.value })}
                  />
                </div>
              </div>

              {/* BOTÃO SALVAR */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100">
                <div className="flex items-start gap-2 text-slate-400 italic">
                  <Info size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-[9px] font-bold uppercase tracking-tight max-w-xs leading-tight">
                    Lembre-se de salvar para aplicar as alterações. O cliente verá esses dados na finalização do pedido.
                  </p>
                </div>

                <Button 
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="w-full md:w-auto h-14 px-12 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest shadow-xl transition-all active:scale-95"
                >
                  {isUpdating ? (
                    <><Loader2 className="animate-spin mr-2" size={18} /> Salvando...</>
                  ) : (
                    <><Save className="mr-2" size={18} /> Atualizar Registro</>
                  )}
                </Button>
              </div>

            </div>
          </AccordionContent>
        </div>

      </AccordionItem>
    </Accordion>
  );
}