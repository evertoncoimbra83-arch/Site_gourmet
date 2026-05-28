import React from "react"; // ✅ Adicionado para escopo JSX
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Trash2, CheckCircle2, Loader2, Home, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ Tipagem definida para evitar 'any'
interface Address {
  id: string | number;
  label: string;
  street: string;
  number: string | number;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  complement?: string;
  isDefault: boolean;
}

interface AddressesTabProps {
  addresses: Address[];
  isLoading: boolean;
  onSetDefault: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  isSettingDefault: boolean;
  isDeleting: boolean;
  onAddNew: () => void;
}

const safeString = (val: unknown) => {
  if (!val) return "";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
};

export function AddressesTab({ 
  addresses, 
  isLoading, 
  onSetDefault, 
  onDelete, 
  isSettingDefault, 
  isDeleting,
  onAddNew
}: AddressesTabProps) {

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 max-w-full overflow-x-hidden">
      
      {/* ➕ BOTÃO ADICIONAR NOVO */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 md:p-4 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto px-2">
           <div className="bg-[#D4AF37]/10 p-2 rounded-full shrink-0">
             <MapPin className="h-4 w-4 text-[#D4AF37]" />
           </div>
           <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
             Meus Locais de Entrega
           </span>
        </div>
        <Button 
          type="button" 
          onClick={(e) => {
            e.preventDefault();
            onAddNew();
          }}
          className="w-full sm:w-auto rounded-xl md:rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[9px] md:text-[10px] tracking-widest px-6 h-10 md:h-11 transition-all active:scale-95 shrink-0"
        >
          <Plus className="h-3.5 w-3.5 mr-2" />
          Novo Endereço
        </Button>
      </div>

      {isLoading ? (
        <div className="p-10 md:p-12 text-center flex flex-col items-center gap-2">
          <Loader2 className="h-7 w-7 md:h-8 md:w-8 animate-spin text-[#D4AF37]" />
          <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 italic">Buscando endereços...</span>
        </div>
      ) : (addresses?.length || 0) === 0 ? (
        <div className="p-10 md:p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl md:rounded-[2.5rem] bg-slate-50/50">
          <MapPin className="h-8 w-8 md:h-10 md:w-10 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-black uppercase text-[9px] md:text-[10px] tracking-widest leading-tight">Nenhum endereço cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-1">
          {addresses.map((addr) => (
            <Card 
              key={addr.id} 
              className={cn(
                "rounded-3xl shadow-sm transition-all duration-300 relative overflow-hidden",
                addr.isDefault 
                ? 'border-2 border-slate-900 bg-white shadow-xl shadow-slate-100' 
                : 'bg-slate-50/60 hover:bg-white border border-slate-100 hover:shadow-md'
              )}
            >
              <CardContent className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "p-2 rounded-xl shrink-0",
                      addr.isDefault ? 'bg-slate-900 text-white' : 'bg-white shadow-sm border border-slate-100'
                    )}>
                      <Home className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 truncate text-left">
                      <p className="font-bold text-slate-800 text-sm tracking-tight truncate">
                        {safeString(addr.label) || "Endereço"}
                      </p>
                      {addr.isDefault && (
                        <span className="inline-block mt-0.5 text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                          Padrão de Entrega
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-350 hover:text-red-500 hover:bg-red-50 transition-colors rounded-full shrink-0" 
                    onClick={() => onDelete(addr.id)} 
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="space-y-1 text-left pb-4 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-700 leading-tight">
                    {safeString(addr.street)}, {safeString(addr.number)}
                  </p>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {safeString(addr.neighborhood)} {addr.complement && `— ${safeString(addr.complement)}`}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
                    {safeString(addr.city)}/{safeString(addr.state)} — {safeString(addr.zipCode)}
                  </p>
                </div>

                <div className="pt-3 flex justify-between items-center h-8">
                  {!addr.isDefault ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSetDefault(addr.id)}
                      disabled={isSettingDefault}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 p-0 hover:bg-transparent flex items-center gap-1.5"
                    >
                      {isSettingDefault ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Definir como padrão
                    </Button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-50" />
                      Pronto para entrega
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}