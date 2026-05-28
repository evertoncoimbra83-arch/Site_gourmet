import React, { ReactNode, useEffect } from "react"; // ✅ Adicionado React para corrigir escopo JSX
import { useLocation, useNavigate } from "react-router-dom"; 
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react"; // ✅ Removido ShieldAlert não utilizado
import { getLoginUrl } from "@/const";
import { normalizeRole, type AppRole } from "@shared/security/rbac";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole | AppRole[];
}

function hasRequiredRole(userRole: string | undefined, requiredRole: AppRole | AppRole[]) {
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
  const LOGIN_PATH = getLoginUrl();

  useEffect(() => {
    // 1. Não faz nada enquanto o Auth está carregando
    if (loading) return; 

    // 2. Se não estiver autenticado, manda para o login
    if (!isAuthenticated || !user) {
      if (pathname !== LOGIN_PATH) {
        navigate(LOGIN_PATH, { replace: true });
      }
      return;
    }

    // 3. Se estiver autenticado mas for um 'user' tentando entrar em rota 'admin'
    if (!hasRequiredRole(user.role, requiredRole)) {
      console.warn("🚫 Acesso negado: Redirecionando para a home.");
      navigate("/", { replace: true }); 
    }
    
  }, [loading, isAuthenticated, user, requiredRole, pathname, navigate, LOGIN_PATH]); 

  // --- RENDERIZAÇÃO ---

  // Enquanto o estado de autenticação é desconhecido
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white text-left">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <div className="relative">
            <div className="h-20 w-20 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl">
               <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
            {/* Efeito de brilho ao fundo */}
            <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full -z-10" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
              Sincronizando <span className="text-emerald-500">Segurança</span>
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
              Validando credenciais de acesso...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Proteção visual imediata para evitar "flicker" de conteúdo proibido
  if (!isAuthenticated || !user) return null;
  if (!hasRequiredRole(user.role, requiredRole)) return null;

  // Tudo ok! Renderiza o conteúdo protegido
  return <React.Fragment>{children}</React.Fragment>;
}
