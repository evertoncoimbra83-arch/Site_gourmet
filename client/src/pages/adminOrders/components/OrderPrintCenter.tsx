import { useState, useRef, useEffect, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { 
  Printer, Tag, ArrowLeft, Loader2, 
  Layout, Package, Utensils, X 
} from "lucide-react";
import { trpc } from "@/_core/trpc"; 
import { cn } from "@/lib/utils"; 
import { toast } from "@/components/ui/use-toast"; 

import { useLabelLogic } from "@/hooks/useLabelLogic";
import { LabelCanvas } from "@/components/LabelCanvas";
import { LabelDesigner } from "@/pages/adminOrders/components/LabelDesigner";

export type LabelElement = {
  id: string;
  type: 'text' | 'variable' | 'box' | 'image';
  content: string; 
  x: number; y: number;
  width: number; height: number;
  fontSize: number;
  fontWeight: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: string;
  zIndex: number;
};

export function OrderPrintCenter({ orderId, onBack }: { orderId: string, onBack: () => void }) {
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [selectedLabelIndex, setSelectedLabelIndex] = useState(0);
  const [validityDays] = useState(90);

  const utils = trpc.useUtils(); 
  const labelRef = useRef<HTMLDivElement>(null);

  const { data: order, isLoading: isLoadingOrder } = trpc.admin.orders.getById.useQuery({ id: orderId });
  const CONFIG_KEY = "zebra_layout_10x15_default";
  
  const { data: savedConfig, isLoading: isLoadingConfig } = trpc.admin.orders.getConfig.useQuery(
    { key: CONFIG_KEY },
    { refetchOnMount: true, refetchOnWindowFocus: false }
  );

  const saveMutation = trpc.admin.orders.setConfig.useMutation({
    onSuccess: () => {
      toast.success("Layout salvo e atualizado!");
      utils.admin.orders.getConfig.invalidate({ key: CONFIG_KEY });
      setIsDesignMode(false);
    },
    onError: () => toast.error("Erro ao salvar layout.")
  });

  const { flatLabels, parseContent } = useLabelLogic(order, selectedLabelIndex, validityDays);

  const initialLayout = useMemo(() => {
    if (!savedConfig?.configValue) return [];
    try {
      return JSON.parse(savedConfig.configValue);
    } catch (e) {
      return [];
    }
  }, [savedConfig]);

  const handlePrint = useReactToPrint({
    contentRef: labelRef,
    documentTitle: `Zebra_Pedido_${orderId}`,
  });

  const handleSavePermanent = (elements: LabelElement[]) => {
    saveMutation.mutate({ key: CONFIG_KEY, value: JSON.stringify(elements) });
  };

  if (isLoadingOrder || isLoadingConfig) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="animate-spin text-emerald-600" size={48} />
    </div>
  );

  // 🚨 MUDANÇA CRÍTICA AQUI:
  // Se estiver no modo Design, renderizamos O DESIGNER em tela cheia e retornamos cedo.
  // Isso tira o designer de dentro da sidebar apertada.
  if (isDesignMode) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8">
         {/* Botão para cancelar e voltar sem salvar */}
         <div className="mb-4">
            <Button variant="ghost" onClick={() => setIsDesignMode(false)} className="text-slate-500 font-bold uppercase text-xs">
              <ArrowLeft size={16} className="mr-2"/> Cancelar Edição
            </Button>
         </div>

         <LabelDesigner 
            key={initialLayout ? 'loaded' : 'empty'} 
            order={order} 
            onSaveTemplate={handleSavePermanent}
            initialLayout={initialLayout}
            onCancel={() => setIsDesignMode(false)} // Passamos a função de sair
         />
      </div>
    );
  }

  // --- MODO VISUALIZAÇÃO/IMPRESSÃO (Layout Padrão) ---
  return (
    <div className="flex flex-col lg:flex-row gap-8 p-8 bg-[#F8FAFC] min-h-screen font-sans">
      
      <div className="w-full lg:w-96 space-y-4 shrink-0">
        <Button variant="ghost" onClick={onBack} className="font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600">
          <ArrowLeft size={16} className="mr-2"/> Voltar
        </Button>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-6">
          <header className="flex justify-between items-center border-b pb-4">
            <h2 className="font-black uppercase italic text-xl leading-none text-slate-900">
              Studio <span className="text-emerald-600">Zebra</span>
            </h2>
            {/* Botão que ativa o modo Design Tela Cheia */}
            <Button size="icon" variant="outline" onClick={() => setIsDesignMode(true)} className="rounded-2xl h-10 w-10 transition-all hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200">
              <Layout size={18} />
            </Button>
          </header>

          <div className="space-y-6 animate-in slide-in-from-left-2 duration-300">
            <div className="space-y-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1">
                <Tag size={10}/> Marmitas no Pedido:
              </span>
              <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {flatLabels.map((label: any, idx: number) => (
                  <button 
                    key={label.id} 
                    onClick={() => setSelectedLabelIndex(idx)} 
                    className={cn(
                      "p-4 rounded-2xl border-2 text-left transition-all relative",
                      selectedLabelIndex === idx ? "border-emerald-500 bg-emerald-50 shadow-md" : "border-slate-50 bg-slate-50 opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {label.slot ? <Package size={12} className="text-emerald-600" /> : <Utensils size={12} className="text-slate-400" />}
                      <span className="text-[10px] font-black uppercase text-slate-800 truncate">{label.displayName}</span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{label.parentName} {label.slot && `• ${label.slot}`}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handlePrint} className="w-full h-16 bg-slate-900 text-white rounded-3xl gap-3 shadow-xl hover:bg-black transition-all group">
              <Printer size={20} className="group-hover:scale-110 transition-transform" /> 
              <span className="font-black uppercase italic tracking-tighter text-lg">Imprimir Zebra</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center p-10 bg-slate-200/50 rounded-[4rem] border-4 border-dashed border-slate-300 shadow-inner overflow-hidden relative">
         <LabelCanvas 
          elements={initialLayout.length > 0 ? initialLayout : []} 
          setElements={() => {}} 
          isDesignMode={false} 
          selectedId={null} 
          setSelectedId={() => {}} 
          parseContent={parseContent} 
          labelRef={labelRef} 
        />
      </div>
    </div>
  );
}