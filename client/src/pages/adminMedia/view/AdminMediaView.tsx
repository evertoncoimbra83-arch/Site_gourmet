import React, { useMemo, useState } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import { normalizeImageUrl } from "@shared/utils/assets";
import { useAdminMedia } from "../logic/useAdminMedia";
import { MediaCard } from "../components/MediaCard";
import { UploadZone } from "../components/UploadZone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CloudUpload,
  FolderOpen,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface MediaItem {
  id: string | number;
  url: string;
  filePath?: string;
  folder?: string;
  originalFilename: string;
}

const DEFAULT_FOLDERS = ["geral", "pratos", "logo", "banners", "nutris"];

function normalizeFolder(folder?: string | null) {
  const normalized = (folder || "all").toLowerCase().trim();
  return normalized || "all";
}

export function AdminMediaView() {
  const [currentFolder, setCurrentFolder] = useState<string>("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const normalizedFolder = normalizeFolder(currentFolder);
  const { state, actions, data, refs } = useAdminMedia(normalizedFolder);
  const utils = trpc.useUtils();

  const { data: dynamicFolders, isLoading: isLoadingFolders } =
    trpc.admin.media.listFolders.useQuery();

  const sync = trpc.admin.media.syncCloudinary.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      await Promise.all([
        utils.admin.media.list.invalidate(),
        utils.admin.media.listFolders.invalidate(),
        utils.media.getImagesByFolder.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(`Erro ao sincronizar: ${error.message}`);
    },
  });

  const availableFolders = useMemo(() => {
    const merged = Array.from(
      new Set([...(dynamicFolders || []), ...DEFAULT_FOLDERS]),
    ).sort((a, b) => a.localeCompare(b));

    return ["all", ...merged];
  }, [dynamicFolders]);

  const mediaItems = (data.media as MediaItem[]) || [];
  const isProcessing = state.isLoading || sync.isPending || isLoadingFolders;
  const currentFolderLabel =
    normalizedFolder === "all"
      ? "Todas as imagens"
      : `Pasta: ${normalizedFolder}`;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col items-start justify-between gap-6 pt-4 md:flex-row md:items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600">
            <Sparkles size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Biblioteca Digital
            </span>
          </div>
          <h1 className="text-4xl font-black uppercase leading-none tracking-tight text-slate-900 md:text-5xl">
            Media <span className="text-emerald-600">Assets</span>
          </h1>
          <p className="pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {currentFolderLabel}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => sync.mutate()}
            disabled={isProcessing}
            className="h-12 gap-2 rounded-2xl border-slate-200 px-6 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50"
          >
            {sync.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Sincronizar Cloudinary
          </Button>

          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 gap-2 rounded-2xl bg-slate-900 px-8 font-bold uppercase text-[10px] tracking-widest text-white shadow-md hover:bg-emerald-600">
                <CloudUpload size={18} /> Novo Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] border-none p-1 shadow-2xl sm:max-w-150">
              <div className="space-y-6 p-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">
                    Enviar para{" "}
                    <span className="text-emerald-600">
                      {normalizedFolder === "all" ? "geral" : normalizedFolder}
                    </span>
                  </DialogTitle>
                </DialogHeader>

                <UploadZone
                  state={{ ...state, isDragging: false }}
                  actions={{
                    ...actions,
                    setIsDragging: () => {},
                    processFiles: async (files, folder) => {
                      await actions.processFiles(files, folder);
                      setIsUploadModalOpen(false);
                    },
                  }}
                  refs={refs}
                  currentFolder={normalizedFolder === "all" ? "geral" : normalizedFolder}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Tabs
        defaultValue="all"
        value={normalizedFolder}
        onValueChange={setCurrentFolder}
        className="w-full"
      >
        <div className="border-b border-slate-100 pb-2">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="h-auto gap-6 bg-transparent p-0">
              {availableFolders.map((folder) => (
                <TabsTrigger
                  key={folder}
                  value={folder}
                  className="rounded-none px-2 pb-3 font-bold uppercase text-[11px] tracking-wider text-slate-400 transition-all hover:text-slate-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-600 data-[state=active]:shadow-none"
                >
                  <FolderOpen size={14} className="mr-2" />
                  {folder === "all" ? "todas" : folder}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
        </div>

        <TabsContent value={normalizedFolder} className="mt-8 focus-visible:outline-none">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-40">
              <Loader2
                className="animate-spin text-emerald-600/30"
                size={60}
                strokeWidth={2}
              />
              <p className="mt-4 font-bold uppercase text-[10px] tracking-widest text-slate-400">
                Carregando conteudo...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {currentFolderLabel}
              </p>

              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {mediaItems.length > 0 ? (
                  mediaItems.map((item) => {
                    const finalUrl = item.url || item.filePath || "";
                    const displayUrl = normalizeImageUrl(finalUrl) || "";

                    return (
                      <MediaCard
                        key={item.id}
                        item={{
                          ...item,
                          url: finalUrl,
                          displayUrl,
                          originalFilename: item.originalFilename || "imagem",
                        }}
                        onCopy={() => actions.copyToClipboard(displayUrl)}
                        onDelete={() => actions.handleDelete(item.id)}
                      />
                    );
                  })
                ) : (
                  <Card className="col-span-full flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed bg-slate-50/50 py-28 text-slate-300">
                    <ImagePlus
                      size={40}
                      strokeWidth={1.5}
                      className="mb-4 opacity-30"
                    />
                    <p className="font-bold uppercase text-xs tracking-wider text-slate-500">
                      Nenhuma imagem nesta pasta
                    </p>
                    <Button
                      variant="link"
                      className="mt-2 font-bold uppercase text-[9px] tracking-widest text-emerald-600"
                      onClick={() => setIsUploadModalOpen(true)}
                    >
                      Adicionar agora
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <footer className="flex justify-center border-t border-slate-50 pt-16">
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-6 py-3">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Media Studio 2.0 • Gourmet Saudavel
          </span>
        </div>
      </footer>
    </div>
  );
}
