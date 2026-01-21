import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, ShoppingBag, MapPin, Star, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProfileVM } from "../logic/ProfileLogic";

// Sub-componentes
import { PersonalDataTab } from "../components/PersonalDataTab";
import { OrdersTab } from "../components/OrdersTab";
import { LoyaltyTab } from "../components/LoyaltyTab";
import { AddressesTab } from "../components/AddressesTab";
import { AddressForm } from "../components/AddressesForm"; 
import { cn } from "@/lib/utils";

export function ProfileView({ vm }: { vm: ProfileVM }) {
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  if (!vm.isReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 bg-[#FAFAFA]">
        <Loader2 className="h-10 w-10 text-[#2D5A3D] animate-spin" />
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">
          Sincronizando Perfil
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-10">
      <div className="container mx-auto max-w-5xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* HEADER DO PERFIL */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              Minha <span className="text-[#2D5A3D]">Conta</span>
            </h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-3 flex items-center gap-2">
              Bem-vindo de volta, <span className="text-slate-900">{vm.user?.name?.split(' ')[0] || 'Cliente'}</span> 
              <span className="h-1 w-1 rounded-full bg-[#2D5A3D]" />
            </p>
          </div>
          
          {vm.loyalty && (
            <div className="bg-white border border-slate-100 p-3 px-5 rounded-2xl shadow-sm flex items-center gap-4">
               <div className="bg-[#D4AF37]/10 p-2 rounded-xl">
                 <Star className="h-5 w-5 text-[#D4AF37] fill-[#D4AF37]" />
               </div>
               <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Saldo Atual</p>
                 <p className="text-lg font-black text-slate-900 leading-none mt-1">
                   {vm.loyalty.points ?? vm.loyalty.balance ?? 0} pts
                 </p>
               </div>
            </div>
          )}
        </header>

        {/* NAVEGAÇÃO POR ABAS */}
        <Tabs 
          defaultValue="dados" 
          value={vm.activeTab} 
          onValueChange={(v) => {
            vm.setActiveTab(v as any);
            setIsAddingAddress(false); 
          }} 
          className="space-y-8"
        >
          <TabsList className="bg-white border border-slate-100 p-1.5 rounded-[2rem] h-auto flex flex-wrap md:inline-flex gap-1 shadow-sm">
            <TabTriggerItem value="dados" icon={<User className="h-3.5 w-3.5" />} label="Meus Dados" />
            <TabTriggerItem value="pedidos" icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Pedidos" />
            <TabTriggerItem value="enderecos" icon={<MapPin className="h-3.5 w-3.5" />} label="Endereços" />
            <TabTriggerItem value="fidelidade" icon={<Star className="h-3.5 w-3.5" />} label="Fidelidade" />
          </TabsList>

          {/* CONTEÚDOS */}
          <div className="min-h-100">
            <TabsContent value="dados" className="outline-none m-0 animate-in fade-in slide-in-from-left-2">
              <PersonalDataTab user={vm.user} />
            </TabsContent>

            <TabsContent value="pedidos" className="outline-none m-0 animate-in fade-in slide-in-from-left-2">
              <OrdersTab orders={vm.orders} isLoading={vm.isLoadingOrders} />
            </TabsContent>

            <TabsContent value="enderecos" className="outline-none m-0 animate-in fade-in slide-in-from-left-2">
              {!isAddingAddress ? (
                <AddressesTab 
                  addresses={vm.addresses}
                  isLoading={vm.isLoadingAddresses}
                  onSetDefault={vm.setDefaultAddress}
                  onDelete={vm.deleteAddress}
                  isSettingDefault={vm.isSettingDefault}
                  isDeleting={vm.isDeletingAddress}
                  onAddNew={() => setIsAddingAddress(true)} 
                />
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsAddingAddress(false)}
                    className="group text-slate-400 hover:text-slate-900 font-black uppercase text-[10px] tracking-widest gap-2"
                  >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Voltar para endereços
                  </Button>
                  
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <h2 className="text-2xl font-black italic uppercase text-slate-900 mb-6">Novo Endereço</h2>
                    <AddressForm 
                      onSubmit={async (data) => {
                        await vm.addAddress(data);
                        setIsAddingAddress(false);
                      }}
                      isLoading={vm.isAddingAddress} 
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="fidelidade" className="outline-none m-0 animate-in fade-in slide-in-from-left-2">
              <LoyaltyTab loyalty={vm.loyalty} history={vm.loyaltyHistory} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function TabTriggerItem({ value, icon, label }: { value: string, icon: React.ReactNode, label: string }) {
  return (
    <TabsTrigger 
      value={value} 
      className={cn(
        "rounded-full px-6 py-3 font-black text-[10px] uppercase tracking-widest gap-2 transition-all",
        "data-[state=active]:bg-[#2D5A3D] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#2D5A3D]/20",
        "text-slate-400 hover:text-slate-600"
      )}
    >
      {icon}
      {label}
    </TabsTrigger>
  );
}

export default ProfileView;