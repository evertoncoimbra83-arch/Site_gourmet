// client/src/components/Header.tsx
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
  UtensilsCrossed
} from "lucide-react"; // 🌟 Sparkles removido para manter os imports limpos
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Search, X } from "lucide-react";
import { useCart } from "@/_core/CartContext";
import { useOnClickOutside } from "@/_core/hooks/useOnClickOutside";
import { cn } from "@/lib/utils";
import { safeJsonParse } from "@/lib/safe-parse";
import { getImageFallback, resolveImageUrl } from "@shared/utils/image-url";
import { isAdminRole } from "@shared/security/rbac";
import { HeaderAuthForm } from "@/pages/auth/HeaderLoginForm";

const STATIC_LOGO_URL = getImageFallback("logo");

interface AuthUser {
  id: string;
  name?: string | null;
  role?: string;
  referral?: string | null;
  referralCode?: string | null;
  professionalId?: string | null;
  professional_id?: string | null;
}

interface CartItem {
  quantity: number;
}

interface CartContextType {
  items?: CartItem[];
  cart?: CartItem[];
}

interface CompanySocialInfo {
  logoUrl?: string;
}

interface StoreSettings {
  logoUrl?: string;
  logo_url?: string;
  companyInfo?: string | CompanySocialInfo;
  company_social_info?: string | CompanySocialInfo;
}

interface HeaderSearchProduct {
  id: string | number;
  name: string;
  slug?: string | null;
  description?: string | null;
  categoryName?: string | null;
}

export default function Header() {
  const { user: rawUser, logout, isAuthenticated } = useAuth();
  const user = rawUser as AuthUser | null;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const trpcContext = trpc.useUtils();

  const isAllowedNutri = isAdminRole(user?.role) || user?.role === "nutri";

  // CORREÇÃO: Menu agora se baseia no perfil logado confiando na validação da rota /meu-plano
  const hasActivePrescription = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    const isCustomer = user.role === "customer" || user.role === "user";
    return isCustomer;
  }, [isAuthenticated, user]);

  const cartContext = useCart() as unknown as CartContextType;
  const cartItems = cartContext?.items || cartContext?.cart || [];
  const totalItems = cartItems.reduce(
    (acc: number, item: CartItem) => acc + (item.quantity || 0),
    0,
  );

  const { data: rawStoreSettings, isLoading: isLoadingSettings } =
    trpc.store.public.getPublicSettings.useQuery(undefined, {
      staleTime: Infinity,
      retry: false,
    });

  const [hasError, setHasError] = useState(false);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(dropdownRef as React.RefObject<HTMLElement>, () =>
    setAuthDropdownOpen(false),
  );

  const closeAuthWindows = () => setAuthDropdownOpen(false);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(searchValue.trim()),
      250,
    );
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        desktopSearchRef.current?.contains(target) ||
        mobileSearchRef.current?.contains(target)
      ) {
        return;
      }
      setSearchOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const shouldSearch = debouncedSearch.length >= 2;
  const { data: searchResults = [], isFetching: isSearching } =
    trpc.public.dishes.list.useQuery(
      { page: 1, perPage: 6, search: debouncedSearch },
      { enabled: shouldSearch, retry: false },
    );

  const headerSearchResults = searchResults as HeaderSearchProduct[];

  const goToSearch = (query = searchValue.trim()) => {
    if (!query) return;
    setSearchOpen(false);
    navigate(`/produtos?q=${encodeURIComponent(query)}`);
  };

  const goToProduct = (product: HeaderSearchProduct) => {
    const dishRef = product.slug || String(product.id);
    setSearchOpen(false);
    setSearchValue("");
    navigate(`/produtos?prato=${encodeURIComponent(dishRef)}`);
  };

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
    setSearchOpen(false);
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
      return resolveImageUrl(dbLogo, "logo") || STATIC_LOGO_URL;
    }

    return STATIC_LOGO_URL;
  };

  const currentSrc = getLogoSrc();

  if (pathname.startsWith("/admin")) return null;

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "text-slate-500 hover:text-primary transition-colors relative py-1",
      isActive &&
      "text-primary font-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary",
    );

  const renderSearchResults = () => {
    if (!searchOpen || !shouldSearch) return null;

    return (
      <div className="absolute left-0 right-0 top-full z-60 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
        {isSearching ? (
          <div className="flex items-center gap-2 px-4 py-4 text-[10px] font-black uppercase text-slate-400">
            <Loader2 size={14} className="animate-spin" />
            Buscando
          </div>
        ) : headerSearchResults.length > 0 ? (
          <div className="py-2">
            {headerSearchResults.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => goToProduct(product)}
                className="block w-full px-4 py-3 text-left hover:bg-slate-50"
              >
                <span className="block text-xs font-black uppercase text-slate-900">
                  {product.name}
                </span>
                <span className="mt-1 block truncate text-[10px] font-bold uppercase text-slate-400">
                  {product.categoryName || product.description || "Cardapio"}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => goToSearch()}
              className="w-full border-t border-slate-100 px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
            >
              Ver todos os resultados
            </button>
          </div>
        ) : (
          <div className="px-4 py-4 text-[10px] font-black uppercase text-slate-400">
            Nenhum produto encontrado
          </div>
        )}
      </div>
    );
  };

  const renderSearchInput = (placeholder: string) => (
    <>
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={searchValue}
        onChange={(event) => {
          setSearchValue(event.target.value);
          setSearchOpen(true);
        }}
        onFocus={() => setSearchOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") goToSearch();
          if (event.key === "Escape") setSearchOpen(false);
        }}
        placeholder={placeholder}
        className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-9 text-xs font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
      />
      {searchValue && (
        <button
          type="button"
          onClick={() => setSearchValue("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Limpar busca"
        >
          <X size={14} />
        </button>
      )}
      {renderSearchResults()}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-md shadow-sm">
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

          {/* 🌟 NAVEGAÇÃO COMPACTADA SEM O LINK DE "CARDÁPIO IA" */}
          <nav className="hidden md:flex items-center gap-8 font-black uppercase text-[11px] tracking-widest">
            <NavLink to="/" className={navClass} end>Início</NavLink>
            <NavLink to="/produtos" className={navClass}>Cardápio</NavLink>
            <NavLink to="/pacotes" className={navClass}>Pacotes</NavLink>

            {hasActivePrescription && (
              <NavLink
                to="/meu-plano"
                className={cn(navClass, "text-primary flex items-center gap-1.5")}
              >
                <UtensilsCrossed size={14} /> Minha Dieta
              </NavLink>
            )}

            {isAllowedNutri && (
              <NavLink to="/nutri" className={cn(navClass, "text-primary")}>
                Painel Nutri
              </NavLink>
            )}
          </nav>

          <div
            ref={desktopSearchRef}
            className="relative hidden min-w-0 flex-1 max-w-xs lg:max-w-sm md:block"
          >
            {renderSearchInput("Buscar pratos")}
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            <NavLink
              to="/carrinho"
              className="relative p-2.5 rounded-2xl hover:bg-primary/10 transition-all group"
            >
              <ShoppingCart className="h-5 w-5 text-foreground group-hover:scale-110 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
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
                    className="gap-2 px-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-foreground hover:bg-primary/10"
                  >
                    <User size={16} className="text-primary" />
                    <span className="hidden lg:inline">{user.name?.split(" ")[0]}</span>
                  </Button>

                  {isAdminRole(user.role) && (
                    <Button
                      onClick={() => navigate("/admin")}
                      variant="outline"
                      size="icon"
                      className="rounded-xl hidden sm:flex border-border hover:bg-primary/10 text-primary"
                    >
                      <LayoutDashboard size={18} />
                    </Button>
                  )}

                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="icon"
                    className="rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Button
                    onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
                    className="hidden sm:flex rounded-xl bg-primary text-white text-[10px] font-black uppercase shadow-lg hover:bg-primary-hover transition-all"
                  >
                    Entrar{" "}
                    <ChevronDown
                      size={14}
                      className={cn("ml-2 transition-transform", authDropdownOpen && "rotate-180")}
                    />
                  </Button>

                  {authDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-surface rounded-3xl shadow-2xl border border-border p-6 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-60">
                      <HeaderAuthForm onSuccess={closeAuthWindows} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="pb-3 md:hidden">
          <div ref={mobileSearchRef} className="relative">
            {renderSearchInput("Buscar frango, fit, vegano...")}
          </div>
        </div>
      </div>
    </header>
  );
}