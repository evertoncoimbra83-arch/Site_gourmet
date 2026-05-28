import React, { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { APP_TITLE } from "@/const";
import { normalizeImageUrl } from "@shared/utils/assets"; // ✅ substitui processUrl + useEffect

interface SafeLogoProps {
  url?: string | null;
  className?: string;
  storeName?: string;
}

export function SafeLogo({ url, className, storeName }: SafeLogoProps) {
  const [hasError, setHasError] = useState(false);

  // ✅ URL computada direto — sem useEffect, sem state extra, sem risco de loop
  // normalizeImageUrl lida com: http/https, blob:, paths relativos, /uploads/, /public/
  const currentUrl = url ? normalizeImageUrl(url) : null;

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
        console.error("🚫 Logo falhou:", currentUrl);
        e.currentTarget.style.display = "none";
        setHasError(true);
      }}
    />
  );
}