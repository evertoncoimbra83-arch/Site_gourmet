import { Link } from "react-router-dom";
import { ActiveDietBanner } from "@/components/ActiveDietBanner";
import { Button } from "@/components/ui/button";

interface HomeLoyaltySectionProps {
  isAuthenticated: boolean;
}

export function HomeLoyaltySection({
  isAuthenticated,
}: HomeLoyaltySectionProps) {
  return (
    <section className="py-12 container mx-auto px-4">
      {isAuthenticated ? (
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="rounded-[2.5rem] border border-emerald-100 bg-linear-to-r from-emerald-50 to-white p-8 text-left shadow-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-emerald-200 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
              Clube Gourmet
            </div>
            <div className="mt-4 space-y-3">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-slate-900">
                Você ganha pontos em cada compra
              </h3>
              <p className="text-sm text-slate-600 font-medium max-w-xl leading-relaxed">
                Continue comprando pelo site para acumular pontos e trocar por
                descontos nas próximas compras.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/perfil/fidelidade">
                  <Button className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.15em]">
                    Ver meus pontos
                  </Button>
                </Link>
                <Link to="/produtos">
                  <Button
                    variant="outline"
                    className="h-12 px-6 rounded-2xl border-emerald-200 text-emerald-700 font-black text-[10px] uppercase tracking-[0.15em] hover:bg-emerald-50"
                  >
                    Continuar comprando
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <ActiveDietBanner />
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-[2.5rem] p-8 md:p-10 border border-slate-700/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-left">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
              Clube Gourmet
            </div>
            <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter leading-none">
              Compre e ganhe pontos <br className="hidden md:inline" />
              <span className="text-emerald-400">no Clube Gourmet</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium max-w-xl">
              Acumule pontos em cada pedido e troque por descontos nas próximas
              compras.
            </p>
          </div>
          <Button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-auth-drawer"))
            }
            className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.15em] shrink-0 active:scale-95 transition-all border-none"
          >
            Criar conta
          </Button>
        </div>
      )}
    </section>
  );
}
