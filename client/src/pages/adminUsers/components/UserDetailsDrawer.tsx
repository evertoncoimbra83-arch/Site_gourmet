import React, { useState, useMemo } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription, 
} from "@/components/ui/sheet";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { User, MapPin, History, Lock, Loader2, X, ShieldCheck, ChevronDown } from "lucide-react";

import { ProfileTab } from "./UserTabs/ProfileTab";
import { AddressesTab } from "./UserTabs/AddressesTab";
import { UserHistoryTab } from "./UserTabs/UserHistoryTab";
import { SecurityTab } from "./UserTabs/SecurityTab";
import { Button } from "@/components/ui/button";

// --- INTERFACES RESTAURADAS PARA EVITAR ERRO DE 'ANY' ---
interface UserData {
  id: string;
  name?: string;
  phone?: string;
  customerDocument?: string;
  cpf?: string;
  email?: string;
  [key: string]: unknown;
}

interface UserDetails {
  user?: UserData;
  name?: string;
  email?: string;
  profile?: {
    totalSpent?: number;
    loyaltyPoints?: number;
  };
  recentOrders?: Array<{
    id: number | string;
    status: string;
    total: number;
    createdAt: string;
  }>;
  [key: string]: unknown;
}

interface UserDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  details: UserDetails | null;
  isLoading: boolean;
}

const TABS = [
  { id: "profile", label: "Perfil do Usuário", icon: User },
  { id: "enderecos", label: "Endereços de Entrega", icon: MapPin },
  { id: "history", label: "Histórico de Compras", icon: History },
  { id: "password", label: "Segurança e Acesso", icon: Lock },
];

export function UserDetailsDrawer({ 
  open, 
  onClose, 
  userId, 
  details, 
  isLoading 
}: UserDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState("profile");

  const userName = details?.user?.name || details?.name || "Cliente";
  
  // Lógica das iniciais do usuário
  const initials = useMemo(() => {
    if (!userName || userName === "Cliente") return "??";
    return userName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [userName]);

  // CORREÇÃO: Variável que faltava para os componentes internos
  const safeUserId = userId || "";
  
  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[550px] md:max-w-[600px] p-0 border-none bg-white flex flex-col h-screen outline-none shadow-2xl"
      >
        {/* HEADER */}
        <SheetHeader className="p-6 bg-slate-900 shrink-0 relative overflow-hidden text-left space-y-0">
          <SheetDescription className="sr-only">Painel de navegação do cliente.</SheetDescription>
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black">
                {initials}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 text-emerald-400 mb-0.5">
                  <ShieldCheck size={10} strokeWidth={3} />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em]">Gestão de Conta</span>
                </div>
                <SheetTitle className="text-xl font-black uppercase italic tracking-tighter text-white truncate max-w-[250px]">
                  {userName}
                </SheetTitle>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white/40 hover:text-white" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </SheetHeader>

        {/* NAVEGAÇÃO VIA DROPDOWN */}
        <div className="p-4 bg-white border-b border-slate-100 shrink-0 shadow-sm z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full h-14 justify-between px-5 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 text-emerald-400 rounded-lg">
                    <currentTab.icon size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Navegar para</p>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{currentTab.label}</p>
                  </div>
                </div>
                <ChevronDown size={18} className="text-slate-400 group-data-[state=open]:rotate-180 transition-transform" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-[calc(100vw-2rem)] sm:w-[518px] md:w-[568px] p-2 rounded-2xl shadow-2xl border-slate-100 z-[100]">
              {TABS.map((tab) => (
                <DropdownMenuItem 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    h-14 px-4 rounded-xl flex items-center gap-4 cursor-pointer mb-1 last:mb-0
                    ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}
                  `}
                >
                  <tab.icon size={18} className={activeTab === tab.id ? 'text-emerald-400' : 'text-slate-400'} />
                  <span className="font-bold uppercase text-[11px] tracking-widest">{tab.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ÁREA DE CONTEÚDO */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          <div className="p-6 pb-20">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center h-40 gap-4">
                 <Loader2 className="animate-spin text-emerald-500" size={32} />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando Dados...</p>
               </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                {activeTab === "profile" && <ProfileTab details={details} />}
                {activeTab === "enderecos" && <AddressesTab userId={safeUserId} />}
                {activeTab === "history" && <UserHistoryTab details={details} />}
                {activeTab === "password" && <SecurityTab userId={safeUserId} />}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-white border-t border-slate-100 flex justify-end shrink-0 z-10 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
          <Button variant="ghost" onClick={onClose} className="font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-100 h-10 px-6 rounded-xl">
            Fechar Detalhes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}