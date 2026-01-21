import React from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MapPin, History, Lock, Loader2, X, ShieldCheck, Mail, Calendar } from "lucide-react";

import { ProfileTab } from "./UserTabs/ProfileTab";
import { AddressesTab } from "./UserTabs/AddressesTab";
import { UserHistoryTab } from "./UserTabs/UserHistoryTab";
import { SecurityTab } from "./UserTabs/SecurityTab";
import { Button } from "@/components/ui/button";

export function UserDetailsDrawer({ 
  open, 
  onClose, 
  userId, 
  details, 
  isLoading, 
  onUpdate, 
  isUpdating 
}: any) {
  
  const userName = details?.user?.name || details?.name || "Cliente";
  const initials = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 border-none bg-[#F8FAFC] flex flex-col h-screen outline-none">
        
        {/* HEADER PREMIUM DARK */}
        <div className="p-8 bg-slate-900 shrink-0 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
          
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-5">
              {/* Avatar com Gradiente */}
              <div className="h-14 w-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl border border-white/10">
                {initials}
              </div>
              
              <div className="text-left space-y-0.5">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <ShieldCheck size={12} strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em]">Gestão de Conta</span>
                </div>
                <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">
                  {isLoading ? "..." : userName}
                </SheetTitle>
                <div className="flex items-center gap-3 mt-1 opacity-60">
                   <div className="flex items-center gap-1">
                      <Mail size={10} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 lowercase">{details?.email || 'e-mail n/d'}</span>
                   </div>
                   <div className="h-1 w-1 bg-slate-700 rounded-full" />
                   <div className="flex items-center gap-1">
                      <Calendar size={10} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">ID #{userId}</span>
                   </div>
                </div>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all" 
              onClick={onClose}
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* NAVEGAÇÃO HORIZONTAL (TABS) */}
        <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
          
          {/* BARRA DE MENU HORIZONTAL */}
          <div className="bg-white px-6 border-b border-slate-100 shrink-0">
            <TabsList className="bg-transparent h-16 p-0 gap-2 justify-start overflow-x-auto custom-scrollbar">
              {[
                { value: "profile", label: "Perfil", icon: User },
                { value: "enderecos", label: "Endereços", icon: MapPin },
                { value: "history", label: "Compras", icon: History },
                { value: "password", label: "Segurança", icon: Lock },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className="data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-400 data-[state=active]:shadow-lg rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all text-slate-400 hover:text-slate-600"
                >
                  <tab.icon size={14} className="mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ÁREA DE CONTEÚDO */}
          <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
            <div className="p-8 md:p-10 pb-32">
              {isLoading ? (
                <div className="h-[300px] flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-emerald-600" size={32} />
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Sincronizando Dados...</p>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  <TabsContent value="profile" className="m-0 outline-none">
                    <ProfileTab details={details} onUpdate={onUpdate} isUpdating={isUpdating} />
                  </TabsContent>
                  
                  <TabsContent value="enderecos" className="m-0 outline-none">
                    <AddressesTab userId={userId} />
                  </TabsContent>
                  
                  <TabsContent value="history" className="m-0 outline-none">
                    <UserHistoryTab details={details} />
                  </TabsContent>
                  
                  <TabsContent value="password" className="m-0 outline-none">
                    <SecurityTab userId={userId} />
                  </TabsContent>
                </div>
              )}
            </div>
          </div>
        </Tabs>

        {/* FOOTER FIXO */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-between items-center">
           <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Sessão Segura de Gerenciamento</span>
           </div>
           <Button 
             variant="ghost" 
             onClick={onClose}
             className="h-11 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
           >
             Fechar Detalhes
           </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}