import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Trash2, MapPin, Loader2, Navigation, Map, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function AddressesTab({ userId }: { userId: number | null }) {
  const utils = trpc.useUtils();
  
  // 1. Busca os endereços com proteção de ID
  const { data: addresses, isLoading } = trpc.admin.users.listAddresses.useQuery(
    { userId: userId as number }, 
    { 
      enabled: !!userId, 
      retry: false 
    }
  );

  // 2. Mutação de Deleção
  const deleteMut = trpc.addresses.delete.useMutation({ 
    onSuccess: () => { 
      toast.success("Endereço removido"); 
      utils.admin.users.listAddresses.invalidate({ userId: userId as number }); 
    },
    onError: (err) => {
      toast.error("Erro ao remover: " + err.message);
    }
  });

  if (isLoading || !userId) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-emerald-600" size={32} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
        Localizando rotas de entrega...
      </p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* HEADER DA ABA */}
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Map size={16} />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
              Locais de Entrega
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Endereços vinculados a esta conta
            </p>
          </div>
        </div>
      </div>

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses && addresses.length > 0 ? (
          addresses.map((addr: any) => (
            <div 
              key={addr.id} 
              className="p-6 rounded-[2.5rem] bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 group relative"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100">
                  {addr.label || "Residencial"}
                </span>
                
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-10 w-10 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90" 
                  onClick={() => {
                    if(window.confirm("Deseja remover este endereço do perfil?")) {
                      deleteMut.mutate({ id: addr.id });
                    }
                  }}
                  disabled={deleteMut.isPending}
                >
                  {deleteMut.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={18}/>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <p className="font-black text-slate-900 text-base uppercase italic tracking-tighter leading-tight">
                  {addr.street || addr.address}, {addr.number || "S/N"}
                </p>
                
                {addr.complement && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50/50 w-fit px-3 py-1 rounded-lg">
                    <Info size={10} />
                    <span className="uppercase">Apto/Bloco: {addr.complement}</span>
                  </div>
                )}
                
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed">
                  {addr.neighborhood || "Bairro não informado"} <br />
                  {addr.city || "Cidade"} — {addr.state || "SP"}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-dashed border-slate-100 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Código Postal</span>
                  <p className="text-[11px] font-mono font-black text-slate-400">
                    {addr.zipCode || "00000-000"}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-200 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
                  <Navigation size={18} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-white">
            <div className="h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-6">
              <MapPin size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-300 font-black text-[10px] uppercase tracking-[0.3em] text-center max-w-[200px] leading-relaxed">
              O cliente ainda não possui locais de entrega registrados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}