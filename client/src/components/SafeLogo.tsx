import React, { useState, useEffect } from "react"; // ✅ Adicionado React para corrigir escopo JSX
import { UtensilsCrossed } from "lucide-react";
import { APP_TITLE } from "@/const";

interface SafeLogoProps {
  url?: string | null;
  className?: string;
  storeName?: string;
}

export function SafeLogo({ url, className, storeName }: SafeLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  // Lógica segura de tratamento de URL
  const processUrl = (rawUrl: string | null | undefined) => {
    if (!rawUrl) return null;
    if (rawUrl.startsWith("http") || rawUrl.startsWith("blob:")) return rawUrl;
    
    const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
    let clean = rawUrl.replace(/\\/g, "/");
    
    if (clean.includes("/uploads/")) clean = clean.split("/uploads/")[1];
    else if (clean.includes("/public/")) clean = clean.split("/public/")[1];

    clean = clean.replace(/^\//, "");
    if (!clean.startsWith("uploads/")) clean = `uploads/${clean}`;
    
    return `${baseUrl}/${clean}`;
  };

  // Efeito que só atualiza a URL se ela realmente mudou, evitando loops
  useEffect(() => {
    const newUrl = processUrl(url);
    if (newUrl !== currentUrl) {
      setCurrentUrl(newUrl);
      setHasError(false);
    }
  }, [url, currentUrl]); 

  if (hasError || !currentUrl) {
    return (
      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/50 px-3 py-1 rounded-lg text-left">
         <div className="h-6 w-6 bg-emerald-100 rounded-md flex items-center justify-center shrink-0">
              <UtensilsCrossed size={14} />
         </div>
         <span className="font-black uppercase tracking-tighter text-sm leading-none truncate max-w-[120px]">
              {storeName || APP_TITLE || "Gourmet"}
         </span>
      </div>
    );
  }

  return (
    <img 
      src={currentUrl} 
      alt={storeName || "Logo"} 
      className={className} 
      onError={(e) => {
        console.error("🚫 Logo falhou (Removendo do DOM):", currentUrl);
        e.currentTarget.style.display = "none"; 
        setHasError(true); 
      }}
    />
  );
}