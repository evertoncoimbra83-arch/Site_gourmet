import React, { useEffect, useMemo, useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, ChevronLeft, Folder, ImageOff, Loader2 } from "lucide-react";

interface MediaItem {
  id: string | number;
  url?: string;
  filePath?: string;
  folder?: string;
  originalFilename?: string;
}

interface MediaLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  selectedUrl?: string;
  defaultFolder?: string;
}

const DEFAULT_FOLDERS = ["logo", "pratos", "banners", "nutris", "geral"];

function normalizeFolder(folder?: string | null) {
  const normalized = (folder || "all").toLowerCase().trim();
  return normalized || "all";
}

export default function MediaLibraryModal({
  open,
  onClose,
  onSelect,
  selectedUrl,
  defaultFolder,
}: MediaLibraryModalProps) {
  const [currentFolder, setCurrentFolder] = useState<string | null>(
    defaultFolder || null,
  );
  const normalizedFolder = normalizeFolder(currentFolder);

  useEffect(() => {
    if (open) {
      setCurrentFolder(defaultFolder || null);
    }
  }, [defaultFolder, open]);

  const { data: folders = [] } = trpc.admin.media.listFolders.useQuery(undefined, {
    enabled: open,
  });
  const { data: media, isLoading } = trpc.admin.media.list.useQuery(
    {
      folder: normalizedFolder === "all" ? undefined : normalizedFolder,
    },
    { enabled: open && !!currentFolder },
  );

  const availableFolders = useMemo(() => {
    return Array.from(new Set(["all", ...DEFAULT_FOLDERS, ...folders])).sort((a, b) => {
      if (a === "all") return -1;
      if (b === "all") return 1;
      return a.localeCompare(b);
    });
  }, [folders]);

  const getFullUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    const cleanPath = url
      .replace(/\\/g, "/")
      .replace(/^\/?public\//, "")
      .replace(/^\//, "");
    const finalPath = cleanPath.startsWith("uploads/")
      ? cleanPath
      : `uploads/${cleanPath}`;
    return `${baseUrl}/${finalPath}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col overflow-hidden rounded-4xl border-none bg-white p-0 shadow-2xl outline-none">
        <DialogHeader className="p-8 pb-4 text-left">
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
            Biblioteca de <span className="text-emerald-600">Midia</span>
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Selecione arquivos da biblioteca por pasta
          </DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-8 pt-2">
          {currentFolder && !defaultFolder ? (
            <button
              type="button"
              onClick={() => setCurrentFolder(null)}
              className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 transition-colors hover:text-slate-900"
            >
              <ChevronLeft size={14} /> Voltar para Pastas
            </button>
          ) : null}

          {!currentFolder ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {availableFolders.map((folder) => (
                <div
                  key={folder}
                  onClick={() => setCurrentFolder(folder)}
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 transition-all hover:border-emerald-500 hover:shadow-xl"
                >
                  <Folder
                    size={40}
                    className="fill-amber-100 text-amber-400 transition-all group-hover:fill-amber-400"
                  />
                  <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
                    {folder === "all" ? "todas" : folder}
                  </span>
                </div>
              ))}
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="animate-spin text-emerald-600" size={48} />
            </div>
          ) : !media?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <ImageOff size={48} className="mb-4 opacity-20" />
              <p className="font-bold uppercase text-[10px] text-slate-500">
                Nenhuma imagem nesta pasta
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {normalizedFolder === "all"
                  ? "Todas as imagens"
                  : `Pasta: ${normalizedFolder}`}
              </p>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {(media as MediaItem[])?.map((item) => {
                  const imageUrl = item.url || item.filePath || "";
                  const fullUrl = getFullUrl(imageUrl);
                  const isSelected = selectedUrl === imageUrl;

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelect(imageUrl)}
                      className={`relative aspect-square cursor-pointer overflow-hidden rounded-[1.8rem] border-4 transition-all duration-300 ${
                        isSelected
                          ? "scale-95 border-emerald-600 shadow-lg"
                          : "border-slate-50 hover:border-slate-200"
                      }`}
                    >
                      <img
                        src={fullUrl}
                        className={`h-full w-full object-cover ${
                          isSelected ? "brightness-75" : ""
                        }`}
                        alt={item.originalFilename || "Midia"}
                        onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
                          event.currentTarget.src =
                            "https://placehold.co/400x400?text=Erro+URL";
                        }}
                      />
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                        {item.folder || "geral"}
                      </div>
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle2
                            className="fill-emerald-600 text-white"
                            size={32}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t bg-slate-50/80 p-6">
          <Button
            onClick={onClose}
            className="rounded-xl bg-emerald-600 px-8 font-black uppercase text-[10px] text-white"
          >
            Concluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
