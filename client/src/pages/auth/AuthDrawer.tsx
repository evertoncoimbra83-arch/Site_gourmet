// e:/IA/projects/Site_React/client/src/pages/auth/AuthDrawer.tsx

import React, { useContext, useEffect } from "react";
import { AuthContext } from "@/_core/context";
import { HeaderAuthForm } from "./HeaderLoginForm"; 
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"; 

export function AuthDrawer() {
  const context = useContext(AuthContext);

  // ✅ ADICIONADO: Ouvinte de evento para abrir o modal via Menu Mobile
  useEffect(() => {
    if (!context) return;

    const handleOpenEvent = () => {
      // Abre o modal usando a função do seu Contexto
      context.openAuthModal(); 
    };

    window.addEventListener("open-auth-drawer", handleOpenEvent);
    
    return () => {
      window.removeEventListener("open-auth-drawer", handleOpenEvent);
    };
  }, [context]);

  if (!context) return null;

  return (
    <Sheet 
      open={context.isAuthModalOpen} 
      onOpenChange={(open) => !open && context.closeAuthModal()}
    >
      <SheetContent side="right" className="w-full sm:max-w-md p-0 border-none bg-white">
        
        {/* Título invisível para acessibilidade */}
        <SheetTitle className="sr-only">Acesso à sua conta</SheetTitle>

        <div className="p-8 h-full overflow-y-auto">
          <HeaderAuthForm 
            onSuccess={() => context.closeAuthModal()} 
            // ✅ FIX 2322: Fazendo o cast para string para satisfazer o TypeScript
            initialEmail={context.authModalData?.initialEmail as string | undefined}
            initialMode={context.authModalMode}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}