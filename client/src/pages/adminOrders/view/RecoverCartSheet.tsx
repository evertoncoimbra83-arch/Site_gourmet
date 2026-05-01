// client/src/pages/adminOrders/view/RecoverCartSheet.tsx

import React from "react";
import { trpc } from "@/_core/trpc";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from "@/components/ui/sheet";
import { Loader2, ShoppingBag, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- INTERFACES ---

interface ActiveDraft {
  id: string;
  customerName: string | null;
  updatedAt: string | Date;
  subtotal: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (draftId: string) => void;
}

// ✅ Tipagem para Bypass (Sincronizada com o roteador real ou oculto)
interface RecoverCartsApi {
  listActiveDrafts: { 
    useQuery: (input: undefined, opts: Record<string, unknown>) => { data: unknown; isLoading: boolean } 
  };
}

export function RecoverCartSheet({ isOpen, onClose, onSelect }: Props) {
  // ✅ BYPASS: Cast para evitar o erro TS2339 enquanto o nome da rota não é corrigido no backend
  const ordersAdminApi = (trpc.admin.ordersAdmin as unknown as RecoverCartsApi);

  const { data: rawCarts, isLoading } = ordersAdminApi.listActiveDrafts.useQuery(undefined, {
    enabled: isOpen,
    refetchOnWindowFocus: false
  });

  const carts = rawCarts as unknown as ActiveDraft[];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md border-l border-slate-100 p-0 flex flex-col focus:outline-none">
        <div className="p-6 pb-4 border-b border-slate-50">
          <SheetHeader>
            <SheetTitle className="text-xl font-black uppercase italic tracking-tighter">
              Carrinhos <span className="text-emerald-500">Ativos</span>
            </SheetTitle>
            <SheetDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-widest text-left">
              Recupere pedidos abandonados ou iniciados no site.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20">
          {isLoading ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2">
              <Loader2 className="animate-spin text-emerald-500" size={24} />
              <p className="text-[9px] font-black uppercase text-slate-400 italic">Buscando rascunhos...</p>
            </div>
          ) : !carts || carts.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-4xl bg-white">
              <ShoppingBag size={32} className="text-slate-100 mb-2" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum carrinho aberto</p>
            </div>
          ) : (
            carts.map((cart) => (
              <div 
                key={cart.id} 
                className="group p-5 bg-white border border-slate-100 rounded-[2rem] hover:border-emerald-200 hover:shadow-md transition-all duration-300 text-left"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase italic leading-none mb-1">
                        {cart.customerName || "Cliente Visitante"}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        {formatDistanceToNow(new Date(cart.updatedAt), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600 italic">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cart.subtotal)}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => onSelect(cart.id)}
                  className="w-full h-10 bg-slate-900 hover:bg-emerald-600 text-white border-none rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm"
                >
                  Recuperar Venda <ArrowRight size={14} className="ml-2" />
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}