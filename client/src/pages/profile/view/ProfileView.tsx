// src/pages/profile/view/ProfileView.tsx

import React, { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, ShoppingBag, MapPin, Star, ArrowLeft, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";

// Sub-componentes
import { PersonalDataTab } from "../components/PersonalDataTab";
import { OrdersTabCard } from "../components/OrdersTab";
import { LoyaltyTab } from "../components/LoyaltyTab";
import { AddressesTab } from "../components/AddressesTab";
import { AddressForm } from "../components/AddressesForm"; 
import { OrderTracker } from "../components/OrderTracker"; 
import { ProfileSkeleton } from "../components/ProfileSkeleton";
import { cn } from "@/lib/utils";
import type { UserProfile } from "../components/PersonalDataTab";
// ✅ Importação dos tipos centralizados
import type { ProfileVM } from "../logic/ProfileLogic";
import type { Order } from "../types/orderTypes"; 

type AllowedTabs = "dados" | "pedidos" | "enderecos" | "fidelidade";

export function ProfileView({ vm }: { vm: ProfileVM }) {
  const navigate = useNavigate();
  const { "*": splat } = useParams(); 
  
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Memo para identificar a Tab ativa via URL
  const currentPathTab = useMemo((): AllowedTabs => {
    if (!splat) return "dados";
    const base = splat.split('/')[0];
    const validTabs: AllowedTabs[] = ["dados", "pedidos", "enderecos", "fidelidade"];
    return validTabs.includes(base as AllowedTabs) ? (base as AllowedTabs) : "dados";
  }, [splat]);

  // Sincroniza a Tab da URL com a VM
  useEffect(() => {
    if (vm.activeTab !== currentPathTab) {
      vm.setActiveTab(currentPathTab);
    }
  }, [currentPathTab, vm]);

  /**
   * ✅ IDENTIFICAÇÃO DE RASTREIO
   * Se a URL for /perfil/pedidos/ID_DO_PEDIDO, renderizamos o tracker
   */
  const { isOrderDetails, orderId } = useMemo(() => {
    if (!splat) return { isOrderDetails: false, orderId: null };
    const parts = splat.split('/');
    return {
      isOrderDetails: parts[0] === 'pedidos' && !!parts[1],
      orderId: parts[1] || null
    };
  }, [splat]);

  if (!vm.isReady) {
    return <ProfileSkeleton />;
  }

  // ✅ VISÃO DE RASTREIO (ORDER TRACKER)
  if (isOrderDetails && orderId) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] py-6 md:py-10 font-sans">
        <div className="container mx-auto max-w-5xl px-4 animate-in fade-in slide-in-from-left-4 duration-500">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/perfil/pedidos")}
            className="group mb-6 text-slate-400 hover:text-slate-900 font-black uppercase text-[10px] tracking-widest gap-2 pl-0 hover:bg-transparent"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Voltar para meus pedidos
          </Button>
          
          <div className="bg-white rounded-4xl border border-slate-100 shadow-xl overflow-hidden min-h-125 text-left">
             <OrderTracker orderId={orderId} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] py-6 md:py-10 font-sans">
      <div className="container mx-auto max-w-5xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <header className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              Minha <span className="text-emerald-600">Conta</span>
            </h1>
            <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-3 flex items-center gap-2">
              Bem-vindo, <span className="text-slate-900">{vm.user?.name?.split(' ')[0] || 'Cliente'}</span> 
              <span className="h-1 w-1 rounded-full bg-emerald-600" />
            </p>
          </div>
          
          {vm.loyalty && (
            <div className="bg-white border border-slate-100 p-3 px-5 rounded-2xl shadow-sm flex items-center gap-4 self-start md:self-auto transition-all hover:border-amber-200">
                <div className="bg-[#D4AF37]/10 p-2 rounded-xl">
                  <Star className="h-5 w-5 text-[#D4AF37] fill-[#D4AF37]" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Saldo Atual</p>
                  <p className="text-lg font-black text-slate-900 leading-none mt-1">
                    {vm.loyalty.points ?? vm.loyalty.balance ?? 0} pts
                  </p>
                </div>
            </div>
          )}
        </header>

        <Tabs 
          value={currentPathTab} 
          onValueChange={(v) => {
            setIsAddingAddress(false); 
            navigate(`/perfil/${v}`, { replace: true });
          }} 
          className="space-y-6 md:space-y-8"
        >
          {/* Navegação por Tabs */}
          <div className="relative overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="bg-slate-200/50 border border-slate-200/60 p-1 rounded-2xl md:rounded-full h-auto inline-flex md:flex w-max md:w-auto gap-1">
              <TabTriggerItem value="dados" icon={<User className="h-3.5 w-3.5" />} label="Dados" />
              <TabTriggerItem value="pedidos" icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Pedidos" />
              <TabTriggerItem value="enderecos" icon={<MapPin className="h-3.5 w-3.5" />} label="Endereços" />
              <TabTriggerItem value="fidelidade" icon={<Star className="h-3.5 w-3.5" />} label="Pontos" />
            </TabsList>
          </div>

          <div className="min-h-100">
            {/* 1. Dados Pessoais */}
            <TabsContent value="dados" className="outline-none m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <PersonalDataTab user={vm.user as UserProfile} />
            </TabsContent>

            {/* 2. Histórico de Pedidos */}
            <TabsContent value="pedidos" className="outline-none m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-4">
                {vm.isLoadingOrders ? (
                  <div className="p-10 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">Carregando pedidos...</div>
                ) : (vm.orders as unknown as Order[]).length === 0 ? (
                  <div className="p-10 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhum pedido encontrado</div>
                ) : (
                  (vm.orders as unknown as Order[]).map((order) => <OrdersTabCard key={order.id} order={order} />)
                )}
              </div>
            </TabsContent>

            {/* 3. Endereços */}
            <TabsContent value="enderecos" className="outline-none m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {!isAddingAddress ? (
                <AddressesTab 
                  addresses={vm.addresses}
                  isLoading={vm.isLoadingAddresses}
                  onSetDefault={(id) => vm.setDefaultAddress(String(id))}
                  onDelete={(id) => vm.deleteAddress(String(id))}
                  isSettingDefault={vm.isSettingDefault}
                  isDeleting={vm.isDeletingAddress}
                  onAddNew={() => setIsAddingAddress(true)} 
                />
              ) : (
                <div className="space-y-6 text-left">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsAddingAddress(false)}
                    className="group text-slate-400 hover:text-slate-900 font-black uppercase text-[10px] tracking-widest gap-2 pl-0 hover:bg-transparent"
                  >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Voltar para endereços
                  </Button>
                  
                  <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[3rem] border border-slate-100 shadow-sm">
                    <h2 className="text-xl md:text-2xl font-black italic uppercase text-slate-900 mb-6">Novo Endereço</h2>
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

            {/* 4. Programa de Fidelidade */}
            <TabsContent value="fidelidade" className="outline-none m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <LoyaltyTab loyalty={vm.loyalty || {}} history={vm.loyaltyHistory} />
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
        "rounded-xl md:rounded-full px-4 md:px-6 py-2.5 md:py-3 font-black text-[10px] uppercase tracking-widest gap-2 transition-all flex-1",
        "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border-none",
        "data-[state=active]:bg-emerald-600 data-[state=active]:text-white", 
        "data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-600/20",
        "[&_svg]:data-[state=active]:text-white",
        "[&_svg]:transition-colors"
      )}
    >
      {icon}
      <span>{label}</span>
    </TabsTrigger>
  );
}

export default ProfileView;