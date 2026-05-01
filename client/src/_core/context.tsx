import React, { createContext, useState, useMemo } from "react";
import { trpc } from "./trpc"; 

// ✅ 1. Definição da interface do usuário logado
interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
  customerDocument?: string | null;
}

interface AuthContextType {
  // Dados do Usuário
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Controle do Modal
  isAuthModalOpen: boolean;
  authModalMode: "login" | "register";
  authModalData: Record<string, unknown> | null;
  openAuthModal: (mode?: "login" | "register", data?: Record<string, unknown> | null) => void;
  closeAuthModal: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ✅ 2. Busca automática do usuário logado via tRPC
  const { data: user, isLoading, isError } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
  });

  // ✅ 3. Estados do Modal de Autenticação
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  // ✅ Tipagem do estado do modal
  const [modalData, setModalData] = useState<Record<string, unknown> | null>(null);

  const openAuthModal = (
    m: "login" | "register" = "login", 
    d: Record<string, unknown> | null = null
  ) => {
    setMode(m);
    setModalData(d);
    setIsOpen(true);
  };

  const closeAuthModal = () => {
    setIsOpen(false);
    setModalData(null);
  };

  // ✅ 4. Memoização do contexto para evitar re-renderizações desnecessárias
  const contextValue = useMemo(() => ({
    user: (user as AuthUser) ?? null,
    isAuthenticated: !!user && !isError,
    isLoading,
    isAuthModalOpen: isOpen,
    authModalMode: mode,
    authModalData: modalData,
    openAuthModal,
    closeAuthModal
  }), [user, isError, isLoading, isOpen, mode, modalData]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}