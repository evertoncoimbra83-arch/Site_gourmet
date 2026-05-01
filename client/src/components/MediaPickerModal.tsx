import React, { useEffect, useMemo, useState } from "react";
import { trpc } from "@/_core/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Folder, ChevronLeft, ImagePlus, Search } from "lucide-react";

interface MediaItem {
  id: string | number;
  url: string;
  folder?: string;
  originalFilename?: string;
}

interface MediaPickerModalProps {
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

export const MediaPickerModal = ({
  open,
  onClose,
  onSelect,
  defaultFolder,
}: MediaPickerModalProps) => {
  const [currentFolder, setCurrentFolder] = useState<string | null>(
    defaultFolder || null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedFolder = normalizeFolder(currentFolder);

  useEffect(() => {
    if (open) {
      setCurrentFolder(defaultFolder || null);
      setSearchTerm("");
    }
  }, [defaultFolder, open]);

  const { data: folders = [] } = trpc.admin.media.listFolders.useQuery(undefined, {
    enabled: open,
  });
  const { data: media } = trpc.admin.media.list.useQuery(
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

  const filteredMedia = useMemo(() => {
    const items = (media as MediaItem[]) || [];
    if (!searchTerm.trim()) return items;

    const search = searchTerm.toLowerCase().trim();
    return items.filter((item) =>
      (item.originalFilename || "").toLowerCase().includes(search),
    );
  }, [media, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="flex h-[85vh] max-w-4xl flex-col overflow-hidden rounded-4xl border-none bg-white p-0 shadow-2xl outline-none">
        <DialogHeader className="shrink-0 border-b border-slate-100 p-6 md:p-8">
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-slate-900">
            Biblioteca <span className="text-emerald-500">Gourmet</span>
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase text-slate-400">
            {defaultFolder ? "Selecione imagens da pasta configurada" : "Navegue pela biblioteca"}
          </DialogDescription>

          <div className="relative mt-4 w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <Input
              placeholder="Buscar pelo nome..."
              className="h-12 rounded-2xl border-none bg-slate-50 pl-11 text-[10px] font-bold uppercase tracking-widest transition-all focus-visible:ring-emerald-500"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </DialogHeader>

        <div className="custom-scrollbar flex-1 overflow-y-auto bg-slate-50/30 p-6 md:p-8">
          <div className="mb-6 flex min-h-10 items-center justify-between">
            {currentFolder && !defaultFolder ? (
              <button
                type="button"
                onClick={() => setCurrentFolder(null)}
                className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 transition-colors hover:text-slate-900"
              >
                <ChevronLeft size={14} /> Voltar para Pastas
              </button>
            ) : (
              <span className="text-[10px] font-black uppercase italic tracking-widest text-slate-400">
                {currentFolder
                  ? normalizedFolder === "all"
                    ? "Todas as imagens"
                    : `Pasta: ${normalizedFolder}`
                  : "Diretorio de arquivos"}
              </span>
            )}
          </div>

          {!currentFolder ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {availableFolders.map((folder) => (
                <div
                  key={folder}
                  onClick={() => setCurrentFolder(folder)}
                  className="group relative flex cursor-pointer flex-col items-center rounded-3xl bg-white p-8 transition-all hover:border-emerald-500 hover:shadow-xl"
                >
                  <Folder
                    size={48}
                    className="mb-4 fill-amber-50 text-amber-400 group-hover:fill-amber-400"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    {folder === "all" ? "todas" : folder}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {normalizedFolder === "all"
                  ? "Todas as imagens"
                  : `Pasta: ${normalizedFolder}`}
              </p>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredMedia.length > 0 ? (
                  filteredMedia.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelect(item.url || "")}
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border-2 border-transparent bg-white shadow-sm transition-all hover:border-emerald-500"
                    >
                      <img
                        src={item.url.replace("/upload/", "/upload/w_400,f_auto,q_auto/")}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={item.originalFilename || "Preview"}
                      />
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                        {item.folder || "geral"}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-[1px]">
                        <ImagePlus size={20} className="text-white" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-300">
                    <Folder size={48} strokeWidth={1} className="mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
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
};
