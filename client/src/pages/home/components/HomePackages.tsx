import { Link } from "react-router-dom";
import { ArrowRight, Clock, Package, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PackageItem } from "../types";
import { parseHighlights, toPrice } from "../utils/packageHelpers";

interface HomePackagesProps {
  packages: PackageItem[] | undefined;
  isLoading: boolean;
  isEmergency: boolean;
  onSelectPackage: (packageId: string) => void;
}

export function HomePackages({
  packages,
  isLoading,
  isEmergency,
  onSelectPackage,
}: HomePackagesProps) {
  if (!isLoading && (!packages || packages.length === 0)) return null;

  return (
    <section className="py-20 container mx-auto px-4">
      <div className="flex items-end justify-between border-b border-slate-100 pb-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package className="text-emerald-600" size={18} />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">
              Monte o Seu
            </span>
          </div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Kits & Pacotes
          </h2>
        </div>
        <Link to="/pacotes">
          <Button
            variant="ghost"
            className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-emerald-600"
          >
            Ver Todos <ArrowRight className="ml-2 w-3 h-3" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-80 bg-slate-100 rounded-[2.5rem] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-12 -mx-4 px-4 snap-x no-scrollbar lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-x-visible lg:pb-0">
          {packages?.slice(0, 6).map(pkg => {
            const price = toPrice(pkg.price);
            const salePrice = toPrice(pkg.salePrice);
            const finalPrice =
              salePrice > 0 && salePrice < price ? salePrice : price;
            const hasDiscount = salePrice > 0 && salePrice < price;
            const highlights = parseHighlights(pkg.highlights);

            return (
              <div
                key={pkg.id}
                className="min-w-[260px] md:min-w-0 snap-start group relative bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] transition-all duration-500 flex flex-col lg:w-full"
              >
                {pkg.isPopular && (
                  <div className="absolute top-5 left-5 z-10 flex items-center gap-1 bg-amber-400 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                    <Star size={10} className="fill-white" /> Mais Pedido
                  </div>
                )}

                {hasDiscount && (
                  <div className="absolute top-5 right-5 z-10 bg-rose-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                    -{Math.round(((price - salePrice) / price) * 100)}%
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1 pt-12">
                  <h3 className="font-black text-lg text-slate-900 uppercase italic tracking-tight mb-2 line-clamp-1">
                    {pkg.name}
                  </h3>

                  {pkg.description && (
                    <p className="text-xs text-slate-400 font-medium leading-relaxed mb-3 line-clamp-2">
                      {pkg.description}
                    </p>
                  )}

                  {highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {highlights.slice(0, 3).map((h, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                    <div className="flex flex-col">
                      {hasDiscount && (
                        <span className="text-[10px] text-slate-400 line-through font-medium">
                          R$ {price.toFixed(2)}
                        </span>
                      )}
                      <span className="text-2xl font-black text-slate-900 italic">
                        R$ {finalPrice.toFixed(2)}
                      </span>
                    </div>

                    {!isEmergency ? (
                      <Button
                        onClick={() => onSelectPackage(String(pkg.id))}
                        className="rounded-2xl bg-emerald-600 hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest px-5 h-11 shadow-lg shadow-emerald-900/20 transition-all"
                      >
                        Montar Kit
                      </Button>
                    ) : (
                      <Clock size={20} className="text-slate-300" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
