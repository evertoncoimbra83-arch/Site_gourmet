import React, { useEffect, useMemo, useState } from "react";
import { trpc } from "@/_core/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Folder, ChevronLeft, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  getImageFallback,
  normalizeImageUrlForStorage,
  resolveImageUrl,
} from "@shared/utils/image-url";

interface CloudinaryImage {
  id: string;
  url: string;
  name: string;
  format: string;
  folder?: string;
}

interface MediaLibraryModalProps {
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
  defaultFolder?: string;
}

const DEFAULT_FOLDERS = ["logo", "pratos", "banners", "nutris", "geral"];

function normalizeFolder(folder?: string | null) {
  const normalized = (folder || "all").toLowerCase().trim();
  return normalized || "all";
}

export function MediaLibraryModal({
  onSelect,
  trigger,
  defaultFolder,
}: MediaLibraryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(
    defaultFolder || null,
  );
  const normalizedFolder = normalizeFolder(currentFolder);

  useEffect(() => {
    if (isOpen) {
      setCurrentFolder(defaultFolder || null);
    }
  }, [defaultFolder, isOpen]);

  const { data: folders = [] } = trpc.admin.media.listFolders.useQuery(undefined, {
    enabled: isOpen,
  });
  const { data: images, isLoading } = trpc.media.getImagesByFolder.useQuery(
    { folder: normalizedFolder },
    { enabled: isOpen && !!currentFolder },
  );

  const availableFolders = useMemo(() => {
    return Array.from(new Set(["all", ...DEFAULT_FOLDERS, ...folders])).sort((a, b) => {
      if (a === "all") return -1;
      if (b === "all") return 1;
      return a.localeCompare(b);
    });
  }, [folders]);

  const handleSelect = (url: string) => {
    const storageUrl = normalizeImageUrlForStorage(url);
    if (!storageUrl) return;
    onSelect(storageUrl);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button type="button" className="rounded border p-2">
            Abrir Galeria
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="flex h-[80vh] max-w-4xl flex-col overflow-hidden rounded-4xl border-none p-0 shadow-2xl outline-none">
        <DialogHeader className="shrink-0 bg-slate-900 p-6 text-white">
          <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase italic tracking-tighter">
            <ImageIcon size={20} className="text-emerald-400" /> Biblioteca de Midia
          </DialogTitle>
          <DialogDescription className="sr-only">
            Navegue pelas pastas da biblioteca
          </DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="mb-6 flex items-center justify-between">
            {currentFolder ? (
              <button
                type="button"
                onClick={() => setCurrentFolder(null)}
                className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 transition-colors hover:text-slate-900"
              >
                <ChevronLeft size={14} /> Voltar para Pastas
              </button>
            ) : (
              <span className="text-[10px] font-black uppercase italic tracking-widest text-slate-400">
                Selecione uma pasta para navegar
              </span>
            )}
          </div>

          {!currentFolder ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {availableFolders.map((folder) => (
                <div
                  key={folder}
                  onClick={() => setCurrentFolder(folder)}
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-emerald-500 hover:shadow-xl"
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
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Buscando na biblioteca...
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {normalizedFolder === "all"
                  ? "Todas as imagens"
                  : `Pasta: ${normalizedFolder}`}
              </p>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {(images as CloudinaryImage[])?.map((image) => (
                  <div
                    key={image.id}
                    onClick={() => handleSelect(image.url)}
                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border-2 border-transparent bg-white shadow-sm transition-all hover:border-emerald-500"
                  >
                    <img
                      src={resolveImageUrl(image.url, "generic").replace(
                        "/upload/",
                        "/upload/w_400,f_auto,q_auto/",
                      )}
                      alt={image.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(event) => {
                        event.currentTarget.src = getImageFallback("generic");
                      }}
                    />
                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                      {image.folder || "geral"}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="rounded-full bg-white px-3 py-1.5 shadow-xl">
                        <span className="text-[9px] font-black uppercase text-emerald-600">
                          Selecionar
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {(!images || images.length === 0) && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-300">
                    <ImageIcon size={48} strokeWidth={1} />
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Nenhuma imagem nesta pasta
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
