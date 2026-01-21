import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Zap, Percent, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

export function DiscountRuleForm({ state, actions, mutations, onCancel }: any) {
  const { formState } = state;

  return (
    <form 
      onSubmit={actions.handleSubmit} 
      className="space-y-8 animate-in fade-in duration-500"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-8">
        
        {/* NOME DA REGRA */}
        <div className="md:col-span-8 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Identificação da Regra
          </Label>
          <Input 
            className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg focus:ring-2 focus:ring-emerald-500/10" 
            placeholder="Ex: Combo Família 10%" 
            value={formState.name} 
            onChange={e => actions.setFormState({...formState, name: e.target.value})} 
            required
          />
        </div>

        {/* PRIORIDADE */}
        <div className="md:col-span-4 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Prioridade
          </Label>
          <Input 
            type="number"
            className="h-14 rounded-2xl bg-slate-50 border-none font-black text-center text-lg" 
            value={formState.priority} 
            onChange={e => actions.setFormState({...formState, priority: e.target.value})} 
          />
        </div>

        {/* SELETOR DE TIPO DE DESCONTO */}
        <div className="md:col-span-12 space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Modo de Cálculo
          </Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => actions.setFormState({ ...formState, discountType: 'percentage' })}
              className={cn(
                "flex-1 h-16 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all active:scale-95",
                formState.discountType === 'percentage' 
                  ? "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm" 
                  : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
              )}
            >
              <Percent size={18} className={formState.discountType === 'percentage' ? "animate-pulse" : ""} />
              <span className="font-black uppercase text-[10px] tracking-widest">Porcentagem</span>
            </button>

            <button
              type="button"
              onClick={() => actions.setFormState({ ...formState, discountType: 'fixed' })}
              className={cn(
                "flex-1 h-16 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all active:scale-95",
                formState.discountType === 'fixed' 
                  ? "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm" 
                  : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
              )}
            >
              <Banknote size={18} className={formState.discountType === 'fixed' ? "animate-pulse" : ""} />
              <span className="font-black uppercase text-[10px] tracking-widest">Valor Fixo (€)</span>
            </button>
          </div>
        </div>

        {/* QUANTIDADES */}
        <div className="md:col-span-4 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Qtd Mínima
          </Label>
          <Input 
            type="number"
            className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg text-center" 
            value={formState.minQuantity} 
            onChange={e => actions.setFormState({...formState, minQuantity: e.target.value})} 
            required
          />
        </div>

        <div className="md:col-span-4 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Qtd Máxima
          </Label>
          <Input 
            type="number"
            placeholder="∞"
            className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg text-center" 
            value={formState.maxQuantity || ""} 
            onChange={e => actions.setFormState({...formState, maxQuantity: e.target.value})} 
          />
        </div>

        {/* VALOR DO DESCONTO */}
        <div className="md:col-span-4 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Valor do Desconto
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-sm opacity-50">
              {formState.discountType === 'percentage' ? '%' : '€'}
            </span>
            <Input 
              type="number" 
              step="0.01"
              className="h-14 pl-10 rounded-2xl bg-slate-50 border-none font-black text-xl text-emerald-600 focus:ring-2 focus:ring-emerald-500/10" 
              value={formState.discount_value} 
              onChange={e => actions.setFormState({...formState, discount_value: e.target.value})} 
              required
            />
          </div>
        </div>
      </div>

      {/* FOOTER DO FORMULÁRIO */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-50">
        <div className="flex items-center gap-2 text-slate-300 italic">
          <Zap size={14} className="text-emerald-400" />
          <p className="text-[9px] font-bold uppercase tracking-tight">
            As regras são aplicadas em tempo real no carrinho do cliente.
          </p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <Button 
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="flex-1 md:flex-none h-14 px-8 rounded-2xl font-black text-[10px] tracking-widest uppercase text-slate-400 hover:bg-slate-50 transition-all"
          >
            Descartar
          </Button>

          <Button 
            type="submit" 
            disabled={mutations.isPending} 
            className="flex-[2] md:flex-none bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl h-14 px-12 font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all active:scale-95"
          >
            {mutations.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <Plus size={18} />
                <span>{state.editingId ? "Atualizar Regra" : "Ativar Regra"}</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}