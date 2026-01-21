import { useAdminLoyalty } from "../logic/useAdminLoyalty";
import { LoyaltyHistoryDrawer } from "../components/LoyaltyHistoryDrawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label"; 
import { Search, Save, Coins, Gift, Loader2, Users, Star, TrendingUp, Info } from "lucide-react";

export function AdminLoyaltyView() {
  const { state, actions, data, mutations } = useAdminLoyalty();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER PREMIUM */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <Star size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Retention & Growth</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Clube de <span className="text-emerald-600">Fidelidade</span><span className="text-emerald-600">.</span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-medium italic">
            Arquitete regras de bônus, conversão de pontos e recompensas exclusivas.
          </p>
        </div>
        
        <Button 
          onClick={actions.handleSaveSettings} 
          disabled={mutations.updateSettings.isPending}
          className="h-16 px-10 rounded-4xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all active:scale-95 group"
        >
          {mutations.updateSettings.isPending ? (
            <Loader2 className="animate-spin mr-2" size={18}/>
          ) : (
            <Save className="mr-2 transition-transform group-hover:scale-110" size={18}/>
          )}
          Salvar Configurações
        </Button>
      </header>

      <Tabs defaultValue="customers" className="w-full">
        {/* TAB NAVIGATION */}
        <div className="flex justify-start mb-8">
          <TabsList className="bg-slate-100/50 p-1.5 rounded-4xl h-16 w-full md:w-auto border border-slate-100 shadow-sm">
            <TabsTrigger 
              value="customers" 
              className="px-8 rounded-3xl h-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all"
            >
              <Users className="mr-2" size={14} /> Listagem de Clientes
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="px-8 rounded-3xl h-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all"
            >
              <TrendingUp className="mr-2" size={14} /> Regras de Pontuação
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="customers" className="space-y-6 animate-in fade-in duration-500">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input 
              placeholder="BUSCAR CLIENTE POR NOME OU E-MAIL..." 
              className="flex h-16 w-full px-14 rounded-4xl bg-white border-none shadow-sm font-bold text-xs tracking-widest uppercase focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/5 transition-all" 
              value={state.search} 
              onChange={e => actions.setSearch(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.loadingCustomers ? (
               <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-emerald-600" size={40} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consultando Base...</p>
               </div>
            ) : data.customers.length === 0 ? (
               <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-4xl bg-white/50">
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Nenhum cliente encontrado para "{state.search}"</p>
               </div>
            ) : data.customers.map((c: any) => (
              <div 
                key={c.id} 
                onClick={() => actions.setSelectedCustomer(c)} 
                className="group bg-white rounded-4xl p-6 border border-slate-50 shadow-sm hover:shadow-md hover:border-emerald-100 cursor-pointer transition-all duration-300 flex items-center justify-between"
              >
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all border border-slate-100">
                    <Users size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg leading-none">
                      {/* ✅ Mostra o nome limpo ou o início do email */}
                      {c.name && !c.name.includes(':') ? c.name : (c.email.split('@')[0])}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{c.email}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge className="bg-emerald-600 text-white font-black px-4 py-1.5 rounded-xl border-none text-[11px] italic">
                    {/* ✅ Exibe pontos sincronizados */}
                    {Number(c.points || 0).toLocaleString()} PTS
                  </Badge>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
    R$ {Number(c.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
          
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10 space-y-8">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-emerald-600">
                <Coins size={22} />
                <h3 className="font-black uppercase italic tracking-tighter text-2xl text-slate-900">Engenharia de <span className="text-emerald-600">Acúmulo</span></h3>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Defina quantos pontos o cliente ganha por real</p>
            </div>

            <div className="space-y-6">
              <div className="p-8 bg-slate-50/50 rounded-4xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-100">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Base de Gasto</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-400 uppercase">R$</span>
                    <Input 
                      type="number" 
                      className="w-24 h-14 rounded-2xl bg-white border-none shadow-sm font-black text-xl text-center" 
                      value={state.formData.conversionRateMoney || ""} 
                      onChange={e => actions.setFormData({...state.formData, conversionRateMoney: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="hidden md:block text-slate-200">
                  <Info size={20} />
                </div>

                <div className="flex flex-col gap-1 md:items-end text-right">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gera esses pontos</span>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="number" 
                      className="w-24 h-14 rounded-2xl bg-white border-none shadow-sm font-black text-xl text-center text-emerald-600" 
                      value={state.formData.conversionRatePoints || ""} 
                      onChange={e => actions.setFormData({...state.formData, conversionRatePoints: e.target.value})} 
                    />
                    <span className="text-[11px] font-black text-slate-400 uppercase">Pontos</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Bônus de Cadastro</Label>
                  <Input type="number" className="rounded-2xl h-14 bg-slate-50 border-none font-black text-lg" value={state.formData.pointsPerSignup || ""} onChange={e => actions.setFormData({...state.formData, pointsPerSignup: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Bônus Avaliação</Label>
                  <Input type="number" className="rounded-2xl h-14 bg-slate-50 border-none font-black text-lg" value={state.formData.pointsPerReview || ""} onChange={e => actions.setFormData({...state.formData, pointsPerReview: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10 space-y-8">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-emerald-600">
                <Gift size={22} />
                <h3 className="font-black uppercase italic tracking-tighter text-2xl text-slate-900">Regras de <span className="text-emerald-600">Resgate</span></h3>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Defina o valor em dinheiro de cada bloco de pontos</p>
            </div>

            <div className="space-y-6">
              <div className="p-8 bg-slate-50/50 rounded-4xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-100">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Base de Resgate</span>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="number" 
                      className="w-28 h-14 rounded-2xl bg-white border-none shadow-sm font-black text-xl text-center" 
                      value={state.formData.redemptionRatePoints || ""} 
                      onChange={e => actions.setFormData({...state.formData, redemptionRatePoints: e.target.value})} 
                    />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Pontos</span>
                  </div>
                </div>

                <div className="hidden md:block text-slate-200 font-black text-2xl">=</div>

                <div className="flex flex-col gap-1 md:items-end text-right">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Valem esse valor</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-emerald-600 italic">R$</span>
                    <Input 
                      type="number" 
                      className="w-28 h-14 rounded-2xl bg-white border-none shadow-sm font-black text-xl text-center text-emerald-600" 
                      value={state.formData.redemptionRateMoney || ""} 
                      onChange={e => actions.setFormData({...state.formData, redemptionRateMoney: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 border-t border-slate-100 pt-6">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Expiração (Em Dias)</Label>
                <Input type="number" className="rounded-2xl h-14 bg-slate-50 border-none font-black text-lg" value={state.formData.pointsExpirationDays || ""} onChange={e => actions.setFormData({...state.formData, pointsExpirationDays: e.target.value})} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <LoyaltyHistoryDrawer 
        open={!!state.selectedCustomer}
        onClose={() => actions.setSelectedCustomer(null)}
        customer={state.selectedCustomer}
        history={data.history}
        isLoading={state.loadingHistory}
        manualPoints={state.manualPoints}
        setManualPoints={actions.setManualPoints}
        manualReason={state.manualReason}
        setManualReason={actions.setManualReason}
        onApply={actions.handleManualAdjustment}
        isPending={mutations.addManualPoints.isPending}
      />
    </div>
  );
}