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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
          {addresses.map((addr) => (
            <Card 
              key={addr.id} 
              className={cn(
                "rounded-3xl md:rounded-[2rem] shadow-sm transition-all duration-300 relative overflow-hidden",
                addr.isDefault 
                ? 'border-2 border-[#D4AF37] bg-white shadow-xl shadow-[#D4AF37]/5' 
                : 'bg-slate-50 hover:bg-white border border-slate-100'
              )}
            >
              <CardContent className="p-5 md:p-8">
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "p-2.5 md:p-3 rounded-xl md:rounded-2xl shrink-0",
                      addr.isDefault ? 'bg-[#D4AF37]/10' : 'bg-white shadow-sm border border-slate-50'
                    )}>
                      <Home className={cn("h-4 w-4 md:h-5 md:w-5", addr.isDefault ? 'text-[#D4AF37]' : 'text-slate-300')} />
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="font-black text-slate-900 uppercase text-[11px] md:text-[13px] tracking-tighter italic truncate">
                        {safeString(addr.label) || "Endereço"}
                      </p>
                      {addr.isDefault && (
                        <div className="mt-0.5">
                          <Badge className="bg-[#D4AF37] text-white text-[7px] md:text-[9px] font-black uppercase tracking-tighter h-4 px-2">Padrão</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1 shrink-0">
                    {!addr.isDefault && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-300 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5" 
                        onClick={() => onSetDefault(addr.id)} 
                        disabled={isSettingDefault}
                      >
                        {isSettingDefault ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50" 
                      onClick={() => onDelete(addr.id)} 
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm md:text-lg font-black text-slate-800 leading-tight tracking-tighter">
                    {safeString(addr.street)}, {safeString(addr.number)}
                  </p>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-tight">
                    {safeString(addr.neighborhood)} {addr.complement && `— ${safeString(addr.complement)}`}
                  </p>
                  <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {safeString(addr.city)}/{safeString(addr.state)} — {safeString(addr.zipCode)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}