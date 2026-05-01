import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_TITLE } from "@/const";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  User,
  ChevronDown,
  UtensilsCrossed,
  Sparkles 
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/_core/CartContext";
import { useOnClickOutside } from "@/_core/hooks/useOnClickOutside";
import { cn } from "@/lib/utils";
import { safeJsonParse } from "@/lib/safe-parse";
import { HeaderAuthForm } from "@/pages/auth/HeaderLoginForm";

const STATIC_LOGO_URL = "https://gourmetsaudavel.com/uploads/img-1771987921987-404279675.webp";

interface AuthUser {
  id: string;
  name?: string | null;
  role?: string;
  referral?: string | null;
  referralCode?: string | null; 
  professionalId?: string | null; 
}

interface CartItem {
  quantity: number;
}

interface CartContextType {
  items?: CartItem[];
  cart?: CartItem[];
}

// ✅ Interface atualizada para suportar estrutura aninhada de logo
interface CompanySocialInfo {
  logoUrl?: string;
}

interface StoreSettings {
  logoUrl?: string;
  logo_url?: string;
  companyInfo?: string | CompanySocialInfo;
  company_social_info?: string | CompanySocialInfo;
}

export default function Header() {
  const { user: rawUser, logout, isAuthenticated } = useAuth();
  const user = rawUser as AuthUser | null; 
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const trpcContext = trpc.useUtils(); 

  const isAllowedNutri = user?.role === "admin" || user?.role === "nutri";
  
  const hasActivePrescription = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    const isCustomer = user.role === "customer" || user.role === "user";
    const hasReferral = !!(user.referral || user.referralCode || user.professionalId);
    return isCustomer && hasReferral;
  }, [isAuthenticated, user]);

  const cartContext = useCart() as unknown as CartContextType;
  const cartItems = cartContext?.items || cartContext?.cart || [];
  const totalItems = cartItems.reduce((acc: number, item: CartItem) => acc + (item.quantity || 0), 0);

  const { data: rawStoreSettings, isLoading: isLoadingSettings } = trpc.store.public.getPublicSettings.useQuery(undefined, {
    staleTime: Infinity,
    retry: false,
  });

  const [hasError, setHasError] = useState(false);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(dropdownRef as React.RefObject<HTMLElement>, () => setAuthDropdownOpen(false));

  const closeAuthWindows = () => setAuthDropdownOpen(false);

  const handleLogout = async () => {
    try {
      closeAuthWindows();
      await logout();
      await trpcContext.invalidate();
      window.location.replace("/");
    } catch (error) {
      console.error("Erro ao deslogar:", error);
      window.location.href = "/"; 
    }
  };

  useEffect(() => {
    closeAuthWindows();
  }, [pathname]);

  const getLogoSrc = () => {
    if (isLoadingSettings || !rawStoreSettings) return STATIC_LOGO_URL;
    const s = rawStoreSettings as unknown as StoreSettings;
    let dbLogo = s.logoUrl || s.logo_url;

    if (!dbLogo) {
      const rawInfo = s.companyInfo || s.company_social_info;
      const social = safeJsonParse<CompanySocialInfo | undefined>(rawInfo, undefined);
      dbLogo = social?.logoUrl;
    }

    if (dbLogo && dbLogo.length > 5) {
      if (dbLogo.startsWith("http")) return dbLogo;
      const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
      return `${baseUrl}/uploads/${dbLogo.split("/uploads/")[1] || dbLogo}`;
    }
    return STATIC_LOGO_URL;
  };

  const currentSrc = getLogoSrc();

  if (pathname.startsWith("/admin")) return null;

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "text-slate-500 hover:text-emerald-600 transition-colors relative py-1", 
      isActive && "text-emerald-700 font-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-emerald-600"
    );

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          
          <NavLink to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img
              src={!hasError ? currentSrc : STATIC_LOGO_URL}
              alt={APP_TITLE}
              className="h-9 sm:h-10 w-auto object-contain max-w-37.5 sm:max-w-45"
              onError={() => setHasError(true)}
            />
          </NavLink>

          <nav className="hidden md:flex items-center gap-8 font-black uppercase text-[11px] tracking-widest">
            <NavLink to="/" className={navClass} end>Início</NavLink>
            <NavLink to="/produtos" className={navClass}>Cardápio</NavLink>
            
            {isAuthenticated && (
              <NavLink to="/cardapio-ia" className={cn(navClass, "text-emerald-600 flex items-center gap-1.5")}>
                <Sparkles size={14} className="fill-emerald-600/20" /> Cardápio IA
              </NavLink>
            )}

            <NavLink to="/pacotes" className={navClass}>Pacotes</NavLink>
            
            {hasActivePrescription && (
              <NavLink to="/meu-plano" className={cn(navClass, "text-emerald-600 flex items-center gap-1.5")}>
                <UtensilsCrossed size={14} /> Minha Dieta
              </NavLink>
            )}
            
            {isAllowedNutri && (
              <NavLink to="/nutri" className={cn(navClass, "text-emerald-600")}>
                Painel Nutri
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-1 sm:gap-4">
            <NavLink to="/carrinho" className="relative p-2.5 rounded-2xl hover:bg-slate-50 transition-all group">
              <ShoppingCart className="h-5 w-5 text-slate-900 group-hover:scale-110 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                  {totalItems}
                </span>
              )}
            </NavLink>

            <div className="relative" ref={dropdownRef}>
              {isAuthenticated && user ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    onClick={() => navigate("/perfil")}
                    variant="ghost"
                    className="gap-2 px-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-900 hover:bg-slate-50"
                  >
                    <User size={16} className="text-emerald-600" />
                    <span className="hidden lg:inline">{user.name?.split(" ")[0]}</span>
                  </Button>

                  {user.role === "admin" && (
                    <Button onClick={() => navigate("/admin")} variant="outline" size="icon" className="rounded-xl hidden sm:flex border-slate-200 hover:bg-emerald-50 text-emerald-600">
                      <LayoutDashboard size={18} />
                    </Button>
                  )}

                  <Button onClick={handleLogout} variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut size={18} />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Button
                    onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
                    className="hidden sm:flex rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase shadow-lg hover:bg-emerald-600 transition-all"
                  >
                    Entrar <ChevronDown size={14} className={cn("ml-2 transition-transform", authDropdownOpen && "rotate-180")} />
                  </Button>
                  
                  {authDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-60">
                      <HeaderAuthForm onSuccess={closeAuthWindows} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
