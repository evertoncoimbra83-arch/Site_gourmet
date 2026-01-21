import { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, RefreshCw } from "lucide-react";
import MediaLibraryModal from "./MediaLibraryModal.tsx"; 

interface ImagePickerProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

// ✅ Envolvemos o componente em forwardRef
const ImagePicker = forwardRef<HTMLDivElement, ImagePickerProps>(
  ({ value, onChange, label = "Imagem" }, ref) => {
    const [open, setOpen] = useState(false);

    return (
      // ✅ Atribuímos a ref à div externa para o Radix conseguir gerenciar o foco
      <div className="space-y-2" ref={ref}>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          {label}
        </label>

        {value ? (
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
                <RefreshCw size={14} className="mr-2" /> Trocar
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => onChange("")}>
                <X size={14} />
              </Button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setOpen(true)}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all"
          >
            <ImagePlus size={24} className="text-slate-400 mb-2" />
            <span className="text-[10px] font-black text-slate-500 uppercase">Selecionar Foto</span>
          </div>
        )}

        <MediaLibraryModal 
          open={open} 
          onClose={() => setOpen(false)} 
          onSelect={(url) => { onChange(url); setOpen(false); }} 
          selectedUrl={value}
        />
      </div>
    );
  }
);

ImagePicker.displayName = "ImagePicker";

export default ImagePicker;