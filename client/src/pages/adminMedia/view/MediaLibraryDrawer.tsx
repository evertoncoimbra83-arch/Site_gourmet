import React, { useEffect, useMemo, useState } from "react";
import { trpc } from "@/_core/trpc";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { CheckCircle2, ChevronLeft, Folder, Loader2 } from "lucide-react";

interface CloudinaryResource {
  id: string;
  url: string;
  name: string;
  folder?: string;
}

interface MediaLibraryDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  defaultFolder?: string;
}

const DEFAULT_FOLDERS = ["logo", "pratos", "banners", "nutris", "geral"];

function normalizeFolder(folder?: string | null) {
  const normalized = (folder || "all").toLowerCase().trim();
  return normalized || "all";
}

export const MediaLibraryDrawer = ({
  open,
  onClose,
  onSelect,
  defaultFolder,
}: MediaLibraryDrawerProps) => {
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
  const { data: images, isLoading } = trpc.media.getImagesByFolder.useQuery(
    { folder: normalizedFolder },
    { enabled: open && !!currentFolder },
  );

  const availableFolders = useMemo(() => {
    return Array.from(new Set(["all", ...DEFAULT_FOLDERS, ...folders])).sort((a, b) => {
      if (a === "all") return -1;
      if (b === "all") return 1;
      return a.localeCompare(b);
    });
  }, [folders]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="flex h-screen w-full flex-col border-none bg-slate-50 p-0 outline-none sm:max-w-3xl"
      >
        <div className="shrink-0 bg-slate-900 p-8 text-white">
          <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter text-white">
            Biblioteca <span className="text-emerald-400">Cloud</span>
          </SheetTitle>
          <SheetDescription className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Selecione assets otimizados do Cloudinary
          </SheetDescription>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {currentFolder ? (
            <button
              type="button"
              onClick={() => setCurrentFolder(null)}
              className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 transition-colors hover:text-emerald-700"
            >
              <ChevronLeft size={14} /> Voltar para Pastas
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {availableFolders.map((folder) => (
                <div
                  key={folder}
                  onClick={() => setCurrentFolder(folder)}
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-slate-100 bg-white p-8 transition-all hover:border-emerald-500 hover:shadow-xl"
                >
                  <Folder
                    size={40}
                    className="fill-amber-100 text-amber-400 transition-colors group-hover:fill-amber-400"
                  />
                  <span className="mt-3 font-black uppercase tracking-widest text-slate-600">
                    {folder === "all" ? "todas" : folder}
                  </span>
                </div>
              ))}
            </div>
          )}

          {currentFolder && (
            <div className="mt-6 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {normalizedFolder === "all"
                  ? "Todas as imagens"
                  : `Pasta: ${normalizedFolder}`}
              </p>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {isLoading ? (
                  <div className="col-span-full flex flex-col items-center gap-4 py-20">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Carregando...
                    </span>
                  </div>
                ) : (images as CloudinaryResource[])?.length ? (
                  (images as CloudinaryResource[]).map((image) => (
                    <div
                      key={image.id}
                      onClick={() => {
                        onSelect(image.url);
                        onClose();
                      }}
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition-all hover:shadow-lg"
                    >
                      <img
                        src={image.url.replace("/upload/", "/upload/w_400,f_auto,q_auto/")}
                        className="h-full w-full object-cover p-2 transition-transform duration-500 group-hover:scale-110"
                        alt={image.name}
                      />
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                        {image.folder || "geral"}
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-600/80 p-4 text-center opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100">
                        <CheckCircle2 className="mb-2 text-white" size={24} />
                        <span className="text-[8px] font-black uppercase tracking-widest leading-tight text-white">
                          {image.name}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-300">
                    <Folder size={48} strokeWidth={1} className="opacity-20" />
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Nenhuma imagem nesta pasta
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white p-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-slate-600"
          >
            Fechar Biblioteca
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
