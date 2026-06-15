import { Clock, Snowflake, Truck, UtensilsCrossed } from "lucide-react";

const howItWorksSteps = [
  {
    step: "01",
    icon: <UtensilsCrossed className="w-6 h-6 text-emerald-600" />,
    title: "Monte Seu Cardápio",
    description:
      "Selecione pratos avulsos ou escolha um Kit pronto nutricionalmente equilibrado.",
  },
  {
    step: "02",
    icon: <Snowflake className="w-6 h-6 text-blue-500" />,
    title: "Cozido & Ultracongelado",
    description:
      "Cozinhamos tudo fresco e congelamos rapidamente para travar os nutrientes e sabor.",
  },
  {
    step: "03",
    icon: <Truck className="w-6 h-6 text-amber-500" />,
    title: "Receba em Casa",
    description:
      "Entregamos na sua temperatura ideal e dia agendado. Guarde direto no freezer.",
  },
  {
    step: "04",
    icon: <Clock className="w-6 h-6 text-rose-500" />,
    title: "Aqueça & Saboreie",
    description:
      "Esquente por apenas 5-7 minutos no micro-ondas e coma comida saudável de verdade.",
  },
];

export function HomeHowItWorks() {
  return (
    <section className="bg-slate-900 text-white py-20 rounded-[3.5rem] md:rounded-[5rem] mx-4 relative z-10 shadow-3xl text-left">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
            Passo a Passo
          </span>
          <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
            Como Funciona
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {howItWorksSteps.map((s, i) => (
            <div
              key={i}
              className="flex flex-col space-y-4 group cursor-default relative"
            >
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-emerald-600 transition-colors duration-500">
                  {s.icon}
                </div>
                <span className="text-3xl font-black text-white/10 italic select-none group-hover:text-emerald-500/20 transition-colors">
                  {s.step}
                </span>
              </div>
              <h3 className="text-base font-black uppercase italic tracking-wider text-white pt-2">
                {s.title}
              </h3>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-tight leading-relaxed">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
