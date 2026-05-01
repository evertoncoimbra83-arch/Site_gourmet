// client/src/pages/products/components/PrescriptionScanner.tsx

import React, { useState, useRef } from "react";
import { trpc } from "@/_core/trpc";
import { useNavigate } from "react-router-dom";
import { appToast as toast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";
import { isToday } from "date-fns";

// UI Components
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogTrigger 
} from "@/components/ui/dialog";

// Icons
import { 
  Loader2, BrainCircuit, Sparkles, 
  FileText, Camera, X, Sun, Moon,
  Upload, Scissors, AlertTriangle, ChevronRight
} from "lucide-react";

// ✅ Interface para remover 'any' da lógica de limite diário
interface UserScanRecord {
  id: string | number;
  createdAt: Date | string | null;
  status: string;
}

export function PrescriptionScanner() {
  // 1. ESTADOS
  const [isOpen, setIsOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>("image/jpeg");
  const [selectedMeals, setSelectedMeals] = useState<string[]>(["Almoço", "Jantar"]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  // 2. LÓGICA DE LIMITE DIÁRIO
  const { data: scans } = trpc.ai.getUserScans.useQuery();
  
  const scansToday = (scans as unknown as UserScanRecord[])?.filter((s) => 
    s.createdAt && isToday(new Date(s.createdAt))
  ).length || 0;
  
  const isLimitReached = scansToday >= 2;

  // 3. MUTATION
  const mutation = trpc.ai.enqueueTask.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setIsOpen(false);
        resetScanner();
        
        utils.ai.getUserScans.invalidate();
        navigate(`/cardapio-ia`);
        
        toast.success("Mapeamento iniciado!", {
          description: "A IA está personalizando seu cardápio. Acompanhe no histórico."
        });
      }
    },
    onError: (err) => {
      const message = err.data?.code === "TOO_MANY_REQUESTS" 
        ? "Limite diário atingido (2 scans). Tente novamente amanhã!"
        : err.message;
      toast.error("Erro ao iniciar análise", { description: message });
    }
  });

  // 4. HANDLERS
  const resetScanner = () => {
    setRawText("");
    setFilePreview(null);
    setSelectedMeals(["Almoço", "Jantar"]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    if (isLimitReached) return;
    if (!rawText.trim() && !filePreview) return;
    
    const fileBase64 = filePreview?.split(",")[1];
    const mealContext = selectedMeals.length > 0 
      ? `Focar nas refeições: ${selectedMeals.join(" e ")}. ` 
      : "";
    
    // ✅ CORREÇÃO TS2353: Removido 'mimeType' para bater com o contrato do Backend
    mutation.mutate({ 
      domain: "nutrition",
      payload: { 
        rawText: `${mealContext}\n${rawText}`, 
        fileBase64
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { 
      if(!isLimitReached || !open) setIsOpen(open); 
      if(!open) resetScanner(); 
    }}>
      <DialogTrigger asChild>
        <button 
          disabled={isLimitReached}
          className={cn(
            "relative w-full max-w-85 group text-left outline-none transition-all duration-300",
            isLimitReached ? "opacity-50 cursor-not-allowed grayscale" : "active:scale-[0.98] hover:-translate-y-1"
          )}
        >
          {!isLimitReached && (
            <div className="absolute -inset-0.5 bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-400 rounded-4xl blur-md opacity-40 group-hover:opacity-100 transition duration-500" />
          )}
          
          <div className="relative flex items-center gap-5 p-5 sm:p-6 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-4xl overflow-hidden">
            <div className="relative h-14 w-14 shrink-0 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Camera size={26} strokeWidth={2.5} className="text-slate-950" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1 text-emerald-400">
                <Sparkles size={12} className="fill-current animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                  {isLimitReached ? "Limite Atingido" : "Health Intelligence"}
                </span>
              </div>
              <h3 className="text-white text-xl font-black italic tracking-tighter uppercase leading-none">
                {isLimitReached ? "Volte Amanhã" : <>Escanear <span className="text-emerald-400">Dieta</span></>}
              </h3>
            </div>

            {!isLimitReached && (
              <div className="shrink-0 h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:translate-x-1 transition-all">
                <ChevronRight size={18} className="text-emerald-400" />
              </div>
            )}
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-slate-50/95 backdrop-blur-xl rounded-[3rem] shadow-3xl text-left">
        <div className="p-8 pb-0">
          <DialogHeader className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-4 border border-emerald-50">
               <BrainCircuit className="text-emerald-600" size={32} strokeWidth={1.5} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
              Mapeamento <span className="text-emerald-600">Inteligente</span>
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] mt-2">
              Envie sua dieta para ajuste de macros ({scansToday}/2 hoje)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pb-8">
            {isLimitReached && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-3xl flex items-start gap-3">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <p className="text-[11px] font-bold text-red-800 leading-tight">
                  Limite de 2 mapeamentos diários atingido. Disponível novamente amanhã.
                </p>
              </div>
            )}

            <div 
              onClick={() => !isLimitReached && fileInputRef.current?.click()}
              className={cn(
                "relative group h-44 rounded-4xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer",
                filePreview ? "border-emerald-500 bg-white shadow-xl shadow-emerald-500/5" : "border-slate-200 bg-white/50 hover:bg-white",
                isLimitReached && "opacity-50 cursor-not-allowed"
              )}
            >
              <input type="file" accept="image/*,application/pdf" ref={fileInputRef} className="hidden" onChange={handleFileChange} disabled={isLimitReached} />
              
              {filePreview ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  {fileMimeType === "application/pdf" ? (
                    <div className="flex flex-col items-center">
                       <FileText className="text-emerald-500 mb-2" size={40} />
                       <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">PDF Pronto</span>
                    </div>
                  ) : (
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <button onClick={(e) => { e.stopPropagation(); resetScanner(); }} className="p-3 bg-white/90 rounded-full text-red-500 shadow-xl">
                      <X size={20} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                  <div className="bg-slate-100 group-hover:bg-emerald-50 p-4 rounded-2xl mb-3 transition-colors">
                    <Upload size={24} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest">Anexar foto ou PDF</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                {[
                  { id: "Almoço", icon: Sun },
                  { id: "Jantar", icon: Moon }
                ].map((meal) => {
                  const isActive = selectedMeals.includes(meal.id);
                  return (
                    <button 
                      key={meal.id}
                      type="button"
                      disabled={isLimitReached}
                      onClick={() => setSelectedMeals(prev => 
                        prev.includes(meal.id) ? prev.filter(m => m !== meal.id) : [...prev, meal.id]
                      )}
                      className={cn(
                        "flex-1 flex flex-col items-center justify-center gap-2 h-20 rounded-[1.8rem] transition-all border-2",
                        isActive 
                          ? `bg-white border-emerald-500 shadow-lg shadow-emerald-500/10` 
                          : "bg-white/50 border-transparent text-slate-400 grayscale opacity-70"
                      )}
                    >
                      <meal.icon size={20} className={isActive ? `text-emerald-500` : ""} />
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", isActive ? "text-slate-900" : "")}>{meal.id}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="relative">
              <Textarea 
                disabled={isLimitReached}
                placeholder="Ou cole as recomendações do nutricionista aqui..."
                className="min-h-30 rounded-[2rem] bg-white border-none p-6 text-xs resize-none shadow-inner focus-visible:ring-emerald-500"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
                 <Scissors size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 pt-0">
          <Button 
            onClick={handleAnalyze}
            disabled={mutation.isPending || isLimitReached || (!rawText.trim() && !filePreview)}
            className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-[1.8rem] font-black uppercase text-[11px] tracking-[0.25em] shadow-2xl transition-all active:scale-95 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-emerald-400" size={20} />
                <span>Processando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400 animate-pulse" />
                <span>Iniciar Configuração IA</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}