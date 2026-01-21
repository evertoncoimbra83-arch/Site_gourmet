import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter"; 
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "user";
}

export default function ProtectedRoute({
  children,
  requiredRole = "user",
}: ProtectedRouteProps) {
  const [currentLocation, setLocation] = useLocation(); 
  const { user, loading, isAuthenticated } = useAuth();
  
  const LOGIN_PATH = getLoginUrl();

  useEffect(() => {
    // 1. Não faz nada enquanto o tRPC está buscando os dados (F5)
    if (loading) return; 

    // 2. Se não estiver autenticado, manda para o login
    // A checagem isLoginPage evita loops infinitos de redirecionamento
    if (!isAuthenticated || !user) {
      if (currentLocation !== LOGIN_PATH) {
        setLocation(LOGIN_PATH);
      }
      return;
    }

    // 3. Se estiver autenticado mas for um 'user' tentando entrar em rota 'admin'
    if (requiredRole === "admin" && user.role !== "admin") {
      console.warn("🚫 Acesso negado: Redirecionando para a home.");
      setLocation("/"); 
    }
    
  }, [loading, isAuthenticated, user, requiredRole, currentLocation, setLocation, LOGIN_PATH]); 

  // --- RENDERIZAÇÃO ---

  // Enquanto o estado de autenticação é desconhecido (carregando o me)
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground animate-pulse">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Proteção visual imediata: Se não tem usuário ou role errada, não mostra nada
  // O useEffect acima cuidará de mudar a URL logo em seguida
  if (!isAuthenticated || !user) return null;
  if (requiredRole === "admin" && user.role !== "admin") return null;

  // Tudo ok! Renderiza a página protegida
  return <>{children}</>;
}