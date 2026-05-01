import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Target, ArrowRightLeft, 
  ShieldCheck, CalendarClock, AlertCircle, Power 
} from "lucide-react";

// --- INTERFACES ATUALIZADAS ---

interface LoyaltyFormData {
  enabled: boolean;
  conversionRatePoints: number;
  pointsPerSignup: number;
  redemptionRatePoints: number;
  redemptionRateMoney: number;
  maxDiscountAmount: number;
  minCartAmount: number;
  pointsExpirationDays: number;
  minOrderMessage: string;
}

interface LoyaltyState {
  formData: LoyaltyFormData;
}

interface LoyaltyActions {
  setFormData: (data: LoyaltyFormData) => void;
}

interface AdminLoyaltyConfigProps {
  state: LoyaltyState;
  actions: LoyaltyActions;
}

export function AdminLoyaltyConfig({ state, actions }: AdminLoyaltyConfigProps) {
  
  // ✅ CORREÇÃO: Tipagem correta para evitar o erro de 'any'
  const updateField = <K extends keyof LoyaltyFormData>(field: K, value: LoyaltyFormData[K]) => {
    actions.setFormData({ ...state.formData, [field]: value });
  };

  return (
    <div className="max-w-3xl space-y-6 pb-20">
      
      {/* STATUS DO PROGRAMA */}
      <div className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between ${
        state.formData.enabled ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-200"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${state.formData.enabled ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
            <Power size={24} />
          </div>
          <div>
            <h2 className="font-black uppercase italic tracking-tighter text-xl text-slate-900">
              Programa de Fidelidade
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {state.formData.enabled ? "Ativo e visível para os clientes" : "Desativado temporariamente"}
            </p>
          </div>
        </div>
        <Switch 
          checked={state.formData.enabled} 
          onCheckedChange={(val) => updateField('enabled', val)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD: REGRAS DE GANHO */}
        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-emerald-600">
            <Target size={20} />
            <h3 className="font-black uppercase italic text-sm text-slate-900">Regras de Ganho</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">R$ 1,00 gasto vale:</Label>
              <div className="relative group">
                <Input 
                  type="number" 
                  value={state.formData.conversionRatePoints} 
                  onChange={e => updateField('conversionRatePoints', Number(e.target.value))}
                  className="h-12 pl-4 pr-16 rounded-xl font-black text-slate-700 border-slate-100 bg-slate-50/50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">PTS</div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Bônus de Cadastro:</Label>
              <div className="relative group">
                <Input 
                  type="number" 
                  value={state.formData.pointsPerSignup} 
                  onChange={e => updateField('pointsPerSignup', Number(e.target.value))}
                  className="h-12 pl-4 pr-16 rounded-xl font-black text-slate-700 border-slate-100 bg-slate-50/50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded">PTS</div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD: VALIDADE E SEGURANÇA */}
        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-blue-600">
            <CalendarClock size={20} />
            <h3 className="font-black uppercase italic text-sm text-slate-900">Validade e Prazos</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Expiração dos Pontos:</Label>
              <div className="relative group">
                <Input 
                  type="number" 
                  value={state.formData.pointsExpirationDays} 
                  onChange={e => updateField('pointsExpirationDays', Number(e.target.value))}
                  className="h-12 pl-4 pr-16 rounded-xl font-black text-slate-700 border-slate-100 bg-slate-50/50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">DIAS</div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-medium leading-tight p-2 bg-slate-50 rounded-lg border border-dashed">
              Recomendado: 365 dias para manter o engajamento anual.
            </p>
          </div>
        </div>
      </div>

      {/* CARD: RESGATE E LIMITES */}
      <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center gap-4 text-blue-600">
          <div className="bg-blue-50 p-3 rounded-2xl"><ShieldCheck size={24} /></div>
          <div>
            <h2 className="font-black uppercase italic tracking-tighter text-xl text-slate-900">Configurações de Resgate</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Defina o valor e as travas de segurança</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex-1 space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400">Cada lote de:</Label>
                <Input 
                  type="number" 
                  value={state.formData.redemptionRatePoints} 
                  onChange={e => updateField('redemptionRatePoints', Number(e.target.value))}
                  className="h-10 rounded-lg font-black bg-white"
                />
                <span className="text-[9px] font-bold text-slate-400">PONTOS</span>
              </div>
              <ArrowRightLeft className="text-slate-300 mt-4" size={16} />
              <div className="flex-1 space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400">Vale em Reais:</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-400">R$</span>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={state.formData.redemptionRateMoney} 
                    onChange={e => updateField('redemptionRateMoney', Number(e.target.value))}
                    className="h-10 pl-8 rounded-lg font-black text-blue-600 bg-white"
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-400">DINHEIRO</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Pedido Mínimo (R$):</Label>
                <Input 
                  type="number" 
                  value={state.formData.minCartAmount} 
                  onChange={e => updateField('minCartAmount', Number(e.target.value))}
                  className="h-12 rounded-xl font-black text-slate-700 border-slate-100 bg-slate-50/50"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Desconto Máx (R$):</Label>
                <div className="h-12 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center px-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Definido pela última faixa da tabela abaixo ↓
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mensagem de Erro (Pedido Mínimo):</Label>
              <Input 
                value={state.formData.minOrderMessage} 
                onChange={e => updateField('minOrderMessage', e.target.value)}
                placeholder="Ex: Valor mínimo para resgate de pontos é R$ 50,00"
                className="h-12 rounded-xl text-xs font-medium border-slate-100 bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
          <div className="text-amber-600 shrink-0"><AlertCircle size={18} /></div>
          {/* ✅ CORREÇÃO: Escapando as aspas com &quot; para o ESLint não reclamar */}
          <p className="text-[10px] text-amber-800 font-bold uppercase leading-relaxed">
            Atenção: O &quot;Desconto Máximo&quot; evita que clientes com muitos pontos paguem R$ 0,00 em pedidos grandes, garantindo que você sempre cubra seus custos fixos.
          </p>
        </div>
      </div>
    </div>
  );
}