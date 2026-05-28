import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, Trash2, AlertCircle, MoreVertical, Eye } from "lucide-react";

// --- INTERFACES ---

interface MediaItem {
  id: string | number;
  url: string;
  displayUrl?: string;
  originalFilename: string;
}

interface MediaCardProps {
  item: MediaItem;
  onCopy: (url: string) => void;
  onDelete: (id: string | number) => void;
}

export function MediaCard({ item, onCopy, onDelete }: MediaCardProps) {
  const [hasError, setHasError] = useState(false);

  const imageUrl = item.displayUrl || item.url;

  return (
    <Card className="group overflow-hidden border-none bg-transparent shadow-none transition-all duration-500 hover:-translate-y-2">
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-100 shadow-sm transition-all duration-500 group-hover:shadow-2xl">
          
          {/* ASPECT RATIO: Garante que a foto da marmita nunca achate */}
          <AspectRatio ratio={1 / 1}>
            {hasError ? (
              <div className="flex h-full w-full flex-col items-center justify-center space-y-2 bg-slate-50 text-slate-300">
                <AlertCircle size={32} strokeWidth={1} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Mídia não encontrada
                </span>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={item.originalFilename}
                crossOrigin="anonymous"
                className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                onError={() => setHasError(true)}
              />
            )}
          </AspectRatio>

          {/* OVERLAY MINIMALISTA (Preset Sera style) */}
          <div className="absolute inset-0 bg-slate-950/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          {/* AÇÕES RÁPIDAS NO TOPO */}
          <div className="absolute right-4 top-4 flex flex-col gap-2 opacity-0 transition-all duration-500 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg hover:bg-white"
                >
                  <MoreVertical size={18} className="text-slate-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl border-none p-2 shadow-2xl">
                <DropdownMenuItem 
                  className="flex items-center gap-3 rounded-xl py-3 font-bold text-slate-600 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer"
                  onClick={() => onCopy(imageUrl)}
                >
                  <Copy size={16} /> Copiar Link
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-3 rounded-xl py-3 font-bold text-red-500 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 size={16} /> Excluir permanentemente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* BOTÃO DE VISUALIZAÇÃO CENTRAL (Aparece no hover) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100 scale-90 group-hover:scale-100 pointer-events-none">
             <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl">
                <Eye size={16} className="text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Visualizar</span>
             </div>
          </div>
        </div>

        {/* NOME DO ARQUIVO COM PLAYFAIR DISPLAY (via Sera Preset) */}
        <div className="mt-4 px-2 text-left">
          <p className="truncate font-serif text-sm italic text-slate-800 transition-colors group-hover:text-emerald-700">
            {item.originalFilename}
          </p>
          <div className="mt-1 h-0.5 w-0 bg-emerald-500 transition-all duration-500 group-hover:w-full" />
        </div>
      </CardContent>
    </Card>
  );
}