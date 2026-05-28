// client/src/pages/adminAbandoned/view/AdminAbandonedView.tsx
import React, { useState } from "react";
import { useAdminAbandoned } from "../logic/useAdminAbandoned";
import { AbandonedCartCard } from "../components/AbandonedCartCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Trash2, Loader2, Target } from "lucide-react";

export function AdminAbandonedView() {
  const { 
    abandonedData, 
    emptyData, 
    isLoading, 
    isDeleting, 
    handleCleanUp, 
    stats, 
    isOnline,
    getCustomMessage // ✅ Importando a nova função da lógica
  } = useAdminAbandoned();

  const [activeTab, setActiveTab] = useState("abandoned");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-slate-500 font-medium italic">Sintonizando radar...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header com Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">
            Radar de <span className="text-orange-500">Conversão</span>
          </h1>
          <p className="text-slate-500 font-medium">Recupere oportunidades de vendas perdidas.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
            <Target size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Oportunidade Recuperável</p>
            <p className="text-2xl font-black text-slate-900">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalOpportunity)}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-2xl mb-8">
          <TabsTrigger value="abandoned" className="rounded-xl gap-2 font-bold px-6">
            <ShoppingCart size={16} /> Abandonados ({stats.count})
          </TabsTrigger>
          <TabsTrigger value="cleanup" className="rounded-xl gap-2 font-bold px-6">
            <Trash2 size={16} /> Limpeza ({emptyData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="abandoned" className="space-y-4">
          {abandonedData.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
              <p className="text-slate-400 font-bold italic">Nenhum carrinho com itens no momento.</p>
            </div>
          ) : (
            abandonedData.map((cart) => (
              <AbandonedCartCard 
                key={cart.id} 
                cart={cart} 
                isOnline={isOnline(cart.updatedAt)}
                customMessage={getCustomMessage(cart)} // ✅ PASSANDO A MENSAGEM AQUI
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="cleanup">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6">
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase">Higiene do Banco de Dados</h3>
              <p className="text-slate-500 text-sm">
                Existem **{emptyData.length}** registros de carrinhos vazios ou antigos que estão ocupando espaço desnecessário.
              </p>
            </div>
            <Button 
              onClick={handleCleanUp} 
              disabled={isDeleting || emptyData.length === 0}
              className="bg-red-500 hover:bg-red-600 text-white font-black uppercase px-8 rounded-2xl h-12 gap-2"
            >
              {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 size={18} />}
              Limpar Registros Inúteis
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}