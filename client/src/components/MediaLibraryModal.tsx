import { useState, useRef } from "react";
import { trpc } from "@/_core/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Trash2, Check } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface MediaLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  selectedUrl?: string;
}

export default function MediaLibraryModal({
  open,
  onClose,
  onSelect,
  selectedUrl,
}: MediaLibraryModalProps) {
  const utils = trpc.useUtils();

  const { data: media, isLoading } = trpc.admin.media.list.useQuery(undefined, {
    enabled: open,
  });
  const uploadMutation = trpc.admin.media.upload.useMutation();
  const deleteMutation = trpc.admin.media.delete.useMutation();

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper para garantir que a imagem apareça dentro do modal
  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith('http') || url.startsWith('/')) return url;
    return `/uploads/${url}`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(",")[1];
        await uploadMutation.mutateAsync({
          filename: file.name,
          mimeType: file.type,
          base64Data,
        });
        toast.success("Imagem enviada!");
        utils.admin.media.list.invalidate();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-175 max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold uppercase italic tracking-tighter">
            Biblioteca de <span className="text-emerald-600">Mídia</span>
          </DialogTitle>
          <DialogDescription>
            Selecione um arquivo para vincular ao método de pagamento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer relative group">
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={handleFileSelect}
              accept="image/*"
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              <p className="text-xs font-bold uppercase text-slate-500">
                {uploading ? "Enviando..." : "Clique para subir nova imagem"}
              </p>
            </div>
          </div>

          {/* Grid de Imagens */}
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-600" /></div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {media?.map((item: any) => (
                <div
                  key={item.id}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer group transition-all ${
                    selectedUrl?.includes(item.url) ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-100 hover:border-emerald-200"
                  }`}
                  onClick={() => {
                    const fileName = item.url.split('/').pop();
                    onSelect(fileName);
                    onClose();
                  }}
                >
                  <img
                    src={getImageUrl(item.url)}
                    alt="media"
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate({ id: item.id }, { onSuccess: () => utils.admin.media.list.invalidate() });
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}