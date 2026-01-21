import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Wallet,
  Banknote,
  Landmark,
  CheckCircle2,
  CircleDollarSign,
  ShieldCheck,
} from "lucide-react";
import type { CheckoutVM } from "../logic/useCheckoutLogic";
import { cn } from "@/lib/utils";

const IconMap: Record<string, any> = {
  "credit-card": CreditCard,
  pix: Wallet,
  cash: Banknote,
  bank: Landmark,
  default: CircleDollarSign,
};

export default function CheckoutPayment(vm: CheckoutVM) {
  const {
    paymentMethods = [],
    selectedPaymentMethod,
    setSelectedPaymentMethod,
  } = vm;

  /**
   * ✅ RECUPERADO: Helper de imagem que aponta para o Backend (Porta 3001)
   */
  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return "";
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    
    // Limpa a string e garante o prefixo /uploads/ na porta 3001
    const cleanUrl = url.replace(/^\/+/, '').replace(/^uploads\//, '');
    return `http://localhost:3001/uploads/${cleanUrl}`;
  };

  return (
    <div className="space-y-6">
      {/* Título da Seção */}
      <div className="flex items-center gap-3 ml-2">
        <div className="h-8 w-8 rounded-full bg-slate-950 flex items-center justify-center text-white shadow-lg">
          <CircleDollarSign size={14} strokeWidth={3} />
        </div>
        <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 font-sans">
          Forma de Pagamento
        </h2>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] bg-white overflow-hidden">
        <CardContent className="p-8">
          {paymentMethods.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Nenhum canal de recebimento ativo
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paymentMethods.map((method: any) => {
                const isSelected = selectedPaymentMethod === method.id;
                const IconComponent = IconMap[method.icon || ""] || IconMap.default;

                const discountPerc = parseFloat(
                  String(method.discountPercentage ?? method.discount_percentage ?? "0").replace(",", ".")
                );

                // ✅ URL Normalizada recuperada aqui
                const brandLogo = getImageUrl(method.brand_logo_url || method.brandLogoUrl);

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={cn(
                      "relative p-6 border-2 rounded-[2.2rem] transition-all duration-500 flex flex-col items-center text-center gap-5 group active:scale-95",
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/20 shadow-lg shadow-emerald-900/5 ring-4 ring-emerald-500/5"
                        : "border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
                    )}
                  >
                    {/* Check de Seleção */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white p-1 rounded-full animate-in zoom-in duration-300 shadow-md z-10">
                        <CheckCircle2 size={12} strokeWidth={4} />
                      </div>
                    )}

                    {/* LOGO CONTAINER */}
                    <div className="h-20 w-full flex items-center justify-center">
                      {brandLogo ? (
                        <div className="relative h-16 w-16 flex items-center justify-center">
                          <img
                            src={brandLogo}
                            alt={method.name}
                            onError={(e) => {
                              // Se a imagem falhar, esconde ela e mostra o fallback
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.classList.remove("hidden");
                            }}
                            className={cn(
                              "h-full w-full object-contain rounded-xl transition-all duration-500 p-1", 
                              isSelected 
                                ? "scale-110 drop-shadow-xl" 
                                : "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"
                            )}
                          />
                          {/* Fallback Icon - Inicia Oculto (hidden) */}
                          <div className="hidden absolute inset-0 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center text-slate-300 border border-slate-100">
                            <IconComponent size={32} strokeWidth={1.5} />
                          </div>
                        </div>
                      ) : (
                        <div className={cn(
                          "h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                          isSelected 
                            ? "bg-emerald-500 text-white shadow-lg" 
                            : "bg-white text-slate-300 border border-slate-100"
                        )}>
                          <IconComponent size={32} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>

                    {/* Nome + Badges */}
                    <div className="space-y-3">
                      <p className={cn(
                        "font-black text-[13px] uppercase tracking-wider leading-none transition-colors",
                        isSelected ? "text-slate-900" : "text-slate-500"
                      )}>
                        {method.name}
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-bold uppercase tracking-widest border-none px-3 py-1 rounded-full transition-colors",
                          isSelected ? "bg-emerald-500 text-white" : "bg-slate-200/50 text-slate-400"
                        )}>
                          <ShieldCheck size={10} className="mr-1" /> Seguro
                        </Badge>

                        {discountPerc > 0 && (
                          <Badge className="text-[9px] font-black uppercase bg-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">
                            -{discountPerc}% OFF
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}