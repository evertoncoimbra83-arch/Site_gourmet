// client/src/pages/admin/packages/components/drawer/PackageDrawerConfig.tsx
import React from "react";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Info } from "lucide-react";
import { PackageFormData } from "../PackageDrawer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  register: UseFormRegister<PackageFormData>;
  setValue: UseFormSetValue<PackageFormData>;
  isActive: boolean;
  isPopular: boolean;
  selectedSizeId: string | number;
  allSizes: { id: string | number; name: string }[];
}

export function PackageDrawerConfig({ register, setValue, isActive, isPopular, selectedSizeId, allSizes }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* SEÇÃO: VISIBILIDADE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-bold text-slate-900">Visibilidade Pública</Label>
            <p className="text-[11px] text-slate-400 font-medium italic">Exibir este pacote na vitrine principal do site</p>
          </div>
          <Switch checked={isActive} onCheckedChange={(v) => setValue("isActive", v)} />
        </div>
        
        <div className="h-px bg-slate-50" />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 text-orange-600">
            <div className="flex items-center gap-2">
              <Star size={16} fill={isPopular ? "currentColor" : "none"} className="transition-all" />
              <Label className="text-sm font-bold cursor-pointer">Destaque Premium</Label>
            </div>
            <p className="text-[11px] text-orange-400 font-medium ml-6">Exibe o selo de &quot;Recomendado pela Nutri&quot; e prioriza na busca</p>
          </div>
          <Switch checked={isPopular} onCheckedChange={(v) => setValue("is_popular", v)} />
        </div>
      </div>

      {/* SEÇÃO: PARÂMETROS BASE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Capacidade Total</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={12} className="text-slate-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white border-none text-[10px]">
                  Quantidade de marmitas exibida no card do site.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-1">
            <Input 
              type="number" 
              placeholder="Ex: 10"
              {...register("number_of_options")} 
              className="h-14 border-slate-100 bg-slate-50/50 text-2xl font-black text-slate-900 w-full focus-visible:ring-orange-500 rounded-2xl transition-all" 
            />
            <p className="text-[9px] text-slate-400 font-bold uppercase italic px-1">Marmitas p/ pacote</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Tamanho Padrão</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={12} className="text-slate-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white border-none text-[10px]">
                  Tamanho aplicado automaticamente a novos slots manuais.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-1">
            <Select value={String(selectedSizeId)} onValueChange={(v) => setValue("size_id", v)}>
              <SelectTrigger className="h-14 border-slate-100 bg-slate-50/50 rounded-2xl text-sm font-bold text-slate-900 focus:ring-orange-500 transition-all">
                  <SelectValue placeholder="Escolher tamanho..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                  {allSizes.map(s => (
                    <SelectItem key={s.id} value={String(s.id)} className="text-xs font-bold py-3 focus:bg-orange-50 focus:text-orange-600 rounded-xl transition-colors">
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-[9px] text-slate-400 font-bold uppercase italic px-1">Referência base de peso</p>
          </div>
        </div>
      </div>
    </div>
  );
}