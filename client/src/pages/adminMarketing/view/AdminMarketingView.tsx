import React, { useState, useEffect } from "react"; // ✅ Adicionado React scope
import { trpc } from "@/_core/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShoppingCart, Megaphone, Loader2, Save, 
  TicketPercent, ArrowRight, ShieldCheck 
} from "lucide-react";
import { appToast as toast } from "@/lib/app-toast"; // ✅ Padronizado para sonner
import { useNavigate } from "react-router-dom"; 

export function AdminMarketingView() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  
  const { data: rules, isLoading } = trpc.admin.marketing.getRules.useQuery();
  
  const updateMutation = trpc.admin.marketing.updateRules.useMutation({
    onSuccess: () => {
      toast.success("Sucesso!", {
        description: "Regras de venda atualizadas e registradas com sucesso."
      });
      utils.admin.marketing.getRules.invalidate();
    },
    onError: (err) => {
      toast.error("Erro ao salvar", {
        description: err.message
      });
    }
  });

  const [formData, setFormData] = useState({ 
    generalMinOrderAmount: 0, 
    minOrderMessage: "" 
  });

  useEffect(() => {
    if (rules) {
      setFormData({
        generalMinOrderAmount: Number(rules.generalMinOrderAmount || 0),
        minOrderMessage: String(rules.minOrderMessage || "")
      });
    }
  }, [rules]);

  // ✅ Máscara de Moeda Brasileira
  const formatDisplay = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const numericValue = Number(value) / 100;
    setFormData(prev => ({ ...prev, generalMinOrderAmount: numericValue }));
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-20">
      <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando inteligência...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans text-left">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Marketing <span className="text-orange-500">&</span> Vendas
            </h1>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <ShieldCheck size={12} className="animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-tighter">Auditoria Ativa</span>
            </div>
          </div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            Gestão de pedidos mínimos e réguas de conversão
          </p>
        </div>

        <Button 
          onClick={() => updateMutation.mutate(formData as unknown as Parameters<typeof updateMutation.mutate>[0])}
          disabled={updateMutation.isPending}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-14 px-8 font-black shadow-xl transition-all active:scale-95 group"
        >
          {updateMutation.isPending ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Save className="mr-2 group-hover:rotate-12 transition-transform" size={18} />
          )}
          SALVAR ALTERAÇÕES
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CARD: PEDIDO MÍNIMO */}
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border border-slate-100">
          <CardHeader className="p-8 bg-orange-50/30 border-b border-orange-100/20">
            <div className="flex items-center gap-3 text-orange-600">
              <ShoppingCart size={24} />
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter">
                Regras de <span className="text-orange-500">Checkout</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-3 text-left">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Valor Mínimo do Pedido</Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-white rounded-xl flex items-center justify-center text-orange-600 font-black text-xs z-10 border border-orange-100 group-focus-within:bg-orange-500 group-focus-within:text-white transition-all shadow-sm">
                  R$
                </div>
                <Input 
                  type="text"
                  className="h-16 pl-16 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-200 focus:bg-white transition-all font-black text-3xl text-slate-900 shadow-inner"
                  value={formatDisplay(formData.generalMinOrderAmount)}
                  onChange={handleCurrencyChange}
                />
              </div>
              <p className="text-[9px] text-slate-400 font-bold italic ml-2">* O sistema bloqueará o fechamento se o subtotal for menor.</p>
            </div>

            <div className="space-y-3 text-left">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Mensagem de Aviso ao Cliente</Label>
              <Input 
                placeholder="Ex: Poxa! Adicione mais itens para atingir R$ 30,00"
                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700"
                value={formData.minOrderMessage}
                onChange={(e) => setFormData(prev => ({...prev, minOrderMessage: e.target.value}))}
              />
            </div>
          </CardContent>
        </Card>

        {/* CARD: ATALHOS RÁPIDOS */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Módulos de Conversão</h3>
          
          <button 
            onClick={() => navigate("/admin/coupons")}
            className="w-full p-8 bg-slate-900 rounded-[2.5rem] text-white flex justify-between items-center group cursor-pointer hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 border-none"
          >
             <div className="flex items-center gap-6">
               <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 group-hover:scale-110 transition-all">
                  <TicketPercent size={28} className="text-white" />
               </div>
               <div className="text-left">
                 <h3 className="text-lg font-black uppercase italic tracking-tighter">Central de Cupons</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ativar códigos promocionais</p>
               </div>
             </div>
             <ArrowRight className="text-slate-600 group-hover:text-white group-hover:translate-x-2 transition-all" />
          </button>

          <button 
            onClick={() => navigate("/admin/loyalty")}
            className="w-full p-8 bg-emerald-600 rounded-[2.5rem] text-white flex justify-between items-center group cursor-pointer hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-100 border-none"
          >
             <div className="flex items-center gap-6">
               <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all">
                  <Megaphone size={28} className="text-white" />
               </div>
               <div className="text-left">
                 <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Programa Fidelidade</h3>
                 <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest">Configurar Cashback e Pontuação</p>
               </div>
             </div>
             <ArrowRight className="text-emerald-300 group-hover:text-white group-hover:translate-x-2 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}