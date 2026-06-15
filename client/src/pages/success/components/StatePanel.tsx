import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PageStateContent } from "../types";

export function StatePanel({
  eyebrow,
  title,
  description,
  icon: Icon,
  primaryLabel,
  primaryTo,
  primaryAction,
  secondaryLabel,
  secondaryTo,
}: PageStateContent) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-orange-500 font-black uppercase text-[10px] tracking-[0.2em]">
          <Icon className="h-4 w-4" />
          {eyebrow}
        </div>
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <p className="mx-auto max-w-md px-4 text-sm font-medium leading-relaxed text-slate-500">
          {description}
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {primaryTo ? (
          <Button
            asChild
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest shadow-xl group"
          >
            <Link to={primaryTo}>
              <div className="flex items-center gap-2">
                <span>{primaryLabel}</span>
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform ml-auto"
                />
              </div>
            </Link>
          </Button>
        ) : (
          <Button
            onClick={primaryAction}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest shadow-xl"
          >
            {primaryLabel}
          </Button>
        )}

        {secondaryLabel && secondaryTo && (
          <Button
            asChild
            variant="ghost"
            className="w-full h-12 rounded-xl text-slate-500 font-black uppercase text-[9px] tracking-widest hover:bg-slate-100"
          >
            <Link to={secondaryTo}>{secondaryLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
