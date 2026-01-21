import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Tag, Loader2, Zap, CalendarDays } from "lucide-react";

export function CouponForm({ state, actions, mutations }: any) {
  const { formState } = state;

  return (
    <form onSubmit={actions.handleCreate} className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-8">
        
        {/* CÓDIGO E DESCRIÇÃO */}
        <div className="md:col-span-4 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Código do Cupom
          </Label>
          <div className="relative">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
            <Input 
              className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-black uppercase text-lg focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-300" 
              placeholder="EX: VERDAO20" 
              value={formState.code} 
              onChange={e => actions.setFormState({...formState, code: e.target.value.toUpperCase()})} 
            />
          </div>
        </div>

        <div className="md:col-span-8 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Descrição da Campanha
          </Label>
          <Input 
            className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-emerald-500/10" 
            placeholder="Ex: Desconto exclusivo para novos assinantes" 
            value={formState.description} 
            onChange={e => actions.setFormState({...formState, description: e.target.value})} 
          />
        </div>

        {/* REGRAS DE DESCONTO */}
        <div className="md:col-span-4 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Modelo de Desconto
          </Label>
          <select 
            className="w-full h-14 rounded-2xl bg-slate-50 border-none font-bold px-4 text-sm focus:ring-2 focus:ring-emerald-500/10 appearance-none cursor-pointer" 
            value={formState.discountType} 
            onChange={e => actions.setFormState({...formState, discountType: e.target.value})}
          >
            <option value="percentage">Percentual (%)</option>
            <option value="fixed">Fixo (R$)</option>
          </select>
        </div>

        <div className="md:col-span-4 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Valor Abatido
          </Label>
          <div className="relative">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-emerald-600">
              {formState.discountType === 'percentage' ? '%' : 'R$'}
            </span>
            <Input 
              type="number" 
              className="h-14 rounded-2xl bg-slate-50 border-none font-black text-xl text-emerald-600 focus:ring-2 focus:ring-emerald-500/10" 
              value={formState.discount_value} 
              onChange={e => actions.setFormState({...formState, discount_value: e.target.value})} 
            />
          </div>
        </div>

        <div className="md:col-span-4 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Pedido Mínimo
          </Label>
          <Input 
            type="number" 
            className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-sm" 
            placeholder="R$ 0,00"
            value={formState.minOrderValue} 
            onChange={e => actions.setFormState({...formState, minOrderValue: e.target.value})} 
          />
        </div>

        {/* LIMITES E DATAS */}
        <div className="md:col-span-4 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Limite de Resgates
          </Label>
          <Input 
            type="number" 
            className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-sm" 
            placeholder="Ilimitado" 
            value={formState.usageLimit} 
            onChange={e => actions.setFormState({...formState, usageLimit: e.target.value})} 
          />
        </div>

        <div className="md:col-span-4 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Início da Validade
          </Label>
          <Input 
            type="datetime-local" 
            className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-[11px] uppercase" 
            value={formState.validFrom} 
            onChange={e => actions.setFormState({...formState, validFrom: e.target.value})} 
          />
        </div>

        <div className="md:col-span-4 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Término da Validade
          </Label>
          <Input 
            type="datetime-local" 
            className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-[11px] uppercase" 
            value={formState.validUntil} 
            onChange={e => actions.setFormState({...formState, validUntil: e.target.value})} 
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-50">
        <div className="flex items-center gap-2 text-slate-300 italic">
          <Zap size={14} className="text-emerald-400" />
          <p className="text-[9px] font-bold uppercase tracking-tight">
            O cupom será validado automaticamente no checkout.
          </p>
        </div>

        <Button 
          type="submit" 
          disabled={mutations.isPending} 
          className="w-full md:w-auto bg-slate-900 hover:bg-emerald-600 text-white rounded-3xl h-16 px-14 font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all active:scale-95"
        >
          {mutations.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <div className="flex items-center gap-2">
              <Plus size={18} />
              <span>Ativar Campanha</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}