// client/src/pages/checkout/components/CheckoutPayment.tsx

import React, { useState } from "react";
import { 
  CreditCard, Banknote, Landmark, CircleDot, Circle,
  CircleDollarSign, Zap, Ticket, Loader2, ChevronDown, ShieldCheck, Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useCheckout } from "../context/CheckoutContext";
import { categorizePaymentMethods } from "../logic/checkout-helpers";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

const IconMap: Record<string, React.ElementType> = {
  "credit-card": CreditCard,
  pix: Zap,
  cash: Banknote,
  bank: Landmark,
  meal: Ticket, 
  default: CircleDollarSign,
};

interface PaymentMethodUI {
  id: string;
  name: string;
  icon?: string;
  brand_logo_url?: string;
  brandLogoUrl?: string;
  discountLabel?: string;
}

const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const cleanUrl = url.replace(/^\/+/, '').replace(/^uploads\//, '');
  return `${API_BASE_URL}/uploads/${cleanUrl}`;
};

// ==================== CARD SELECIONADO ====================
const SelectedPaymentCard = ({ m, onChange, disabled }: { m: PaymentMethodUI; onChange: () => void; disabled?: boolean }) => {
  const IconComponent = IconMap[m.icon || ""] || IconMap.default;
  const brandLogo = getImageUrl(m.brand_logo_url || m.brandLogoUrl);

  return (
    <div className={cn(
      "relative overflow-hidden p-5 rounded-4xl border-2 border-emerald-500/20 bg-emerald-50/50 flex items-center justify-between group animate-in zoom-in-95 duration-300",
      disabled && "opacity-70 pointer-events-none"
    )}>
      <div className="flex items-center gap-4 relative z-10 min-w-0">
        <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-100">
          {brandLogo ? (
            <img src={brandLogo} className="h-7 w-7 object-contain" alt={m.name} />
          ) : (
            <IconComponent size={22} strokeWidth={2.5} />
          )}
        </div>
        <div className="flex flex-col min-w-0 text-left">
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600/70 mb-0.5">Pagamento Selecionado</span>
          <p className="text-sm font-black text-slate-800 leading-none">{m.name}</p>
          {m.discountLabel && (
            <p className="text-[10px] font-bold text-emerald-600 mt-1">{m.discountLabel} de Desconto</p>
          )}
        </div>
      </div>
      
      {!disabled && (
        <button
          onClick={onChange}
          className="relative z-10 shrink-0 bg-white border border-emerald-200 text-emerald-700 h-10 px-4 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-50 active:scale-95 transition-all shadow-sm flex items-center gap-2"
        >
          <Edit2 size={14} /> Trocar
        </button>
      )}
    </div>
  );
};

// ==================== LINHA DE PAGAMENTO ====================
const PaymentRow = ({ m, isSelected, onSelect, disabled }: { m: PaymentMethodUI; isSelected: boolean; onSelect: (id: string) => void; disabled?: boolean }) => {
  const IconComponent = IconMap[m.icon || ""] || IconMap.default;
  const brandLogo = getImageUrl(m.brand_logo_url || m.brandLogoUrl);

  return (
    <button
      type="button"
      disabled={disabled}
      data-testid="payment-method-option"
      onClick={() => onSelect(m.id)} 
      className={cn(
        "w-full flex items-center p-5 transition-all duration-200 group text-left",
        isSelected ? "bg-emerald-50/40" : "hover:bg-slate-50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center transition-all border-2",
        isSelected ? "bg-white border-emerald-500 shadow-lg shadow-emerald-500/10" : "bg-white border-slate-100 text-slate-400 group-hover:border-slate-200"
      )}>
        {brandLogo ? (
          <img src={brandLogo} className={cn("h-7 w-7 object-contain", !isSelected && "grayscale opacity-50")} alt={m.name} />
        ) : (
          <IconComponent size={20} strokeWidth={isSelected ? 2.5 : 2} className={isSelected ? "text-emerald-500" : ""} />
        )}
      </div>

      <div className="ml-4 flex-1">
        <span className={cn("text-xs font-black uppercase tracking-tight", isSelected ? "text-slate-900" : "text-slate-600")}>
          {m.name}
        </span>
        {m.discountLabel && (
          <div className="mt-1">
            <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase">{m.discountLabel}</span>
          </div>
        )}
      </div>

      <div className="ml-3">
        {isSelected ? (
          <CircleDot className="text-emerald-500" size={22} strokeWidth={3} />
        ) : (
          <Circle className="text-slate-200" size={22} strokeWidth={2} />
        )}
      </div>
    </button>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
export default function CheckoutPayment() {
  const { payment, actions, isLoading, machineState, isBusy } = useCheckout();
  const [viewMode, setViewMode] = useState<"compact" | "expand">("compact");

  // ✅ Trava de fluxo: impede troca durante envio ou sucesso
  const isLocked = isBusy || machineState === 'submitting' || machineState === 'success';

  const normalizedMethods: PaymentMethodUI[] = payment.methods.map(m => ({
    ...m,
    id: String(m.id)
  }));

  const { standard, benefits } = categorizePaymentMethods(normalizedMethods);
  const selectedMethod = normalizedMethods.find(m => String(m.id) === String(payment.selectedId));

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 bg-slate-50/50 rounded-4xl border-2 border-dashed border-slate-100">
        <Loader2 className="animate-spin text-emerald-500" size={28} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando carteira...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {selectedMethod && viewMode === "compact" ? (
        <SelectedPaymentCard 
          m={selectedMethod} 
          onChange={() => setViewMode("expand")} 
          disabled={isLocked}
        />
      ) : (
        <div className={cn("space-y-3", isLocked && "opacity-60 pointer-events-none")}>
          <div className="flex items-center justify-between px-2 mb-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Forma de Pagamento</h2>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <ShieldCheck size={14} />
              <span className="text-[9px] font-black uppercase">Seguro</span>
            </div>
          </div>

          <PaymentAccordionUI 
            title="Padrão & Digitais" 
            icon={<CircleDollarSign size={18} />} 
            methods={standard as PaymentMethodUI[]} 
            selectedId={payment.selectedId} 
            onSelect={(id) => { 
              console.log("[CheckoutPayment] Metodo selecionado:", id);
              actions.setPayment(id); 
              setViewMode("compact"); 
            }} 
            disabled={isLocked}
          />
          
          <PaymentAccordionUI 
            title="Vales e Benefícios" 
            icon={<Ticket size={18} />} 
            methods={benefits as PaymentMethodUI[]} 
            selectedId={payment.selectedId} 
            onSelect={(id) => { 
              console.log("[CheckoutPayment] Metodo selecionado:", id);
              actions.setPayment(id); 
              setViewMode("compact"); 
            }} 
            isBenefit 
            disabled={isLocked}
          />
        </div>
      )}
    </div>
  );
}

function PaymentAccordionUI({ title, icon, methods, selectedId, onSelect, isBenefit, disabled }: {
  title: string;
  icon: React.ReactNode;
  methods: PaymentMethodUI[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isBenefit?: boolean;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(methods.some(m => String(m.id) === String(selectedId)));
  if (methods.length === 0) return null;

  return (
    <div className={cn(
      "overflow-hidden rounded-4xl border-2 transition-all", 
      isOpen ? "bg-white border-slate-100 shadow-xl shadow-slate-200/40" : "bg-slate-50/50 border-transparent hover:border-slate-100"
    )}>
      <button 
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center text-white", isBenefit ? "bg-emerald-500" : "bg-slate-900")}>
            {icon}
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">{title}</h3>
        </div>
        <ChevronDown size={18} className={cn("transition-transform text-slate-400", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-slate-50">
            {methods.map((m) => (
              <PaymentRow 
                key={m.id} 
                m={m} 
                isSelected={String(selectedId) === String(m.id)} 
                onSelect={onSelect} 
                disabled={disabled}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
