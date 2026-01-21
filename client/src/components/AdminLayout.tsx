import React, { PropsWithChildren, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  Coins,
  ShoppingCart,
  Ticket,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Truck,
  Image as ImageIcon,
  ChevronRight,
  ShieldCheck,
  LayoutTemplate,
  Mail // ✅ Importado para a Central de E-mail
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: PropsWithChildren) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const menuGroups = [
    {
      label: "Operações & CRM",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Pedidos Live", href: "/admin/orders", icon: ShoppingCart },
        { label: "Gestão de Clientes", href: "/admin/users", icon: Users },
      ]
    },
    {
      label: "Produtos",
      items: [
        { label: "Pratos", href: "/admin/dishes", icon: UtensilsCrossed },
        { label: "Acomp. & Tamanhos", href: "/admin/sizes-accompaniments", icon: Layers },
        { label: "Pacotes", href: "/admin/packages", icon: Package },
      ]
    },
    {
      label: "Vendas & Marketing",
      items: [
        { label: "Central de Marketing", href: "/admin/marketing", icon: TrendingUp },
        { label: "Vitrines da Home", href: "/admin/showcases", icon: LayoutTemplate },
        { label: "Cupons", href: "/admin/coupons", icon: Ticket },
        { label: "Regras de Desconto", href: "/admin/discount-rules", icon: TrendingDown },
        { label: "Fidelidade", href: "/admin/loyalty", icon: Coins },
      ]
    },
    {
      label: "Logística & Financeiro",
      items: [
        { label: "Envios & CEP", href: "/admin/shipping", icon: Truck },
        { label: "Pagamentos", href: "/admin/payment-methods", icon: CreditCard },
      ]
    },
    {
      label: "Sistema",
      items: [
        { label: "Biblioteca de Mídia", href: "/admin/media", icon: ImageIcon },
        // ✅ NOVA ROTA: CENTRAL DE E-MAIL
        { label: "Central de E-mail", href: "/admin/mail", icon: Mail }, 
        { label: "Configurações", href: "/admin/settings", icon: Settings },
        { label: "Auditoria (Logs)", href: "/admin/logs", icon: ShieldCheck },
      ]
    }
  ];

  const isActive = (path: string) => {
    if (path === "/admin" && location === "/admin") return true;
    if (path !== "/admin" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* SIDEBAR DESKTOP */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-60 w-72 transform transition-transform duration-300 ease-out md:translate-x-0 bg-[#F8FAFC]",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="m-4 h-[calc(100%-2rem)] rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col">
          
          <div className="p-8 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                <ShieldCheck size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900 uppercase tracking-tighter italic leading-none">Boutique</p>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mt-1">Admin Panel</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar">
            {menuGroups.map((group, idx) => (
              <div key={idx} className="space-y-2">
                <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">
                  {group.label}
                </p>
                
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                        <div className={cn(
                          "flex items-center justify-between px-4 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer group",
                          active 
                            ? "bg-slate-900 text-emerald-400 shadow-xl shadow-slate-200 scale-[1.02]" 
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        )}>
                          <div className="flex items-center gap-3">
                            <item.icon size={18} className={cn(
                              "transition-transform group-hover:scale-110",
                              active ? "text-emerald-400" : "text-slate-300"
                            )} />
                            <span>{item.label}</span>
                          </div>
                          {active && <ChevronRight size={14} className="animate-in slide-in-from-left-2 duration-300" />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <Link href="/login">
                <button className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 hover:text-red-600 transition-all">
                  <LogOut size={16} /> Encerrar Sessão
                </button>
            </Link>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6">
          <span className="font-black text-slate-900 uppercase italic tracking-tighter">Boutique Admin</span>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl">
            <Menu />
          </button>
        </div>
      </header>

      {/* OVERLAY MOBILE */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* MAIN CONTENT */}
      <main className="md:pl-72 min-h-screen">
        <div className="p-6 md:p-12 max-w-400 mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}