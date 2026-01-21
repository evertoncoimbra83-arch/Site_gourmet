import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/_core/trpc";
import { Loader2, CheckCircle2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  selectedUrl?: string;
}

export default function MediaLibraryModal({ open, onClose, onSelect, selectedUrl }: MediaLibraryModalProps) {
  // ✅ Busca as imagens do banco
  const { data: media, isLoading } = trpc.admin.media.list.useQuery(undefined, {
    enabled: open 
  });

  /**
   * 🛠️ Helper para resolver a URL da imagem
   * Se a imagem for local (/uploads/...), adiciona o endereço do servidor.
   */
  const getFullUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    
    // Altere para a porta do seu backend se for diferente de 3001
    const BACKEND_URL = "http://localhost:3001"; 
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    
    return `${BACKEND_URL}${cleanUrl}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col rounded-[2.5rem] border-none p-0 bg-white shadow-2xl">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
            Biblioteca de <span className="text-[#D4AF37]">Mídia</span>
          </DialogTitle>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            Selecione um arquivo da sua galeria local
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 pt-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="animate-spin text-[#D4AF37]" size={48} />
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">
                Sincronizando arquivos...
              </p>
            </div>
          ) : media?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <ImageOff size={48} className="mb-4 opacity-20" />
              <p className="font-bold uppercase text-[10px] tracking-widest">Nenhuma mídia encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {media?.map((item: any) => {
                const fullUrl = getFullUrl(item.url);
                const isSelected = selectedUrl === item.url;

                return (
                  <div 
                    key={item.id}
                    onClick={() => onSelect(item.url)}
                    className={`
                      relative aspect-square rounded-[1.8rem] overflow-hidden cursor-pointer border-4 transition-all duration-300 group
                      ${isSelected 
                        ? "border-[#D4AF37] scale-95 shadow-[0_10px_30px_rgba(212,175,55,0.3)]" 
                        : "border-slate-100 hover:border-slate-200 hover:scale-[1.02]"}
                    `}
                  >
                    <img 
                      src={fullUrl} 
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
                        isSelected && "brightness-75"
                      )} 
                      alt={item.name || "Mídia"} 
                    />
                    
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 className="text-white fill-[#D4AF37] drop-shadow-md" size={40} />
                      </div>
                    )}

                    {/* Overlay de hover com nome da imagem */}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-black/40 backdrop-blur-sm translate-y-full group-hover:translate-y-0 transition-transform">
                       <p className="text-[8px] text-white font-bold truncate text-center uppercase">
                         {item.filename || 'Arquivo'}
                       </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 flex justify-between items-center">
          <span className="text-[9px] font-black uppercase text-slate-400 ml-4">
            {media?.length || 0} Arquivos detectados
          </span>
          <Button 
            onClick={onClose} 
            className="rounded-xl px-8 bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] h-12 transition-all active:scale-95"
          >
            Concluir Seleção
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** * Helper para utilitário de classes (opcional, remova se não usar tailwind-merge) 
 */
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
} 