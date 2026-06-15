import React, { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { normalizeRole, type AppRole } from "@shared/security/rbac";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole | AppRole[];
}

export function hasRequiredRole(
  userRole: string | undefined,
  requiredRole: AppRole | AppRole[],
) {
  const role = normalizeRole(userRole);
  const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (required.includes(role)) return true;
  if (required.includes("admin")) {
    return role === "super_admin" || role === "admin" || role === "operator";
  }
  return false;
}

export default function ProtectedRoute({
  children,
  requiredRole = "user",
}: ProtectedRouteProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuth();
  const loginPath = getLoginUrl();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      if (pathname !== loginPath) {
        navigate(loginPath, { replace: true });
      }
    }
  }, [loading, isAuthenticated, user, pathname, navigate, loginPath]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white text-left">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <div className="relative">
            <div className="h-20 w-20 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
            <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full -z-10" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
              Sincronizando <span className="text-emerald-500">Seguranca</span>
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
              Validando credenciais de acesso...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  if (!hasRequiredRole(user.role, requiredRole)) {
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center bg-slate-50 px-4 text-left">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-xl font-black uppercase italic tracking-tight text-slate-900">
            Acesso restrito
          </h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            Sua conta esta autenticada, mas nao possui permissao para abrir esta
            area. Entre com uma conta autorizada ou volte para a pagina inicial.
          </p>
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="mt-6 h-11 rounded-xl bg-slate-900 px-5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-slate-800"
          >
            Voltar para inicio
          </button>
        </div>
      </div>
    );
  }

  return <React.Fragment>{children}</React.Fragment>;
}
