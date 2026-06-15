import React, { useState, useEffect } from "react";
import { useAdminCoupons, Coupon } from "../logic/useAdminCoupons";
import { CouponForm } from "../components/CouponForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Trash2, Loader2, Users, Ticket, PlusCircle, Pencil, Plus, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildCouponLink } from "@shared/utils/coupon";
import { appToast as toast } from "@/lib/app-toast";

// ✅ Extração automática dos tipos das Props do CouponForm para evitar 'any'
type CouponFormProps = Parameters<typeof CouponForm>[0];

export default function AdminCouponsView() {
  const { state, actions, data, mutations } = useAdminCoupons();
  const [accordionValue, setAccordionValue] = useState<string>("");

  useEffect(() => {
    if (state.formState.id) {
      setAccordionValue("new-coupon");
    }
  }, [state.formState.id]);

  const handleAddNew = () => {
    actions.resetForm();
    setAccordionValue("new-coupon");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDiscard = () => {
    actions.resetForm();
    setAccordionValue("");
  };

  const handleSaveAndClose = async () => {
    await actions.handleSubmit();
    if (!state.formState.id) {
       setAccordionValue("");
    }
  };

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;

    const cleanPath = url
      .replace(/^\/?public\//, "")
      .replace(/^\//, "");

    const apiBase = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, "");
    return `${apiBase}/${cleanPath}`;
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-0 text-left">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 text-center md:text-left pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <Ticket size={18} className="animate-bounce" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Marketing & Fidelidade</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Gestão de <span className="text-emerald-600">Cupons</span>.
          </h1>
        </div>

        <Button
          onClick={handleAddNew}
          className="h-14 md:h-16 w-full md:w-auto px-8 rounded-4xl bg-slate-950 hover:bg-emerald-600 text-white font-black uppercase text-[10px] md:text-[11px] tracking-widest shadow-xl transition-all active:scale-95 group"
        >
          <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
          Nova Campanha
        </Button>
      </header>

      {/* FORMULÁRIO (ACCORDION) */}
      <Accordion
        type="single"
        collapsible
        className="w-full border-none"
        value={accordionValue}
        onValueChange={setAccordionValue}
      >
        <AccordionItem value="new-coupon" className="border-none">
          <AccordionTrigger
            className="flex p-5 md:p-8 bg-white rounded-4xl border border-slate-100 shadow-sm hover:no-underline group transition-all"
          >
            <div className="flex items-center gap-4 text-left">
              <div className={cn(
                "h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center transition-all shrink-0 shadow-lg",
                state.formState.id ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
              )}>
                {state.formState.id ? <Pencil size={20} /> : <PlusCircle size={20} />}
              </div>
              <div className="min-w-0">
                <h2 className="text-base md:text-lg font-black uppercase tracking-tighter italic text-slate-900 leading-none truncate">
                  {state.formState.id ? `Editar: ${state.formState.code}` : "Configurar Promoção"}
                </h2>
                <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {accordionValue === "new-coupon" ? "Preencha os campos abaixo" : "Clique para abrir o formulário"}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 md:pt-6">
            <div className="bg-white p-5 md:p-10 rounded-4xl border-2 border-dashed border-slate-100 animate-in zoom-in-95 duration-500">
                <CouponForm
                  // ✅ RESOLVIDO: Cast seguro para os tipos reais do componente
                  state={state as unknown as CouponFormProps['state']}
                  actions={{
                    ...actions,
                    handleSubmit: handleSaveAndClose,
                    resetForm: handleDiscard
                  } as unknown as CouponFormProps['actions']}
                  mutations={mutations as unknown as CouponFormProps['mutations']}
                />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* LISTA DE CUPONS */}
      <section className="space-y-6 md:space-y-8">
        <div className="flex items-center gap-4">
           <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 whitespace-nowrap italic">Histórico Operacional</h2>
           <div className="w-full border-t border-slate-100" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {state.isLoading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
               <Loader2 className="animate-spin text-emerald-500" size={32} />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando...</p>
            </div>
          ) : (data?.coupons || []).map((coupon: Coupon) => {
            const couponColor = coupon.bannerColor || "#10b981";

            return (
              <div key={coupon.id} className="bg-white rounded-4xl p-0 shadow-sm border border-slate-50 group hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col relative text-left">

                <div
                  className="h-28 md:h-32 p-5 md:p-6 flex justify-between items-start relative z-10 transition-colors duration-500"
                  style={{ backgroundColor: couponColor }}
                >
                  <div className="flex flex-col gap-1">
                      <span className="font-black text-white uppercase italic tracking-tighter text-xl md:text-2xl leading-none">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `R$ ${coupon.discountValue} OFF`}
                      </span>
                      <span className="text-[8px] md:text-[10px] font-black text-white/90 uppercase tracking-[0.2em] bg-black/10 w-fit px-2 py-0.5 rounded-md">
                          {coupon.isActive ? "Campanha Ativa" : "Pausada"}
                      </span>
                  </div>
                  <button
                    onClick={() => {
                      actions.handleEdit(coupon);
                      setAccordionValue("new-coupon");
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all border border-white/10"
                  >
                      <Pencil size={14} />
                  </button>
                </div>

                <div className="p-6 md:p-8 -mt-8 bg-white rounded-t-4xl flex-1 flex flex-col relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] border-t border-white/50">
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-slate-50 shadow-inner border border-slate-100 flex items-center justify-center overflow-hidden p-1">
                      {coupon.logoUrl ? (
                        <img
                          src={getImageUrl(coupon.logoUrl) || ""}
                          className="w-full h-full object-contain rounded-xl animate-in fade-in"
                          alt="Logo"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200?text=Cupom"; }}
                        />
                      ) : (
                        <Ticket size={20} className="text-slate-200" />
                      )}
                    </div>

                    <Badge
                      className="font-black text-[7px] md:text-[8px] uppercase tracking-widest px-2 md:px-3 py-1 border-none shadow-sm text-white"
                      style={{ backgroundColor: coupon.isActive ? couponColor : "#cbd5e1" }}
                    >
                      {coupon.isActive ? "Disponível" : "Indisponível"}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-2">
                      <h3 className="font-black text-xl md:text-2xl uppercase italic tracking-tighter text-slate-900 leading-none truncate">
                        {coupon.code}
                      </h3>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed line-clamp-2">
                        {coupon.description || 'Campanha promocional ativa.'}
                      </p>

                      {/* Link Promocional Preview & Copy */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50 p-2 rounded-2xl">
                        <span className="text-[9px] font-mono text-slate-400 truncate select-all max-w-[140px] md:max-w-[180px]">
                          {buildCouponLink(coupon.code, import.meta.env.VITE_APP_URL || window.location.origin)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-xl px-2 text-[8px] font-black uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-600 border border-slate-100 flex items-center gap-1 shrink-0"
                          onClick={() => {
                            const link = buildCouponLink(coupon.code, import.meta.env.VITE_APP_URL || window.location.origin);
                            void navigator.clipboard.writeText(link);
                            toast.success("Link promocional copiado!");
                          }}
                        >
                          <Copy size={10} /> Copiar
                        </Button>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:gap-4 border-t border-slate-50 pt-5 md:pt-6 mt-5 md:mt-6">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 shrink-0">
                        <Users size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[7px] font-black text-slate-300 uppercase leading-none truncate">Resgates</p>
                        <p className="text-[10px] md:text-[11px] font-black text-slate-800 uppercase tracking-tighter">
                          {coupon.timesUsed || 0}/<span className="text-slate-300">{coupon.usageLimit || '∞'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-1.5 md:gap-2">
                      <Button
                        variant="ghost"
                        className="h-8 md:h-10 rounded-xl px-2 md:px-4 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white transition-all shadow-md"
                        style={{ backgroundColor: coupon.isActive ? couponColor : "#94a3b8" }}
                        onClick={() => actions.handleToggle(coupon)}
                      >
                        {coupon.isActive ? 'Pausar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-red-50 text-red-400 hover:text-white hover:bg-red-500 transition-all"
                        onClick={() => actions.handleDelete(coupon.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}