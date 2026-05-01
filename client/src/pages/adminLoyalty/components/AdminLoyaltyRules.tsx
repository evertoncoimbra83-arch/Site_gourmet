import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowRight, Gift, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- INTERFACES ---

interface RedemptionRule {
  minOrderValue: number;
  maxDiscount: number;
}

interface LoyaltyFormData {
  redemptionRules?: RedemptionRule[];
  [key: string]: unknown; // Permite outros campos do formulário
}

interface LoyaltyState {
  formData: LoyaltyFormData;
}

interface LoyaltyActions {
  setFormData: (data: LoyaltyFormData) => void;
}

interface AdminLoyaltyRulesProps {
  state: LoyaltyState;
  actions: LoyaltyActions;
}

export function AdminLoyaltyRules({ state, actions }: AdminLoyaltyRulesProps) {
  const rules = state.formData.redemptionRules || [];

  const addRule = () => {
    actions.setFormData({
      ...state.formData,
      redemptionRules: [...rules, { minOrderValue: 0, maxDiscount: 0 }]
    });
  };

  const updateRule = (index: number, field: keyof RedemptionRule, value: number) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    actions.setFormData({ ...state.formData, redemptionRules: newRules });
  };

  const removeRule = (index: number) => {
    actions.setFormData({
      ...state.formData,
      redemptionRules: rules.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-emerald-200">
            <Gift size={20}/>
          </div>
          <div>
            <h2 className="font-black uppercase text-xl italic tracking-tighter text-slate-900">Limites de Resgate</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Desconto máximo por valor de compra</p>
          </div>
        </div>
        <Button onClick={addRule} variant="outline" className="w-full sm:w-auto rounded-full border-emerald-200 text-emerald-600 font-black text-[10px] h-10 uppercase hover:bg-emerald-50 transition-all active:scale-95">
          <Plus size={14} className="mr-1" /> Add Nova Faixa
        </Button>
      </div>

      <div className="space-y-4">
        {/* HEADER DESKTOP */}
        <div className="hidden md:grid grid-cols-12 px-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">
          <div className="col-span-5">Se o Pedido for até (R$)</div>
          <div className="col-span-1"></div>
          <div className="col-span-5">Libera Desconto Máx (R$)</div>
          <div className="col-span-1"></div>
        </div>

        <AnimatePresence initial={false}>
          {rules.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30"
            >
              <ShoppingBag size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Nenhuma regra definida</p>
            </motion.div>
          ) : (
            rules.map((rule, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group hover:border-emerald-200 transition-all"
              >
                <div className="col-span-5 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">R$</span>
                  <Input 
                    type="number" 
                    value={rule.minOrderValue} 
                    onChange={e => updateRule(index, 'minOrderValue', Number(e.target.value))} 
                    className="h-12 pl-10 font-black text-slate-700 rounded-xl bg-white border-slate-200 focus-visible:ring-emerald-500/20" 
                  />
                  <Label className="md:hidden text-[8px] font-black uppercase text-slate-400 absolute -top-2 left-3 bg-white px-1 border">Pedido até</Label>
                </div>

                <div className="col-span-1 flex justify-center text-slate-200">
                  <ArrowRight size={16} className="rotate-90 md:rotate-0" />
                </div>

                <div className="col-span-5 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-300">R$</span>
                  <Input 
                    type="number" 
                    value={rule.maxDiscount} 
                    onChange={e => updateRule(index, 'maxDiscount', Number(e.target.value))} 
                    className="h-12 pl-10 font-black text-emerald-600 rounded-xl bg-emerald-50/30 border-emerald-100 focus-visible:ring-emerald-500/20" 
                  />
                  <Label className="md:hidden text-[8px] font-black uppercase text-emerald-600 absolute -top-2 left-3 bg-white px-1 border border-emerald-100">Desconto Máximo</Label>
                </div>

                <button 
                  type="button"
                  onClick={() => removeRule(index)} 
                  className="col-span-1 flex justify-center md:justify-end text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={18}/>
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}