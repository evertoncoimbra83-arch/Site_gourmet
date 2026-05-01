import React, { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Card } from "@/components/ui/card";
import { appToast as toast } from "@/lib/app-toast"; 
import { CreditCard, Banknote, Landmark, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// --- INTERFACES ALINHADAS COM O BACKEND ---

interface PaymentMethod {
  id: string; 
  name: string;
  description: string;
  icon: string | null; // ✅ Removido '?' e ReactNode para bater exatamente com o TRPC
}

interface FoodCardBrand {
  id: string; 
  name: string;
  type: string;
  logoUrl: string | null; // ✅ Removido '?' para bater exatamente com o TRPC
}

interface PaymentMethodSelectorProps {
  onPaymentMethodSelected?: (methodId: string | number, methodName: string) => void;
  selectedMethodId?: string | number | null;
}

export default function PaymentMethodSelector({
  onPaymentMethodSelected,
  selectedMethodId,
}: PaymentMethodSelectorProps) {
  
  const { data: methods, isLoading: loadingMethods } = trpc.store.checkout.payment.getMethods.useQuery<PaymentMethod[]>();
  const { data: foodCardBrands } = trpc.store.checkout.payment.getFoodCardBrands.useQuery<FoodCardBrand[]>();
  
  const [selected, setSelected] = useState<string | number | undefined | null>(selectedMethodId);
  const [showFoodCardBrands, setShowFoodCardBrands] = useState(false);

  const handleSelectMethod = (methodId: string, methodName: string) => {
    setSelected(methodId);
    
    // Verifica se é cartão de benefício para exibir as bandeiras
    const nameUpper = methodName.toUpperCase();
    const isBenefitCard = nameUpper.includes("VA") || nameUpper.includes("VR") || nameUpper.includes("VALE");
    setShowFoodCardBrands(isBenefitCard);
    
    onPaymentMethodSelected?.(methodId, methodName);

    toast.success("Método Selecionado", { 
      description: `Você escolheu: ${methodName}` 
    });
  };

  if (loadingMethods) {
    return (
      <Card className="p-8 flex justify-center items-center bg-slate-50 border-dashed rounded-3xl">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Sincronizando meios de pagamento...
        </span>
      </Card>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <Card className="p-6 border-slate-100 shadow-sm rounded-3xl overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-black uppercase italic text-slate-900 tracking-tighter">
            Forma de Pagamento
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods?.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => handleSelectMethod(method.id, method.name)}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 group",
                String(selected) === String(method.id)
                  ? "border-emerald-600 bg-emerald-50/50"
                  : "border-slate-100 bg-white hover:border-emerald-200"
              )}
            >
              <div className="text-2xl bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-slate-50 group-hover:scale-105 transition-transform">
                {/* ✅ Lógica de ícone atualizada para lidar estritamente com string | null */}
                {method.icon ? (
                  <span className="text-xl">{method.icon}</span>
                ) : (
                  <Banknote size={24} className="text-slate-400" />
                )}
              </div>
              <div>
                <p className="font-black uppercase text-[11px] text-slate-800 leading-none tracking-tight">
                  {method.name}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">
                  {method.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Seção de Bandeiras (VA/VR) */}
      {showFoodCardBrands && foodCardBrands && foodCardBrands.length > 0 && (
        <Card className="p-6 bg-slate-900 border-none rounded-3xl shadow-xl animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 mb-6 text-white">
            <Landmark className="w-4 h-4 text-emerald-400" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Bandeiras Disponíveis</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(['va', 'vr'] as const).map((type) => (
              <div key={type} className="space-y-3">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b border-white/10 pb-2">
                  {type === 'va' ? 'Vale Alimentação' : 'Vale Refeição'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {foodCardBrands
                    .filter((brand) => brand.type === type)
                    .map((brand) => (
                      <div key={brand.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center p-1 overflow-hidden shrink-0">
                          {brand.logoUrl ? (
                            <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-[8px]">💳</span>
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-white uppercase truncate tracking-tight">
                          {brand.name}
                        </span>
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