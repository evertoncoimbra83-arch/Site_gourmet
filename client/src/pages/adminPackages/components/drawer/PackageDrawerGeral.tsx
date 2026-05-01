// client/src/pages/admin/packages/components/drawer/PackageDrawerGeral.tsx
import React from "react";
import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, CheckCircle2, Tag } from "lucide-react";
import { PackageFormData } from "../PackageDrawer";

interface Props {
  register: UseFormRegister<PackageFormData>;
  watch: UseFormWatch<PackageFormData>;
  setValue: UseFormSetValue<PackageFormData>;
  setIsMediaOpen: (open: boolean) => void;
  categories: string[];
}

export function PackageDrawerGeral({ register, watch, setValue, setIsMediaOpen, categories }: Props) {
  const imageUrl = watch("image_url");
  const currentCategory = watch("category");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left">
      
      {/* Nome e Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-8 space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
            Nome do Pacote Comercial
          </Label>
          <Input 
            {...register("name", { required: true })} 
            className="h-14 border-slate-100 bg-slate-50/30 shadow-none focus-visible:ring-orange-500 font-bold text-slate-800 rounded-2xl text-base" 
            placeholder="Ex: Kit Performance 10 Refeições"
          />
        </div>
        <div className="col-span-12 md:col-span-4 space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
            Categoria no Site
          </Label>
          <Select 
            value={currentCategory || undefined} 
            onValueChange={(v) => setValue("category", v)}
          >
            <SelectTrigger className="h-14 border-slate-100 bg-white rounded-2xl font-bold text-slate-700">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
              {categories.map(c => (
                <SelectItem key={c} value={c} className="text-xs font-bold uppercase py-3 rounded-xl focus:bg-orange-50 focus:text-orange-600 transition-colors">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Seção de Preços */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
           <Tag size={80} className="text-slate-900" />
        </div>
        
        <div className="space-y-3 relative">
          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Preço Base de Venda (R$)
          </Label>
          <div className="relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
             <Input 
                {...register("base_price", { required: true })} 
                className="h-14 border-slate-200 pl-11 font-black text-xl text-slate-800 rounded-2xl focus-visible:ring-slate-900 transition-all shadow-sm" 
                placeholder="0.00" 
             />
          </div>
        </div>

        <div className="space-y-3 relative">
          <Label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1">
            Preço Oferta / Promocional (R$)
          </Label>
          <div className="relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300 font-bold text-sm">R$</span>
             <Input 
                {...register("sale_price")} 
                className="h-14 border-orange-100 bg-orange-50/20 pl-11 font-black text-xl text-orange-600 rounded-2xl placeholder:text-orange-200 focus-visible:ring-orange-500 shadow-sm" 
                placeholder="Opcional" 
             />
          </div>
        </div>
      </div>

      {/* Capa da Vitrine */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
          Capa da Vitrine
        </Label>
        <div 
          onClick={() => setIsMediaOpen(true)} 
          className="w-full h-64 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-orange-300 transition-all overflow-hidden bg-white group shadow-inner"
        >
          {imageUrl ? (
            <div className="relative w-full h-full">
               <img src={imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Preview" />
               <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white text-slate-900 px-4 py-2 rounded-full font-black text-[10px] uppercase shadow-xl">Alterar Imagem</span>
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-300 transition-colors group-hover:text-orange-400">
              <div className="p-5 bg-slate-50 rounded-3xl group-hover:bg-orange-50 transition-colors">
                <Camera size={32} strokeWidth={1.5} />
              </div>
              <div className="text-center">
                 <span className="text-[11px] font-black uppercase tracking-widest block">Selecionar da Nuvem</span>
                 <span className="text-[9px] font-bold text-slate-400 uppercase block mt-1">Formatos sugeridos: JPG, PNG ou WEBP</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Highlights */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
          Destaques e Benefícios (Chips)
        </Label>
        <div className="relative">
          <Input 
            {...register("highlights")} 
            placeholder="Ex: Proteína Premium, Low Carb, Sem Glúten" 
            className="h-14 border-slate-100 bg-slate-50/30 pl-12 shadow-none focus-visible:ring-orange-500 rounded-2xl font-medium text-slate-700" 
          />
          <CheckCircle2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase italic ml-2 tracking-tight">
          💡 Use vírgula para criar múltiplos selos de destaque no card.
        </p>
      </div>
    </div>
  );
}