import React, { useState } from "react"; // ✅ Adicionado React para resolver erros de escopo JSX
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ Importação absoluta mantida conforme sua correção anterior
import { MediaLibraryDrawer } from "@/pages/adminMedia/view/MediaLibraryDrawer";

interface ImagePickerProps {
  label?: string;
  value?: string | null;
  onChange: (url: string) => void;
  className?: string;
}

export default function ImagePicker({ label, value, onChange, className }: ImagePickerProps) {
  const [open, setOpen] = useState(false);

  const getPreviewUrl = (path: string | null | undefined) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("blob:")) return path;

    const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
    let clean = path.replace(/\\/g, "/");

    if (clean.includes("/uploads/")) clean = clean.split("/uploads/")[1];
    else if (clean.includes("/public/")) clean = clean.split("/public/")[1];

    clean = clean.replace(/^\//, "");
    if (!clean.startsWith("uploads/")) clean = `uploads/${clean}`;

    return `${baseUrl}/${clean}`;
  };

  const handleSelect = (url: string) => {
    let cleanPath = url;
    if (url.includes("/uploads/")) {
        const parts = url.split("/uploads/");
        cleanPath = `uploads/${parts[parts.length - 1]}`;
    }
    onChange(cleanPath);
    setOpen(false);
  };

  const previewUrl = getPreviewUrl(value);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>}
      
      <div className="relative group">
        {value ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-slate-100 bg-slate-50 shadow-sm transition-all hover:border-emerald-500/50">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="h-full w-full object-contain p-2"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { 
                e.currentTarget.style.display = 'none'; 
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-[2px]">
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(true)} className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-emerald-500 hover:text-white transition-colors shadow-lg">
                <ImagePlus size={18} />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onChange(""); }} className="h-10 w-10 rounded-full bg-white text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-lg">
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-slate-400 transition-all hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-600 group">
            <div className="rounded-full bg-white p-3 shadow-sm group-hover:scale-110 transition-transform">
              <ImageIcon size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Selecionar Imagem</span>
          </button>
        )}
      </div>

      <MediaLibraryDrawer open={open} onClose={() => setOpen(false)} onSelect={handleSelect} />
    </div>
  );
}