import { Link } from "react-router-dom";
import { ArrowRight, Flame } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import type { ShowcaseData } from "../types";

interface HomeShowcasesProps {
  showcases: ShowcaseData[] | undefined;
  isLoading: boolean;
  onSelectDish: (dishId: number) => void;
}

export function HomeShowcases({
  showcases,
  isLoading,
  onSelectDish,
}: HomeShowcasesProps) {
  return (
    <section className="py-20 container mx-auto px-4">
      {isLoading ? (
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="min-w-70 h-96 bg-slate-100 rounded-[3rem] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-32">
          {showcases
            ?.filter(showcase => (showcase.items?.length || 0) > 0)
            .map(showcase => (
              <div key={showcase.id} className="space-y-10 group/showcase">
                <div className="flex items-end justify-between border-b border-slate-100 pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="text-orange-500" size={18} />
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">
                        Os Favoritos
                      </span>
                    </div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
                      {showcase.title}
                    </h2>
                  </div>
                  <Link to="/produtos">
                    <Button
                      variant="ghost"
                      className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-emerald-600"
                    >
                      Ver Tudo <ArrowRight className="ml-2 w-3 h-3" />
                    </Button>
                  </Link>
                </div>

                <div className="flex gap-8 overflow-x-auto pb-12 -mx-4 px-4 snap-x no-scrollbar cursor-grab active:cursor-grabbing">
                  {showcase.items?.slice(0, 8).map(product => (
                    <div
                      key={product.id}
                      className="min-w-[240px] md:min-w-85 snap-start"
                    >
                      <ProductCard
                        product={product}
                        onClick={() => onSelectDish(Number(product.id))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
