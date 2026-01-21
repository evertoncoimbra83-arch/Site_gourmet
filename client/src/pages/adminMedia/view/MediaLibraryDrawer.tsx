import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Image as ImageIcon, 
  UploadCloud, 
  Search, 
  CheckCircle2, 
  Loader2,
  Trash2
} from "lucide-react";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";

interface MediaLibraryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export function MediaLibraryDrawer({ open, onClose, onSelect }: MediaLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const utils = trpc.useUtils();

  // ✅ Busca as imagens
  const { data: images, isLoading } = trpc.admin.media.list.useQuery(undefined, {
    enabled: open
  });
  
  // ✅ Mutation de Upload Real
  const uploadMutation = trpc.admin.media.upload.useMutation({
    onSuccess: () => {
      utils.admin.media.list.invalidate();
      toast.success("Upload concluído!");
    },
    onError: (err) => toast.error("Erro no upload: " + err.message)
  });

  const deleteMutation = trpc.admin.media.delete.useMutation({
    onSuccess: () => {
      utils.admin.media.list.invalidate();
      toast.success("Imagem removida");
    }
  });

  // ✅ Função para garantir que a URL seja absoluta para exibição dentro do Drawer
  const getFullImageUrl = (img: any) => {
    const path = img?.url || img?.filePath || "";
    if (!path) return "";
    if (path.startsWith("http")) return path;
    
    const API_URL = "http://localhost:3001"; 
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    
    if (!cleanPath.includes("/uploads/")) {
        return `${API_URL}/uploads${cleanPath}`;
    }
    return `${API_URL}${cleanPath}`;
  };

  // ✅ Upload Real convertendo para Base64
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(",")[1];
        await uploadMutation.mutateAsync({
          filename: file.name,
          mimeType: file.type,
          base64Data,
        });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredImages = images?.filter(img => {
    const fileName = img?.originalFilename || ""; 
    return fileName.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0 border-none bg-[#F8FAFC] flex flex-col h-screen outline-none z-[110]">
        
        {/* HEADER */}
        <div className="p-8 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <ImageIcon size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Assets & Media</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <SheetTitle className="text-3xl font-black uppercase text-slate-900 tracking-tighter italic leading-none">
                Biblioteca de <span className="text-emerald-600">Mídia</span>
              </SheetTitle>
              <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">
                Pressione F12 para ver os logs de seleção.
              </SheetDescription>
            </div>

            <label className="cursor-pointer">
              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" disabled={isUploading} />
              <div className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 transition-all active:scale-95 shadow-lg">
                {isUploading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
                <span className="font-black uppercase text-[10px] tracking-widest">Novo Arquivo</span>
              </div>
            </label>
          </div>
        </div>

        {/* BARRA DE BUSCA */}
        <div className="p-8 pb-0 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <Input 
              placeholder="Buscar pelo nome do arquivo..." 
              className="h-14 pl-12 rounded-2xl bg-white border-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* GRID DE IMAGENS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-300">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest text-center">Sincronizando Galeria...</p>
            </div>
          ) : filteredImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map((img) => {
                const fullUrl = getFullImageUrl(img);
                return (
                  <div 
                    key={img.id}
                    className="group relative aspect-square rounded-[2rem] bg-white border border-slate-100 overflow-hidden cursor-pointer transition-all hover:border-emerald-500 hover:shadow-xl hover:-translate-y-1"
                  >
                    <img 
                      src={fullUrl} 
                      className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-110" 
                      alt={img.originalFilename || "Mídia"}
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/400x400/f1f5f9/cbd5e1?text=404";
                      }}
                    />
                    
                    <div 
                      onClick={() => {
                        // ✅ AJUSTE CRÍTICO: Extrai apenas o nome do arquivo para o Drawer pai
                        const fileName = fullUrl.split('/').pop() || fullUrl;
                        console.log("🎯 [MEDIA SELECT]: Enviando para o Drawer:", fileName);
                        onSelect(fileName);
                        onClose();
                      }}
                      className="absolute inset-0 bg-emerald-600/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all p-4 text-center"
                    >
                      <CheckCircle2 className="text-white mb-2" size={32} />
                      <span className="text-white font-black text-[10px] uppercase tracking-widest">Selecionar</span>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if(confirm("Excluir esta imagem?")) deleteMutation.mutate({ id: img.id });
                      }}
                      className="absolute top-3 right-3 h-8 w-8 bg-white/90 text-red-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[3rem]">
              <ImageIcon className="text-slate-100 mb-4" size={64} />
              <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Nenhuma mídia encontrada</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-8 bg-white border-t border-slate-100 shrink-0">
          <Button variant="ghost" onClick={onClose} className="w-full h-14 rounded-2xl font-black text-[10px] tracking-widest uppercase text-slate-400">
            Fechar Galeria
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}