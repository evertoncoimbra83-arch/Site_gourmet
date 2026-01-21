import { Button } from "@/components/ui/button";
import { Copy, Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";

export function MediaCard({ item, onCopy, onDelete }: any) {
  const [hasError, setHasError] = useState(false);

  // ✅ Usamos displayUrl que vem do AdminMediaView (já tratada pelo hook)
  const imageUrl = item.displayUrl || item.url;

  return (
    <div className="group relative aspect-square rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 transition-all hover:shadow-2xl hover:-translate-y-1">
      
      {hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center">
          <AlertCircle size={24} className="mb-2 opacity-50" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Erro ao carregar imagem</span>
        </div>
      ) : (
        <img 
          src={imageUrl} 
          alt={item.originalFilename} 
          // ✅ Crucial para evitar bloqueio de porta cruzada (CORS)
          crossOrigin="anonymous"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          onError={() => {
            console.error("🟥 Erro na renderização da imagem:", imageUrl);
            setHasError(true);
          }}
        />
      )}
      
      {/* OVERLAY DE AÇÕES */}
      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px] z-10">
        <Button 
          size="icon" variant="secondary" 
          className="rounded-xl h-12 w-12 bg-white text-slate-900 hover:bg-emerald-500 hover:text-white border-none shadow-xl transition-colors"
          title="Copiar Link"
          onClick={(e) => { 
            e.stopPropagation(); 
            onCopy(imageUrl); 
          }}
        >
          <Copy size={20} />
        </Button>
        <Button 
          size="icon" variant="destructive" 
          className="rounded-xl h-12 w-12 bg-red-500 hover:bg-red-600 shadow-xl border-none"
          title="Excluir"
          onClick={(e) => { 
            e.stopPropagation(); 
            onDelete(item.id); 
          }}
        >
          <Trash2 size={20} />
        </Button>
      </div>

      {/* FOOTER COM NOME - Estilizado para não cobrir a imagem totalmente */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-3 border-t border-slate-100 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-[9px] font-black text-slate-600 uppercase truncate text-center tracking-tighter">
          {item.originalFilename}
        </p>
      </div>
    </div>
  );
}