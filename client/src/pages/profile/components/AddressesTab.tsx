import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Trash2, CheckCircle2, Loader2, Home, Plus } from "lucide-react";

interface AddressesTabProps {
  addresses: any[];
  isLoading: boolean;
  onSetDefault: (id: any) => void;
  onDelete: (id: any) => void;
  isSettingDefault: boolean;
  isDeleting: boolean;
  onAddNew: () => void;
}

/**
 * ✅ HELPER: Garante que o valor exibido seja sempre uma string.
 * Se o banco retornar um objeto por erro de serialização, ele evita o "[object Object]".
 */
const safeString = (val: any) => {
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
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* ➕ BOTÃO ADICIONAR NOVO */}
      <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 ml-2">
           <div className="bg-[#D4AF37]/10 p-2 rounded-full">
             <MapPin className="h-4 w-4 text-[#D4AF37]" />
           </div>
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
             Meus Locais de Entrega
           </span>
        </div>
        <Button 
          type="button" 
          onClick={(e) => {
            e.preventDefault();
            onAddNew();
          }}
          className="rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest px-6 h-11 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Endereço
        </Button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          <span className="text-[10px] font-black uppercase text-slate-400 italic">Buscando endereços...</span>
        </div>
      ) : (addresses?.length || 0) === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
          <MapPin className="h-10 w-10 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhum endereço cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <Card 
              key={addr.id} 
              className={`rounded-[2rem] shadow-sm transition-all duration-300 border-none relative overflow-hidden ${
                addr.isDefault 
                ? 'ring-2 ring-[#D4AF37] bg-white shadow-xl shadow-[#D4AF37]/5' 
                : 'bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${addr.isDefault ? 'bg-[#D4AF37]/10' : 'bg-white shadow-sm'}`}>
                      <Home className={`h-4 w-4 ${addr.isDefault ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <span className="font-black text-slate-800 uppercase text-[11px] tracking-wider italic">
                        {safeString(addr.label) || "Endereço"}
                      </span>
                      {addr.isDefault && (
                        <div className="mt-0.5">
                          <Badge className="bg-[#D4AF37] text-white text-[8px] font-black uppercase tracking-tighter h-4">Padrão</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!addr.isDefault && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10" 
                        onClick={() => onSetDefault(addr.id)} 
                        disabled={isSettingDefault}
                      >
                        {isSettingDefault ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50" 
                      onClick={() => onDelete(addr.id)} 
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* ✅ SEÇÃO CORRIGIDA COM safeString PARA EVITAR [object Object] */}
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-700">
                    {safeString(addr.street)}, {safeString(addr.number)}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed">
                    {safeString(addr.neighborhood)} {addr.complement && `— ${safeString(addr.complement)}`}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
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