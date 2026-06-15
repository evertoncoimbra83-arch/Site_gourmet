import { Link } from "react-router-dom";
import { ArrowRight, Heart, Leaf, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeNutritionistBanner() {
  return (
    <section className="py-24 bg-white rounded-t-[5rem] border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="bg-slate-900 text-white rounded-[3.5rem] overflow-hidden border border-slate-800 shadow-2xl p-8 sm:p-12 lg:p-16 transition-all duration-500 hover:scale-[1.01]">
          <div className="max-w-3xl space-y-8 text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                <Leaf size={10} className="animate-pulse" /> Área do
                Profissional
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase italic tracking-tighter leading-[0.95] text-white">
                Transforme prescrições <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  em refeições reais.
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-tight leading-relaxed max-w-xl">
                Simplifique a rotina do seu consultório. Prescreva marmitas
                saudáveis, balanceadas e ultracongeladas da Gourmet Saudável
                diretamente para a casa do seu paciente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3 hover:bg-white/10 transition-colors">
                <Heart className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-xs font-black uppercase text-white tracking-wide">
                    Adesão de 100%
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                    Seu paciente segue a dieta com praticidade e sabor.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3 hover:bg-white/10 transition-colors">
                <Zap className="text-amber-400 shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-xs font-black uppercase text-white tracking-wide">
                    Painel Exclusivo
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                    Monte cardápios personalizados e gerencie indicações.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <Link to="/nutricionistas" className="shrink-0">
                <Button className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.15em] border-none shadow-lg shadow-slate-950/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                  Quero ser Parceiro <ArrowRight size={14} />
                </Button>
              </Link>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 max-w-[150px] hidden sm:inline leading-tight">
                * Cadastro gratuito sujeito a validação de CRN.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
