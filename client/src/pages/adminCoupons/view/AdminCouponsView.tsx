import { useAdminCoupons } from "../logic/useAdminCoupons";
import { CouponForm } from "../components/CouponForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Trash2, Loader2, Calendar, Users, Ticket, PlusCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminCouponsView() {
  const { state, actions, data, mutations } = useAdminCoupons();

  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : 'Sem expiração';

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-emerald-600">
          <Ticket size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Marketing & Loyalty</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
          Cupons de <span className="text-emerald-600">Desconto</span><span className="text-emerald-600">.</span>
        </h1>
        <p className="text-sm md:text-base text-slate-500 font-medium italic">
          Gerencie suas campanhas de incentivo e códigos promocionais.
        </p>
      </header>

      {/* ✅ SANFONA PARA NOVO CUPOM */}
      <Accordion type="single" collapsible className="w-full border-none">
        <AccordionItem value="new-coupon" className="border-none">
          <AccordionTrigger className="flex p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:no-underline group transition-all">
            <div className="flex items-center gap-4 text-left">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <PlusCircle size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tighter italic text-slate-900 leading-none">Gerar Novo Cupom</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Clique para expandir o formulário de campanha</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-6">
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in slide-in-from-top-4 duration-500">
               <div className="flex items-center gap-2 mb-8 text-slate-400">
                  <Activity size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Configuração de Regras</span>
               </div>
               {/* O formulário agora vive dentro da sanfona */}
               <CouponForm state={state} actions={actions} mutations={mutations} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* LISTAGEM DE CUPONS */}
      <section className="space-y-8">
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-start">
            <span className="bg-[#F8FAFC] pr-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
              Histórico de Promoções
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.isLoading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
               <Loader2 className="animate-spin text-emerald-600" size={32} />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando...</p>
            </div>
          ) : data.coupons.map((coupon: any) => (
            <div key={coupon.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 flex flex-col justify-between group hover:shadow-md transition-all duration-500 relative overflow-hidden">
              
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-500 rounded-r-full" />

              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-2xl uppercase italic tracking-tighter text-slate-900 leading-none">
                      {coupon.code}
                    </span>
                    <Badge className={cn(
                      "rounded-lg text-[8px] uppercase font-black px-2 py-0.5 border-none",
                      coupon.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                    )}>
                      {coupon.isActive ? "Ativo" : "Pausado"}
                    </Badge>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                    {coupon.description || 'Campanha sem descrição'}
                  </p>
                </div>

                <div className="flex gap-2">
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all" 
                    onClick={() => actions.handleToggle(coupon)}
                   >
                     {coupon.isActive ? 'Pausar' : 'Ativar'}
                   </Button>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all" 
                    onClick={() => window.confirm("Excluir este cupom?") && actions.handleDelete(coupon.id)}
                   >
                     <Trash2 size={14}/>
                   </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-6">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Valor</p>
                  <p className="font-black text-xl text-emerald-600 italic tracking-tighter leading-none">
                    {coupon.discount_value}
                    <span className="text-xs ml-0.5">{coupon.discountType === 'percentage' ? '%' : 'R$'}</span>
                  </p>
                </div>
                
                <div className="space-y-1 border-l border-slate-50 pl-4">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Validade</p>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar size={12} className="text-slate-300" />
                    <span className="font-bold text-[10px] uppercase tracking-tighter truncate">
                      {formatDate(coupon.validUntil)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 border-l border-slate-50 pl-4">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Resgates</p>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Users size={12} className="text-slate-300" />
                    <span className="font-bold text-[10px] uppercase tracking-tighter">
                      {coupon.timesUsed || 0}<span className="text-slate-300 mx-1">/</span>{coupon.usageLimit || '∞'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}