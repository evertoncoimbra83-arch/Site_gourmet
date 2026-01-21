import { trpc } from "@/_core/trpc";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { CreditCard, Banknote, Landmark, Loader2 } from "lucide-react";

interface PaymentMethodSelectorProps {
  onPaymentMethodSelected?: (methodId: number, methodName: string) => void;
  selectedMethodId?: number;
}

export default function PaymentMethodSelector({
  onPaymentMethodSelected,
  selectedMethodId,
}: PaymentMethodSelectorProps) {
  // ✅ CORREÇÃO: Caminho do roteador alterado para 'checkout.payment'
  const { data: methods, isLoading: loadingMethods } = trpc.checkout.payment.getMethods.useQuery();
  const { data: foodCardBrands } = trpc.checkout.payment.getFoodCardBrands.useQuery();
  
  const [selected, setSelected] = useState<number | undefined>(selectedMethodId);
  const [showFoodCardBrands, setShowFoodCardBrands] = useState(false);

  const handleSelectMethod = (methodId: number, methodName: string) => {
    setSelected(methodId);
    // Verifica se é cartão de benefício para exibir as bandeiras
    const isBenefitCard = methodName.toUpperCase().includes("VA") || methodName.toUpperCase().includes("VR");
    setShowFoodCardBrands(isBenefitCard);
    
    onPaymentMethodSelected?.(methodId, methodName);
    toast.success(`Método: ${methodName}`);
  };

  if (loadingMethods) {
    return (
      <Card className="p-8 flex justify-center items-center bg-slate-50 border-dashed">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        <span className="ml-2 text-sm font-medium text-slate-500">Carregando opções...</span>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-black uppercase italic text-slate-900 tracking-tighter">
            Forma de Pagamento
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods?.map((method: any) => (
            <button
              key={method.id}
              type="button"
              onClick={() => handleSelectMethod(method.id, method.name)}
              className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${
                selected === method.id
                  ? "border-emerald-600 bg-emerald-50/50"
                  : "border-slate-100 bg-white hover:border-emerald-200"
              }`}
            >
              <div className="text-2xl bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-slate-50">
                {method.icon || <Banknote size={24} />}
              </div>
              <div>
                <p className="font-black uppercase text-xs text-slate-800 leading-none">
                  {method.name}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                  {method.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Seção de Bandeiras (VA/VR) */}
      {showFoodCardBrands && foodCardBrands && foodCardBrands.length > 0 && (
        <Card className="p-6 bg-slate-900 border-none rounded-3xl shadow-xl animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 mb-6 text-white">
            <Landmark className="w-4 h-4 text-emerald-400" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Bandeiras Disponíveis</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['va', 'vr'].map((type) => (
              <div key={type} className="space-y-3">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest border-b border-white/10 pb-1">
                  {type === 'va' ? 'Vale Alimentação' : 'Vale Refeição'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {foodCardBrands
                    .filter((brand: any) => brand.type === type)
                    .map((brand: any) => (
                      <div key={brand.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/5">
                        <div className="w-6 h-6 rounded bg-white flex items-center justify-center p-1">
                          {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.name} className="object-contain" /> : "💳"}
                        </div>
                        <span className="text-[9px] font-bold text-white uppercase truncate">{brand.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}