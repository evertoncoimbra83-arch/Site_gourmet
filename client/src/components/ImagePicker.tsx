import React, { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, RefreshCw, AlertCircle } from "lucide-react";
import { MediaLibraryDrawer } from "@/pages/adminMedia/view/MediaLibraryDrawer";
import { getImageFallback, resolveImageUrl } from "@shared/utils/image-url";
import { normalizeImageUrl } from "@shared/utils/assets"; // ✅ substitui getFullUrl com localhost hardcoded

interface ImagePickerProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  initialFolder?: string;
}

const ImagePicker = forwardRef<HTMLDivElement, ImagePickerProps>(
  ({ value, onChange, label = "Imagem", initialFolder = "geral" }, ref) => {
    const [open, setOpen] = useState(false);
    const [hasError, setHasError] = useState(false);

    // ✅ normalizeImageUrl lida com Cloudinary (https), caminhos relativos e legados
    // Elimina o fallback hardcoded "http://localhost:3001"
    const imageUrl = value ? resolveImageUrl(value, "generic") : "";

    return (
      <div className="space-y-2 text-left" ref={ref}>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          {label}
        </label>

        {value ? (
          <div className="space-y-2">
            <div className={`relative aspect-video w-full rounded-[2.5rem] overflow-hidden border-2 bg-slate-50 group shadow-sm transition-all ${hasError ? "border-red-300" : "border-slate-100 hover:border-emerald-500"}`}>
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onLoad={() => setHasError(false)}
                onError={(event) => {
                  setHasError(true);
                  event.currentTarget.src = getImageFallback("generic");
                }}
              />

              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setOpen(true)}
                  className="h-9 px-4 rounded-xl font-black text-[10px] uppercase shadow-lg border-none active:scale-95 transition-all"
                >
                  <RefreshCw size={14} className="mr-2 text-emerald-600" /> Trocar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => { onChange(""); setHasError(false); }}
                  className="h-9 px-4 rounded-xl font-black text-[10px] uppercase shadow-lg border-none active:scale-95 transition-all"
                >
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
              <p className="text-[8px] text-slate-300 uppercase font-bold mt-1 group-hover:text-emerald-400">
                Cloudinary Ativo
              </p>
            </div>
          </div>
        )}

        <MediaLibraryDrawer
          open={open}
          onClose={() => setOpen(false)}
          onSelect={(url: string) => {
            onChange(url);
            setOpen(false);
          }}
          initialFolder={initialFolder}
        />
      </div>
    );
  },
);

ImagePicker.displayName = "ImagePicker";

export default ImagePicker;