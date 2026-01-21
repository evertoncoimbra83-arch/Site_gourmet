import { useAdminShipping } from "../logic/useAdminShipping";
import { PickupSettingsCard } from "../components/PickupSettingsCard";
import { ShippingMapDrawer } from "../components/ShippingMapDrawer"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Truck, Plus, Trash2, Loader2, MapPinned, 
  Globe, Navigation, Map, ListOrdered, Store, Info, Pencil, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminShippingView() {
  const { state, actions, data, mutations } = useAdminShipping();

  /**
   * ✅ Handler para salvar área do Google Maps
   */
  const handleSaveMapArea = (coords: { lat: number; lng: number }[]) => {
    actions.createRule({
      name: `ÁREA MAPEADA ${new Date().toLocaleDateString('pt-BR')}`,
      type: 'polygon',
      polygonCoords: coords,
      price: 0, 
      active: true
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <Globe size={18} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Logística Inteligente</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Território <span className="text-emerald-600">&</span> Entrega<span className="text-emerald-600">.</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium italic">
            Mapeie perímetros via Google Maps ou configure faixas de CEP tradicionais.
          </p>
        </div>
      </header>

      <Tabs defaultValue="delivery" className="w-full space-y-8">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-16 w-full md:w-auto justify-start border border-slate-200/50">
          <TabsTrigger value="delivery" className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Truck size={16} className="mr-2" /> Entrega em Domicílio
          </TabsTrigger>
          <TabsTrigger value="pickup" className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Store size={16} className="mr-2" /> Retirada no Local
          </TabsTrigger>
        </TabsList>

        <TabsContent value="delivery" className="space-y-12 outline-none animate-in fade-in zoom-in-95 duration-300">
          
          {/* MÓDULO GOOGLE MAPS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-slate-400">
                <Map size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Geofencing (Google Maps)</span>
              </div>
            </div>
            <ShippingMapDrawer 
              googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}
              onSaveArea={handleSaveMapArea}
            />
          </div>

          {/* MÓDULO REGRAS DE CEP / EDIÇÃO */}
          <div className="space-y-6">
            <Accordion type="single" collapsible className="w-full border-none">
              <AccordionItem value="new-rule" className="border-none">
                <AccordionTrigger className="flex p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:no-underline group">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      {state.editingRule ? <Pencil size={24} /> : <Plus size={24} />}
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-black uppercase tracking-tighter italic text-slate-900 leading-none">
                        {state.editingRule ? "Editando Regra" : "Nova Regra de CEP"}
                      </h2>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="pt-6">
                  <div className="bg-white p-8 rounded-[3.5rem] border-2 border-dashed border-emerald-100 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      <div className="md:col-span-12">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome da Região</Label>
                        <Input 
                          className="h-16 rounded-2xl bg-slate-50 border-none font-black text-xl" 
                          value={state.newRule.name} 
                          onChange={e => actions.setNewRule({...state.newRule, name: e.target.value.toUpperCase()})} 
                        />
                      </div>
                      <div className="md:col-span-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CEP Inicial</Label>
                        <Input 
                          className="h-16 rounded-2xl bg-slate-50 border-none font-black text-center" 
                          value={state.newRule.cepStart} 
                          onChange={e => actions.setNewRule({...state.newRule, cepStart: e.target.value})} 
                        />
                      </div>
                      <div className="md:col-span-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CEP Final</Label>
                        <Input 
                          className="h-16 rounded-2xl bg-slate-50 border-none font-black text-center" 
                          value={state.newRule.cepEnd} 
                          onChange={e => actions.setNewRule({...state.newRule, cepEnd: e.target.value})} 
                        />
                      </div>
                      <div className="md:col-span-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preço (R$)</Label>
                        <Input 
                          className="h-16 rounded-2xl bg-slate-50 border-none font-black text-center text-emerald-600" 
                          value={state.newRule.price} 
                          onChange={e => actions.setNewRule({...state.newRule, price: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      {state.editingRule && (
                        <Button variant="ghost" onClick={() => actions.setEditingRule(null)} className="h-16 rounded-2xl font-black uppercase text-xs">Cancelar</Button>
                      )}
                      <Button 
                        onClick={() => actions.saveRule()} 
                        className="h-16 px-12 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs"
                      >
                        {state.editingRule ? "Salvar Alterações" : "Ativar Regra"}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* LISTAGEM DE REGRAS */}
            <div className="grid grid-cols-1 gap-5">
              {data.rules.map((rule: any) => (
                <div key={rule.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-50 flex flex-col md:flex-row items-center justify-between gap-8 group">
                  <div className="flex items-center gap-8">
                    <div className={cn(
                      "h-16 w-16 rounded-[1.5rem] flex items-center justify-center border",
                      rule.type === 'polygon' ? "bg-blue-50 text-blue-500 border-blue-100" : "bg-slate-50 text-slate-300"
                    )}>
                      {rule.type === 'polygon' ? <Map size={28} /> : <MapPinned size={28} />}
                    </div>
                    <div>
                      <h3 className="font-black text-xl uppercase italic tracking-tighter text-slate-900">{rule.name}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {rule.type === 'polygon' ? 'PERÍMETRO GPS' : `${rule.cepStart} — ${rule.cepEnd}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-300 uppercase mb-1">Preço</p>
                       <p className="font-black text-3xl text-emerald-600 italic">R$ {Number(rule.price).toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-500" 
                        onClick={() => actions.prepareEdit(rule)}
                      >
                        <Pencil size={20} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500" 
                        onClick={() => actions.deleteRule(rule.id)}
                      >
                        <Trash2 size={20} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pickup">
          <PickupSettingsCard settings={data.settings} onToggle={actions.handleTogglePickup} onSave={actions.handleSaveSettings} isUpdating={mutations.updateSettings.isPending} />
        </TabsContent>
      </Tabs>
    </div>
  );
}