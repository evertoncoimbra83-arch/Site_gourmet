import React from "react"; // ✅ Adicionado para satisfazer a regra do ESLint
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ShoppingBag, PlusCircle, Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminOrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-500 font-sans text-left">
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-emerald-500/10 border border-slate-100 p-12 max-w-md w-full text-center space-y-8">
        
        {/* ÍCONE DE SUCESSO COM EFEITO DE PULSO */}
        <div className="relative mx-auto w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-200">
          <CheckCircle2 size={48} />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500 animate-ping opacity-20"></div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
            Venda <span className="text-emerald-500">Realizada!</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm">
            O pedido foi registrado com sucesso no terminal de controle.
          </p>
          {orderId && (
            <div className="mt-4 inline-block bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-tight">Código do Pedido</p>
                <p className="text-slate-600 font-mono font-bold text-xs uppercase">{orderId.slice(-8)}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* BOTÃO PRINCIPAL: NOVA VENDA */}
          <Button 
            onClick={() => navigate("/admin/orders/create")} 
            className="h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-100 group transition-all"
          >
            <PlusCircle className="mr-2 group-hover:rotate-90 transition-transform" size={20} />
            Nova Venda
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/admin/orders`)}
              className="h-14 rounded-2xl border-slate-200 font-black uppercase text-[10px] text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <ShoppingBag className="mr-2" size={16} />
              Listagem
            </Button>

            <Button 
              variant="outline" 
              onClick={() => window.print()}
              className="h-14 rounded-2xl border-slate-200 font-black uppercase text-[10px] text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <Printer className="mr-2" size={16} />
              Imprimir
            </Button>
          </div>
        </div>

        <button 
          onClick={() => navigate("/admin")}
          className="flex items-center justify-center w-full text-slate-300 hover:text-emerald-600 transition-colors text-[9px] font-black uppercase tracking-widest gap-2 outline-none"
        >
          <ArrowLeft size={12} /> Voltar ao Painel Geral
        </button>
      </div>
    </div>
  );
}