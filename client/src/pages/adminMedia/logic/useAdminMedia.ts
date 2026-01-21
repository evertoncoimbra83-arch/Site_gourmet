import { useState, useRef } from "react";
// Verifique se este caminho está certo no seu projeto
import { trpc } from "../../../_core/trpc"; 
import { toast } from "@/components/ui/use-toast";

export function useAdminMedia() {
  const utils = trpc.useUtils();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: media, isLoading } = trpc.admin.media.list.useQuery(undefined);
  const uploadMutation = trpc.admin.media.upload.useMutation();
  const deleteMutation = trpc.admin.media.delete.useMutation();

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    let successCount = 0;

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
        });

        await uploadMutation.mutateAsync({
          filename: file.name,
          mimeType: file.type,
          base64Data: base64.split(",")[1],
        });
        successCount++;
      } catch (err) {
        console.error("Erro upload:", err);
      }
    }

    if (successCount > 0) {
      toast.success("Imagens salvas!");
      utils.admin.media.list.invalidate();
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ CORREÇÃO DA URL: Removemos qualquer lixo para o link ficar limpo
  const getFullUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith('http')) return url;
    
    // Removemos "/public/" se vier do banco e barras iniciais
    const cleanPath = url.replace('/public/', '/').replace(/^\//, ''); 
    return `http://localhost:3001/${cleanPath}`;
  };

  const handleDelete = async (id: any) => {
    if (!confirm("Excluir imagem?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Imagem deletada");
      utils.admin.media.list.invalidate();
    } catch (e) {
      toast.error("Erro ao deletar");
    }
  };

  return {
    state: { isUploading, isLoading },
    actions: { processFiles, handleDelete, getFullUrl, triggerSelect: () => fileInputRef.current?.click() },
    data: { media: media || [] },
    refs: { fileInputRef }
  };
}