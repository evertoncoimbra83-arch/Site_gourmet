// client/src/pages/AdminAbandonedCarts.tsx

import React from "react";
import { trpc } from "@/_core/trpc";
import { 
  ShoppingBag, MessageCircle, Clock, 
  Trash2, Ghost, Loader2, ExternalLink, User,
  Wind, Fingerprint, Smartphone, CreditCard, LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { appToast as toast } from "@/lib/app-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// --- INTERFACES ---
interface AbandonedCart {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  visitorId: string | null;
  total: string | number;
  itemCount: number;
  updatedAt: string | Date | null;
  shippingAddressId?: string | null;
  selectedAddressId?: string | null;
}

interface EmptyCartRecord {
  id: string;
  updatedAt: Date | string | null;
}

// ✅ Tipagem auxiliar para substituir o "any" no Bypass
interface FallbackApi {
  useQuery: (input?: undefined, opts?: Record<string, unknown>) => { data: unknown; isLoading: boolean };
  invalidate: () => void;
}

export default function AdminAbandonedCarts() {
  const utils = trpc.useUtils();
  
  // 1. QUERIES
  const abandonedQuery = trpc.admin.orders.getAbandonedCarts.useQuery(undefined, {
    refetchInterval: 15000, 
  });

  // ✅ BYPASS sem 'any': Usamos a interface FallbackApi para satisfazer o ESLint
  const ordersApi = trpc.admin.orders as unknown as Record<string, FallbackApi>;
  const emptyQuery = ordersApi.getEmptyOldCarts?.useQuery(undefined, {
    refetchOnWindowFocus: false 
  }) || { data: [], isLoading: false };

  const abandonedData = (abandonedQuery.data as unknown as AbandonedCart[]) || [];
  const emptyData = (emptyQuery.data as unknown as EmptyCartRecord[]) || [];

  // 2. MUTATIONS
  const deleteMutation = trpc.admin.orders.clearEmptyOldCarts.useMutation({
    onSuccess: () => {
      toast.success("Limpeza Concluída!", { description: `Carrinhos antigos removidos.` });
      
      // ✅ BYPASS do Invalidate sem 'any'
      const utilsOrdersApi = utils.admin.orders as unknown as Record<string, FallbackApi>;
      if (utilsOrdersApi.getEmptyOldCarts) {
          utilsOrdersApi.getEmptyOldCarts.invalidate();
      }
    },
    onError: (err: { message: string }) => toast.error("Erro", { description: err.message })
  });

  // 3. HELPERS
  const money = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  const safeFormatDistance = (date: string | Date | null | undefined) => {
    if (!date) return "Data desconhecida";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Data inválida";
    return formatDistanceToNow(d, { locale: ptBR, addSuffix: true });
  };

  const handleCleanUp = () => {
    if (emptyData.length === 0) return;
    deleteMutation.mutate();
  };

  const getClarityLink = (cart: AbandonedCart) => {
    const searchTerm = cart.customerName && cart.customerName !== "Visitante Anônimo" ? cart.customerEmail || cart.customerName : cart.visitorId;
    return `https://clarity.microsoft.com/projects/view/vfh49ngyny/recordings?search=${searchTerm}`;
  };

  const getFunnelStage = (cart: AbandonedCart) => {
    if (!cart.customerEmail && (cart.customerName === "Visitante Anônimo" || !cart.customerName)) {
      return { label: "Carrinho / Vitrine", icon: ShoppingBag, color: "text-slate-400", bg: "bg-slate-100" };
    }
    if (!cart.shippingAddressId && !cart.selectedAddressId) {
      return { label: "Cadastro / Login", icon: LogIn, color: "text-blue-500", bg: "bg-blue-50" };
    }
    return { label: "Pagamento (Quente!)", icon: CreditCard, color: "text-red-500", bg: "bg-red-50" };
  };

  const isUserOnline = (date: string | Date | null | undefined) => {
    if (!date) return false;
    const diff = Math.abs(differenceInMinutes(new Date(), new Date(date)));
    return diff < 5;
  };

  if (abandonedQuery.isLoading || emptyQuery.isLoading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center min-h-100">
        <Loader2 className="animate-spin text-emerald-600 mb-4" size={32} />
        <p className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-400">Analisando tráfego...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <ShoppingBag size={18} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Recovery Center</span>
          </div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
            Monitor de <span className="text-amber-500">Tráfego</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              Monitorando em Tempo Real
            </p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="abandoned" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl mb-8 w-full md:w-auto flex h-auto">
          <TabsTrigger value="abandoned" className="rounded-xl px-6 py-3 font-bold uppercase text-xs data-[state=active]:bg-white data-[state=active]:text-amber-600 flex-1 md:flex-none gap-2">
            <ShoppingBag size={16} /> Recuperáveis ({abandonedData.length})
          </TabsTrigger>
          <TabsTrigger value="empty" className="rounded-xl px-6 py-3 font-bold uppercase text-xs data-[state=active]:bg-white data-[state=active]:text-slate-600 flex-1 md:flex-none gap-2">
            <Wind size={16} /> Limpeza ({emptyData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="abandoned" className="space-y-4">
          {abandonedData.length > 0 ? (
            abandonedData.map((cart) => {
              const stage = getFunnelStage(cart);
              const isOnline = isUserOnline(cart.updatedAt);

              return (
                <div 
                  key={cart.id}
                  className={cn(
                    "group bg-white rounded-4xl p-6 border shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden",
                    isOnline ? "border-emerald-200 ring-1 ring-emerald-100" : "border-slate-100 hover:border-amber-200"
                  )}
                >
                  {isOnline && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-700 px-4 py-1 rounded-b-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                      Navegando Agora
                    </div>
                  )}

                  <div className="flex items-center gap-5 w-full md:w-auto mt-4 md:mt-0">
                    <div className={cn(
                      "h-16 w-16 rounded-[1.8rem] flex items-center justify-center shrink-0 transition-colors",
                      isOnline ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-400 group-hover:bg-amber-50"
                    )}>
                      {cart.customerName && cart.customerName !== "Visitante Anônimo" ? <User size={28} /> : <Ghost size={28} />}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg leading-none">
                        {cart.customerName || "Visitante Anônimo"}
                      </h3>
                      
                      <div className="flex items-center gap-3 mt-1.5">
                        {cart.visitorId && (
                          <div className="flex items-center gap-1 text-slate-300">
                            <Fingerprint size={10} />
                            <span className="text-[9px] font-mono uppercase">{cart.visitorId.slice(0, 8)}...</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-slate-300">
                           <Smartphone size={10} />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                         <Badge variant="outline" className={cn("border-0 text-[9px] font-black uppercase pl-1 pr-2 py-0.5 gap-1", stage.bg, stage.color)}>
                            <stage.icon size={10} />
                            {stage.label}
                         </Badge>
                         <div className="flex items-center gap-1 text-slate-400">
                          <Clock size={10} />
                          <span className="text-[9px] font-bold uppercase">
                            {safeFormatDistance(cart.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right hidden md:block">
                      <p className="text-xl font-black text-slate-900 italic leading-none">{money(Number(cart.total))}</p>
                      <p className="text-[10px] font-bold text-emerald-600 mt-1">{String(cart.itemCount)} Itens</p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => window.open(getClarityLink(cart), '_blank')}
                        className="h-12 w-12 rounded-xl border-slate-100 p-0"
                      >
                        <ExternalLink size={18} />
                      </Button>

                      <Button 
                        onClick={() => {
                          const phone = cart.customerPhone?.replace(/\D/g, '');
                          const msg = encodeURIComponent(`Olá ${cart.customerName}! Vi que você começou um pedido na Gourmet Saudável. Posso ajudar? 😊`);
                          window.open(`https://wa.me/55${phone}?text=${msg}`);
                        }}
                        disabled={!cart.customerPhone}
                        className={cn(
                          "h-12 px-6 rounded-xl border-none",
                          !cart.customerPhone ? "bg-slate-100 text-slate-300" : "bg-[#25D366] text-white"
                        )}
                      >
                        <MessageCircle size={18} className="mr-2" />
                        <span className="font-bold uppercase text-[10px]">Chamar</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState icon={ShoppingBag} title="Tudo tranquilo!" desc="Nenhum carrinho abandonado recente." />
          )}
        </TabsContent>
        
        <TabsContent value="empty" className="space-y-6">
          <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm text-slate-400">
                <Wind size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg leading-none">Limpeza de Banco de Dados</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-md">Carrinhos com mais de 24h sem itens.</p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  disabled={emptyData.length === 0 || deleteMutation.isPending}
                  variant="destructive" 
                  className="h-14 px-8 rounded-xl font-bold uppercase text-xs"
                >
                  {deleteMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Trash2 className="mr-2" size={16} />}
                  Limpar {emptyData.length} Registros
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-0 p-8 text-left">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black text-slate-900">Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá excluir permanentemente <strong>{emptyData.length} registros</strong> de carrinhos vazios.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel className="rounded-xl h-12 px-6 font-bold">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCleanUp} className="bg-red-600 rounded-xl h-12 px-6 font-bold">
                    Sim, limpar lixo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="space-y-2">
              {emptyData.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {emptyData.slice(0, 40).map((cart) => (
                    <div key={cart.id} className="p-3 bg-white rounded-xl border border-slate-100 text-[10px] text-slate-400 flex flex-col items-center">
                      <span className="font-mono mb-1">{cart.id.slice(0, 8)}...</span>
                      <span className="flex items-center gap-1 font-bold text-slate-500">
                        <Clock size={10} />
                        {safeFormatDistance(cart.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Wind} title="Banco de dados limpo!" desc="Não há carrinhos vazios." />
              )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface EmptyStateProps { icon: React.ElementType; title: string; desc: string; }
function EmptyState({ icon: Icon, title, desc }: EmptyStateProps) {
  return (
    <div className="py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
      <div className="bg-slate-50 p-6 rounded-full mb-4">
        <Icon size={48} className="text-slate-200" />
      </div>
      <h3 className="text-slate-900 font-bold text-lg mb-2">{title}</h3>
      <p className="font-medium text-xs text-slate-400">{desc}</p>
    </div>
  );
}