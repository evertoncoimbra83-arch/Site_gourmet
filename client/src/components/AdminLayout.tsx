import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, UtensilsCrossed, Layers, Package, Settings, LogOut,
  Menu, X, Users, ShoppingCart, CreditCard, Truck,
  Image as ImageIcon, ChevronDown, ShieldCheck, LayoutTemplate,
  History, BellRing, ShoppingBag, TicketPercent, Zap,
  Mail, BarChart3, Megaphone, Monitor,
  Gift, Tags, Share2, Palette, Target, Printer
} from "lucide-react";

import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { trpc } from "@/_core/trpc";
import OneSignal from "react-onesignal";
import { appToast as toast } from "@/lib/app-toast";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { SystemHealthIndicator } from "./SystemHealthIndicator";

// --- INTERFACES ---

interface OneSignalExtended {
  showSlidedownPrompt?: () => Promise<void>;
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number; // Alterado para aceitar string (ex: "BETA")
  badgeColor?: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
}

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  // PERSISTÊNCIA DE VISUALIZAÇÃO
  const [lastViewedOrderId, setLastViewedOrderId] = useState<string>(() => 
    localStorage.getItem("last_viewed_order_id") || "0"
  );
  const [lastViewedAbandonedId, setLastViewedAbandonedId] = useState<string>(() => 
    localStorage.getItem("last_viewed_abandoned_id") || "0"
  );

  // QUERIES DE MONITORAMENTO
  const { data: abandonedData } = trpc.admin.orders.getAbandonedCarts.useQuery(undefined, { refetchInterval: 60000 });
  const { data: pendingOrders } = trpc.admin.orders.list.useQuery({ status: "pending" }, { refetchInterval: 15000 });

  // LÓGICA DE CONTADORES
  const newOrdersCount = useMemo(() => {
    const list = pendingOrders?.orders;
    if (!list || !Array.isArray(list)) return 0;
    return list.filter(o => Number(o.id) > Number(lastViewedOrderId)).length;
  }, [pendingOrders, lastViewedOrderId]);

  const newAbandonedCount = useMemo(() => {
    const list = abandonedData?.carts;
    if (!list || !Array.isArray(list)) return 0;
    return list.filter(c => Number(c.id) > Number(lastViewedAbandonedId)).length;
  }, [abandonedData, lastViewedAbandonedId]);

  useEffect(() => {
    if (pathname === "/admin/orders" && pendingOrders?.orders?.length) {
      const latestId = String(Math.max(...pendingOrders.orders.map(o => Number(o.id))));
      localStorage.setItem("last_viewed_order_id", latestId);
      setLastViewedOrderId(latestId);
    }
    if (pathname === "/admin/abandoned-carts" && abandonedData?.carts?.length) {
      const latestId = String(Math.max(...abandonedData.carts.map(c => Number(c.id))));
      localStorage.setItem("last_viewed_abandoned_id", latestId);
      setLastViewedAbandonedId(latestId);
    }
    setIsMobileMenuOpen(false);
  }, [pathname, pendingOrders, abandonedData]);

  // ✅ GRUPOS DE MENU (Sincronizado com GourmetIA Bridge)
  const menuGroups: MenuGroup[] = [
    {
      id: "operations",
      label: "Operações",
      icon: Zap,
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Pedidos Live", href: "/admin/orders", icon: ShoppingCart, badge: newOrdersCount, badgeColor: "bg-rose-500" },
        { label: "Carrinhos Perdidos", href: "/admin/abandoned-carts", icon: ShoppingBag, badge: newAbandonedCount, badgeColor: "bg-amber-500" },
        { label: "BI & Analytics", href: "/admin/analytics", icon: BarChart3 },
        { label: "Gestão Nutri", href: "/admin/nutris", icon: ShieldCheck },
        { label: "Clientes", href: "/admin/users", icon: Users },
      ],
    },
    {
      id: "logistics",
      label: "Produção & Zebra",
      icon: Truck,
      items: [
        { label: "Fila de Impressão", href: "/admin/labels/editor/production", icon: Printer },
        { label: "Studio de Etiquetas", href: "/admin/labels/editor", icon: LayoutTemplate },
      ],
    },
    {
      id: "catalog",
      label: "Catálogo",
      icon: UtensilsCrossed,
      items: [
        { label: "Pratos & Itens", href: "/admin/dishes", icon: UtensilsCrossed },
        { label: "Acomp. & Tamanhos", href: "/admin/sizes-accompaniments", icon: Layers },
        { label: "Pacotes", href: "/admin/packages", icon: Package },
      ],
    },
    {
      id: "marketing",
      label: "Marketing & Retenção",
      icon: Megaphone,
      items: [
        { label: "Central de Marketing", href: "/admin/marketing", icon: Target },
        { label: "Clube de Fidelidade", href: "/admin/loyalty", icon: Gift },
        { label: "Regras de Desconto", href: "/admin/offers", icon: Tags },
        { label: "Indique e Ganhe", href: "/admin/referrals", icon: Share2 },
        { label: "Cupons Manuais", href: "/admin/coupons", icon: TicketPercent },
        { label: "E-mails", href: "/admin/mail", icon: Mail },
      ],
    },
    {
      id: "settings",
      label: "Site & Configurações",
      icon: Settings,
      items: [
        { label: "Vitrines da Home", href: "/admin/showcases", icon: LayoutTemplate },
        { label: "Aparência do Site", href: "/admin/theme", icon: Palette },
        { label: "Biblioteca Mídia", href: "/admin/media", icon: ImageIcon },
        { label: "Logística Geral", href: "/admin/shipping", icon: Truck },
        { label: "Pagamentos", href: "/admin/payment-methods", icon: CreditCard },
        { label: "Ajustes Gerais", href: "/admin/settings", icon: Settings },
        // 🚀 NOVA ROTA GOURMETIA BRIDGE
        { label: "Integração IA", href: "/admin/integration", icon: Zap, badge: "BETA", badgeColor: "bg-blue-600" },
        { label: "Logs do Sistema", href: "/admin/logs", icon: History },
      ],
    },
  ];

  useEffect(() => {
    const activeGroup = menuGroups.find(group => 
      group.items.some(item => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)))
    );
    if (activeGroup && !openGroups.includes(activeGroup.id)) {
      setOpenGroups(prev => [...prev, activeGroup.id]);
    }
  }, [pathname]);

  const handleEnableNotifications = async () => {
    try {
      const os = OneSignal as unknown as OneSignalExtended;
      if (os.showSlidedownPrompt) {
        await os.showSlidedownPrompt();
        toast.success("Prompt de notificações ativado!");
      } else {
        toast.info("Configuração automática não disponível.");
      }
    } catch {
      toast.error("Erro ao ativar notificações.");
    }
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col md:flex-row font-sans text-slate-900">
      
      <header className="md:hidden sticky top-0 z-110 bg-white/70 backdrop-blur-md border-b border-slate-200/50 px-6 h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-slate-950 rounded-lg flex items-center justify-center">
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <span className="font-black text-slate-900 uppercase italic text-xs tracking-tighter">Admin Boutique</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-100 rounded-xl text-slate-900 active:scale-90 transition-all">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <aside className={cn(
          "fixed inset-y-0 left-0 w-80 transition-all duration-500 ease-in-out z-105 md:translate-x-0 bg-transparent pointer-events-none md:pointer-events-auto",
          isMobileMenuOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full"
        )}>
        <div className="m-4 h-[calc(100vh-2rem)] rounded-4xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto">
          
          <div className="p-8 border-b border-slate-50 flex items-center gap-4 shrink-0">
            <div className="h-12 w-12 bg-slate-950 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 transition-transform hover:rotate-3">
              <ShieldCheck size={24} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 tracking-tighter italic">BOUTIQUE</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Control</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
            <div className="bg-slate-50/50 rounded-3xl p-4 mb-6 border border-slate-100/50">
                <SystemHealthIndicator />
                <button
                  onClick={handleEnableNotifications}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all shadow-sm border border-slate-100"
                >
                  <BellRing size={14} className={cn(newOrdersCount > 0 ? "animate-bounce text-rose-500" : "")} />
                  {newOrdersCount > 0 ? `${newOrdersCount} Pedidos Novos` : "Alertas Push"}
                </button>
            </div>

            {menuGroups.map((group) => {
              const isGrpOpen = openGroups.includes(group.id);
              const hasActiveItem = group.items.some(item => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)));
              
              return (
                <div key={group.id} className="mb-2">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group",
                      hasActiveItem && !isGrpOpen ? "bg-slate-950 text-white shadow-xl" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <group.icon size={18} className={cn(hasActiveItem && !isGrpOpen ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-950")} />
                      <span className="text-[11px] font-black uppercase tracking-wider">{group.label}</span>
                    </div>
                    <ChevronDown size={14} className={cn("transition-transform duration-300 opacity-30", isGrpOpen ? "rotate-180" : "")} />
                  </button>

                  <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out px-2",
                    isGrpOpen ? "max-h-150 opacity-100 mt-1" : "max-h-0 opacity-0"
                  )}>
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                      return (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          className={cn(
                            "flex items-center justify-between px-4 py-3 rounded-xl transition-all mb-1 group/item",
                            isActive ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-400 hover:text-slate-700 hover:bg-slate-50/80"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon size={16} className={cn("transition-transform group-hover/item:scale-110", isActive ? "text-emerald-600" : "text-slate-300")} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                          </div>
                          {item.badge !== undefined && (typeof item.badge === "string" || item.badge > 0) && (
                            <span className={cn(
                                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] font-black text-white shadow-sm leading-none",
                                item.badgeColor || "bg-rose-500",
                                isActive ? "" : (typeof item.badge === "number" ? "animate-pulse" : "")
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="p-6 border-t border-slate-50 bg-slate-50/20">
            <button
              onClick={() => logout()}
              className="w-full group flex items-center justify-center gap-3 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
            >
              <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
              Sair do Painel
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:pl-80 transition-all duration-300">
        <div className="p-6 md:p-12 lg:p-16 max-w-400 mx-auto min-h-screen flex flex-col">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 text-[10px] font-bold uppercase tracking-widest">
              <Monitor size={14} />
              <span>Admin</span>
              <span>/</span>
              <span className="text-slate-900">{pathname.split("/").pop()?.replace("-", " ") || "Home"}</span>
            </div>
          </div>
          
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
