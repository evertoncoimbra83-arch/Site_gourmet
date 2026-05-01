import React, { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, RefreshCw, AlertCircle } from "lucide-react";

// ✅ CORREÇÃO: Apontando para a pasta shared dentro de components
import { MediaPickerModal } from "@/components/MediaPickerModal"; 

interface ImagePickerProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

const ImagePicker = forwardRef<HTMLDivElement, ImagePickerProps>(
  ({ value, onChange, label = "Imagem" }, ref) => {
    const [open, setOpen] = useState(false);
    const [hasError, setHasError] = useState(false);

    /**
     * ✅ FUNÇÃO DE URL SIMPLIFICADA (Cloudinary Friendly)
     */
    const getFullUrl = (url: string) => {
      if (!url) return "";
      // Se for Cloudinary (https), retorna direto
      if (url.startsWith("http")) return url;
      
      // Fallback para legado (local)
      const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"; 
      const cleanPath = url.replace(/\\/g, "/").replace(/^public\//, "");
      return `${BACKEND_URL}/${cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath}`;
    };

    const imageUrl = value ? getFullUrl(value) : "";

    return (
      <div className="space-y-2 text-left" ref={ref}>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          {label}
        </label>

        {value ? (
          <div className="space-y-2">
            <div className={`relative aspect-video w-full rounded-[2.5rem] overflow-hidden border-2 bg-slate-50 group shadow-sm transition-all ${hasError ? 'border-red-300' : 'border-slate-100 hover:border-emerald-500'}`}>
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                onLoad={() => setHasError(false)}
                onError={() => setHasError(true)}
              />
              
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)} className="h-9 px-4 rounded-xl font-black text-[10px] uppercase shadow-lg border-none active:scale-95 transition-all">
                  <RefreshCw size={14} className="mr-2 text-emerald-600" /> Trocar
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => { onChange(""); setHasError(false); }} className="h-9 px-4 rounded-xl font-black text-[10px] uppercase shadow-lg border-none active:scale-95 transition-all">
                  <X size={14} />
                </Button>
              </div>
            </div>

            {hasError && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-[10px] flex items-start gap-2 animate-in fade-in zoom-in-95">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <div className="space-y-1 break-all">
                  <p className="font-bold uppercase tracking-tighter">Imagem não encontrada na nuvem</p>
                  <p className="opacity-70 italic font-mono text-[9px]">{imageUrl}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div 
            onClick={() => setOpen(true)} 
            className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group gap-4 shadow-inner"
          >
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all duration-300">
              <ImagePlus size={28} className="text-slate-400 group-hover:text-emerald-600" />
            </div>
            <div className="text-center">
              <span className="block text-[10px] font-black text-slate-400 group-hover:text-emerald-600 uppercase tracking-widest transition-colors">
                Selecionar Mídia da Nuvem
              </span>
              <p className="text-[8px] text-slate-300 uppercase font-bold mt-1 group-hover:text-emerald-400">Cloudinary Ativo</p>
            </div>
          </div>
        )}

        {/* ✅ Modal integrado usando a referência global */}
        <MediaPickerModal 
          open={open} 
          onClose={() => setOpen(false)} 
          onSelect={(url: string) => { 
            // Para o Cloudinary, salvamos a URL completa (HTTPS)
            onChange(url); 
            setOpen(false); 
          }} 
          defaultFolder="geral" 
        />
      </div>
    );
  }
);

ImagePicker.displayName = "ImagePicker";

export default ImagePicker;