import { useRef, useState } from "react";
import { trpc } from "../../../_core/trpc";
import { appToast as toast } from "@/lib/app-toast";

function normalizeFolder(folder?: string | null) {
  const normalized = (folder || "all").toLowerCase().trim();
  return normalized || "all";
}

export function useAdminMedia(currentFolder?: string | null) {
  const utils = trpc.useUtils();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizedFolder = normalizeFolder(currentFolder);
  const listFolder = normalizedFolder === "all" ? undefined : normalizedFolder;

  const { data: media, isLoading } = trpc.admin.media.list.useQuery({
    folder: listFolder,
  });
  const uploadMutation = trpc.admin.media.upload.useMutation();
  const deleteMutation = trpc.admin.media.delete.useMutation();

  const invalidateMediaQueries = async () => {
    await Promise.all([
      utils.admin.media.list.invalidate(),
      utils.admin.media.listFolders.invalidate(),
      utils.media.getImagesByFolder.invalidate(),
    ]);
  };

  const processFiles = async (files: File[], folder: string | null = "geral") => {
    if (files.length === 0) return;

    const requestedFolder = normalizeFolder(folder);
    const targetFolder = requestedFolder === "all" ? "geral" : requestedFolder;

    setIsUploading(true);
    let successCount = 0;

    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error(`O arquivo ${file.name} nao e uma imagem valida.`);
          continue;
        }

        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
          });

          await uploadMutation.mutateAsync({
            filename: file.name,
            mimeType: file.type,
            base64Data: base64.split(",")[1],
            folder: targetFolder,
          });
          successCount++;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Erro desconhecido";
          console.error(`Erro no upload de ${file.name}:`, error);
          toast.error(`Erro ao subir ${file.name}: ${message}`);
        }
      }

      if (successCount > 0) {
        await invalidateMediaQueries();
        toast.success(`${successCount} arquivo(s) enviado(s) para: ${targetFolder}`);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getFullUrl = (url: string) => {
    if (!url) return "";

    if (url.startsWith("https://res.cloudinary.com")) {
      if (url.includes("/q_auto,f_auto/")) {
        return url;
      }

      if (url.includes("/upload/")) {
        return url.replace("/upload/", "/upload/q_auto,f_auto/");
      }

      return url;
    }

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    const cleanPath = url.replace(/^\/?public\//, "").replace(/^\//, "");
    return `${baseUrl}/${cleanPath}`;
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;

    const absoluteUrl = getFullUrl(text);
    navigator.clipboard
      .writeText(absoluteUrl)
      .then(() => toast.success("Link copiado para a area de transferencia!"))
      .catch(() => toast.error("Falha ao copiar link."));
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Excluir imagem permanentemente da nuvem e do banco?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      await invalidateMediaQueries();
      toast.success("Arquivo removido com sucesso.");
    } catch (error) {
      console.error("Erro ao deletar:", error);
      toast.error("Erro ao excluir imagem.");
    }
  };

  return {
    state: { isUploading, isLoading },
    actions: {
      processFiles,
      handleDelete,
      getFullUrl,
      copyToClipboard,
      triggerSelect: () => fileInputRef.current?.click(),
    },
    data: { media: media || [] },
    refs: { fileInputRef },
  };
}
