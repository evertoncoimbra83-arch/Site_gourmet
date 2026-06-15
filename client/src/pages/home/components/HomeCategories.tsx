import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HomeCategory } from "../types";
import {
  getCategoryColorClasses,
  getCategoryFallbackDescription,
} from "../utils/categoryHelpers";

interface HomeCategoriesProps {
  categories: HomeCategory[] | undefined;
}

export function HomeCategories({ categories }: HomeCategoriesProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-12 container mx-auto px-4 border-b border-slate-100">
      <h2 className="sr-only">Categorias de Marmitas Congeladas</h2>
      <div className="flex items-center gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x no-scrollbar">
        {categories.map(cat => {
          const colors = getCategoryColorClasses(cat.color, cat.name);
          const descText =
            cat.description || getCategoryFallbackDescription(cat.name);

          return (
            <Link
              key={cat.id}
              to={`/produtos?category=${cat.id}`}
              className={cn(
                "w-48 h-36 md:w-60 md:h-40 rounded-3xl shrink-0 snap-start group border-2 relative flex flex-col p-5 md:p-6 pt-7 md:pt-8 overflow-hidden transition-all duration-500 hover:shadow-xl hover:scale-105 text-left",
                colors.bg,
                colors.border
              )}
            >
              <div
                className={cn(
                  "absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl",
                  colors.topBar
                )}
              />
              <h3 className="text-xs md:text-sm font-black uppercase italic tracking-wider text-slate-800 leading-tight group-hover:text-slate-950 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-tight leading-snug mt-2 line-clamp-2">
                {descText}
              </p>
              <div className="mt-auto pt-3 border-t border-slate-100/50 flex items-center justify-between w-full">
                <span
                  className={cn(
                    "text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors",
                    colors.countText
                  )}
                >
                  {cat.dishCount && cat.dishCount > 0
                    ? cat.dishCount === 1
                      ? "1 prato"
                      : `${cat.dishCount} pratos`
                    : "Em breve"}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
