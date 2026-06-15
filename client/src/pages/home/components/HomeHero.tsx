import { Link } from "react-router-dom";
import { ArrowRight, Clock, Package, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CepStatus } from "../types";

interface HomeHeroProps {
  isEmergency: boolean;
  cepInput: string;
  checkingCep: boolean;
  cepStatus: CepStatus | null;
  onCepChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckCep: () => void;
}

export function HomeHero({
  isEmergency,
  cepInput,
  checkingCep,
  cepStatus,
  onCepChange,
  onCheckCep,
}: HomeHeroProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-24 lg:pb-32">
      <div className="absolute top-0 left-0 right-0 h-160 bg-linear-to-b from-emerald-50/40 to-transparent -z-10" />

      <div className="container mx-auto px-4 max-w-4xl text-center space-y-10 animate-in fade-in duration-700">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 shadow-sm mx-auto">
          <span
            className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              isEmergency ? "bg-amber-500" : "bg-emerald-500"
            )}
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {isEmergency ? "Ajustando a Cozinha" : "Ingredientes Frescos Hoje"}
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[0.85] uppercase">
          Natural por essência, <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent italic lowercase font-serif font-normal block pt-2">
            feita do seu jeito.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-500 max-w-xl font-bold uppercase tracking-tight leading-relaxed mx-auto">
          Comida de verdade, sem conservantes e com o tempero que a sua saúde
          merece. Sabor autêntico para quem não abre mão do equilíbrio.
        </p>

        <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-wider">
          <div className="flex text-amber-400">
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
          </div>
          <span>• Alta Praticidade e Variedade</span>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          {isEmergency ? (
            <div className="flex items-center gap-3 p-5 bg-amber-50 rounded-[2rem] border border-amber-200 text-amber-800 shadow-inner">
              <Clock className="animate-pulse" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Pausa Criativa
                </p>
                <p className="text-xs font-bold italic">
                  Nossos chefs voltam em instantes!
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link to="/produtos">
                <Button className="h-16 px-10 rounded-2xl bg-slate-900 hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95">
                  Ver Cardápio <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/pacotes">
                <Button
                  variant="outline"
                  className="h-16 px-8 rounded-2xl border-slate-200 text-slate-700 font-black text-xs uppercase tracking-[0.2em] hover:border-primary/50 hover:text-primary transition-all bg-white"
                >
                  <Package className="mr-2 w-4 h-4" /> Kits
                </Button>
              </Link>
            </div>
          )}
        </div>

        {!isEmergency && (
          <div className="space-y-4 pt-6 border-t border-slate-100 max-w-md mx-auto">
            <div className="space-y-2">
              <label
                htmlFor="cep-input"
                className="text-[9px] font-black uppercase tracking-widest text-slate-400 block text-center"
              >
                Consultar área de entrega:
              </label>
              <div className="flex gap-2">
                <input
                  id="cep-input"
                  type="text"
                  placeholder="Digite seu CEP (Ex: 13200-000)"
                  className="flex-1 h-12 px-4 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-primary bg-white transition-all uppercase text-center"
                  value={cepInput}
                  onChange={onCepChange}
                  maxLength={9}
                />
                <Button
                  type="button"
                  onClick={onCheckCep}
                  disabled={
                    checkingCep || cepInput.replace(/\D/g, "").length < 8
                  }
                  className="h-12 px-5 bg-slate-900 text-white hover:bg-primary rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  {checkingCep ? "..." : "Consultar"}
                </Button>
              </div>
              {cepStatus && (
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider text-center",
                    cepStatus.success ? "text-emerald-600" : "text-rose-500"
                  )}
                >
                  {cepStatus.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
