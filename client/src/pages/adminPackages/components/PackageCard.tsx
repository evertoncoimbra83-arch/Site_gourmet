// client/src/pages/adminPackages/components/PackageCard.tsx
import React from "react";
import { MoreHorizontal, Edit3, Trash2, Eye, EyeOff, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PackageCardProps {
  pkg: {
    id: string;
    name: string;
    price: string | number;
    sale_price?: string | number | null;
    number_of_options: number;
    isActive: boolean;
    category?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

export function PackageCard({ pkg, onEdit, onDelete, onToggleStatus }: PackageCardProps) {
  const money = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 hover:shadow-md transition-all">
      <div className="flex items-center gap-4 min-w-0">
        <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
          <Package size={20} />
        </div>
        
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-slate-900 truncate text-sm md:text-base">{pkg.name}</h3>
            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter h-5 border-slate-100 text-slate-400">
              {pkg.category || "Geral"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <span className="text-slate-900 font-bold">{pkg.number_of_options}</span> Slots
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-200" />
            <span className="text-slate-900 font-bold">{money(Number(pkg.sale_price || pkg.price))}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center mr-4">
           {pkg.isActive ? (
             <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-emerald-100 text-[9px] font-black">ATIVO</Badge>
           ) : (
             <Badge className="bg-slate-100 text-slate-400 hover:bg-slate-100 border-slate-200 text-[9px] font-black">INATIVO</Badge>
           )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-900">
              <MoreHorizontal size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl border-slate-100 w-48">
            <DropdownMenuItem onClick={onEdit} className="gap-2 font-bold text-xs p-3 cursor-pointer">
              <Edit3 size={14} /> Editar Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleStatus} className="gap-2 font-bold text-xs p-3 cursor-pointer">
              {pkg.isActive ? <><EyeOff size={14} /> Ocultar no Site</> : <><Eye size={14} /> Publicar no Site</>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="gap-2 font-bold text-xs p-3 cursor-pointer text-red-500 focus:text-red-500">
              <Trash2 size={14} /> Excluir Pacote
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}