import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  User,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useCart } from "@/_core/CartContext";
import { CheckoutCustomer } from "@/pages/checkout/components/CheckoutCustomer";
import { useCheckoutLogic } from "@/pages/checkout/logic/useCheckoutLogic";
import { useOnClickOutside } from "@/_core/hooks/useOnClickOutside";

export default function Header() {
  const { user, logout, loading, isAuthenticated } = useAuth();
  
  // Contexto do carrinho com fallback para diferentes nomes de exportação
  const cartContext = useCart();
  const cartItems = (cartContext as any).items || (cartContext as any).cart || [];
  const totalItems = cartItems.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0);

  const { data: companyInfo } = (trpc.public as any).getCompanyInfo.useQuery();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);
  
  const checkoutVm = useCheckoutLogic();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hook para fechar o dropdown ao clicar fora
  useOnClickOutside(dropdownRef as React.RefObject<HTMLElement>, () => setAuthDropdownOpen(false));

  // Fecha o dropdown automaticamente após o login bem-sucedido
  useEffect(() => {
    if (isAuthenticated) {
      setAuthDropdownOpen(false);
    }
  }, [isAuthenticated]);

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src={companyInfo?.logoUrl || APP_LOGO} 
              alt={APP_TITLE} 
              className="h-9 w-9 rounded-xl object-contain" 
            />
            <div className="leading-none hidden sm:block font-brand">
                <div className="text-lg font-bold text-foreground tracking-tighter uppercase">Gourmet</div>
                <div className="text-[11px] font-medium tracking-[0.12em] text-primary uppercase">Saudável</div>
            </div>
          </Link>

          {/* NAV DESKTOP */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Início</Link>
            <Link href="/produtos" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Cardápio</Link>
            <Link href="/packages" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Pacotes</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* CARRINHO */}
            <Link href="/carrinho">
              <div className="relative p-2.5 rounded-full hover:bg-secondary transition-all cursor-pointer group">
                <ShoppingCart className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5.5 h-5 px-1.5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white animate-in zoom-in duration-300 shadow-sm">
                    {totalItems}
                  </span>
                )}
              </div>
            </Link>

            {/* AUTH SECTION */}
            <div className="relative" ref={dropdownRef}>
              {loading ? (
                <div className="h-10 w-24 rounded-full bg-slate-100 animate-pulse" />
              ) : isAuthenticated && user ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link href="/perfil">
                    <Button variant="ghost" className="gap-2 px-3 rounded-full font-semibold text-primary hover:bg-secondary">
                      <User size={18} />
                      <span className="max-w-25 truncate hidden lg:inline">
                        {user.name?.split(" ")[0] || "Conta"}
                      </span>
                    </Button>
                  </Link>
                  {user.role === "admin" && (
                    <Link href="/admin">
                      <Button variant="outline" size="icon" className="rounded-full border-primary/20 text-primary hover:bg-primary hover:text-white transition-all hidden sm:flex">
                        <LayoutDashboard size={18} />
                      </Button>
                    </Link>
                  )}
                  <Button onClick={() => logout()} variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-destructive">
                    <LogOut size={18} />
                  </Button>
                </div>
              ) : (
                <div className="hidden sm:block">
                  <Button 
                    onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
                    className={`rounded-full px-6 font-bold transition-all flex items-center gap-2 shadow-md ${
                      authDropdownOpen ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-emerald-600'
                    }`}
                  >
                    Entrar 
                    <ChevronDown size={14} className={`transition-transform duration-300 ${authDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>

                  {/* DROP DOWN LOGIN/REGISTER */}
                  {authDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-100 rounded-4xl border border-slate-100 bg-white shadow-2xl animate-in fade-in slide-in-from-top-3 duration-300 z-100 overflow-hidden">
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {checkoutVm.state.isLogin ? "Identificação" : "Criar Nova Conta"}
                        </span>
                      </div>
                      <div className="p-6">
                        <CheckoutCustomer {...checkoutVm} />
                        
                        {/* ✅ LINK ESQUECEU A SENHA */}
                        {checkoutVm.state.isLogin && (
                          <div className="mt-4 text-center">
                            <Link 
                              href="/forgot-password" 
                              onClick={() => setAuthDropdownOpen(false)}
                              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
                            >
                              Esqueceu a sua senha?
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MENU MOBILE TOGGLE */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden p-2 rounded-xl text-primary hover:bg-secondary"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}