import React, { useCallback } from "react";
import { ClipboardList, Home, Image as ImageIcon, LogIn, Package, ShieldCheck, ShoppingBag, Stethoscope, UserCircle, UtensilsCrossed } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/_core/CartContext";
import { cn } from "@/lib/utils";
import { hasAdminPermission, isAdminRole } from "@shared/security/rbac";

interface CartContextType {
  items?: { quantity: number }[];
  cart?: { quantity: number }[];
  totals?: { totalQuantity?: number };
}

export function MobileBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isAdminUser = isAdminRole(user?.role);
  const cartContext = useCart() as unknown as CartContextType;

  const totalCartItems =
    cartContext?.totals?.totalQuantity ??
    (cartContext?.items || cartContext?.cart || []).reduce(
      (acc, item) => acc + (item.quantity || 0),
      0,
    );
  const hasCartItems = totalCartItems > 0;

  const handleProfileClick = useCallback(() => {
    if (user) {
      navigate(isAdminRole(user.role) ? "/admin" : "/perfil");
    } else {
      window.dispatchEvent(new CustomEvent("open-auth-drawer"));
    }
  }, [user, navigate]);

  const adminItems = [
    { label: "Site", icon: Home, path: "/" },
    { label: "Pedidos", icon: ShoppingBag, path: "/admin/orders" },
    {
      label: "Produtos",
      icon: UtensilsCrossed,
      path: "/admin/dishes",
      permission: "catalog:manage" as const,
    },
    {
      label: "Midia",
      icon: ImageIcon,
      path: "/admin/media",
      permission: "media:manage" as const,
    },
  ].filter((item) => !item.permission || hasAdminPermission(user?.role, item.permission));

  const clientItems = [
    { label: "Inicio", icon: Home, path: "/" },
    { label: "Cardapio", icon: UtensilsCrossed, path: "/produtos" },
    { label: "Pacotes", icon: Package, path: "/pacotes" },
  ];

  if (user && !isAdminUser) {
    if (user.role === "customer" || user.role === "user") {
      clientItems.push({
        label: "Meu Plano",
        icon: ClipboardList,
        path: "/meu-plano",
      });
    }

    if (user.role === "nutri") {
      clientItems.push({
        label: "Pacientes",
        icon: Stethoscope,
        path: "/nutri/dashboard",
      });
    }
  }

  const activeItems = isAdminUser ? adminItems : clientItems;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-[2.5rem] border-t border-slate-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex justify-around items-center h-20 px-2">
        {activeItems.map((item) => {
          const isActive =
            pathname === item.path || pathname.startsWith(item.path + "/");
          const showCartBadge =
            item.path === "/" && hasCartItems && !isAdminUser;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300 flex-1 relative active:scale-90",
                isActive ? "text-emerald-600" : "text-slate-400",
              )}
            >
              <div
                className={cn(
                  "relative p-2 rounded-2xl transition-all duration-300",
                  isActive ? "bg-emerald-50 shadow-sm" : "bg-transparent",
                )}
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "fill-emerald-100" : "fill-transparent",
                  )}
                />
                {showCartBadge && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-emerald-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                    {totalCartItems > 9 ? "9+" : totalCartItems}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[8px] font-black uppercase tracking-tighter leading-none text-center",
                  isActive ? "text-emerald-700" : "text-slate-400",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        <button
          onClick={handleProfileClick}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-all duration-300 flex-1 relative active:scale-90",
            pathname === "/perfil" || pathname.startsWith("/admin")
              ? "text-emerald-600"
              : "text-slate-400",
          )}
        >
          <div
            className={cn(
              "p-2 rounded-2xl transition-all duration-300",
              pathname === "/perfil" || pathname.startsWith("/admin")
                ? "bg-emerald-50 shadow-sm"
                : "bg-transparent",
            )}
          >
            {user ? (
              isAdminUser ? (
                <ShieldCheck
                  size={20}
                  strokeWidth={pathname.startsWith("/admin") ? 2.5 : 1.8}
                  className={cn(
                    "text-blue-600 transition-all",
                    pathname.startsWith("/admin")
                      ? "fill-blue-100"
                      : "fill-transparent",
                  )}
                />
              ) : (
                <UserCircle
                  size={20}
                  strokeWidth={pathname === "/perfil" ? 2.5 : 1.8}
                  className={cn(
                    "transition-all duration-300",
                    pathname === "/perfil"
                      ? "fill-emerald-100"
                      : "fill-transparent",
                  )}
                />
              )
            ) : (
              <LogIn size={20} strokeWidth={2.2} className="text-amber-500" />
            )}
          </div>
          <span
            className={cn(
              "text-[8px] font-black uppercase tracking-tighter leading-none text-center",
              pathname === "/perfil" || pathname.startsWith("/admin")
                ? "text-emerald-700"
                : "text-slate-400",
            )}
          >
            {user ? (isAdminUser ? "Admin" : "Perfil") : "Entrar"}
          </span>
        </button>
      </div>
    </nav>
  );
}
