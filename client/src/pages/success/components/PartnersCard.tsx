import { ExternalLink, LayoutGrid, Star } from "lucide-react";
import { normalizeImageUrl } from "@shared/utils/assets";
import type { Partner } from "../types";

interface PartnersCardProps {
  partners: Partner[];
}

export function PartnersCard({ partners }: PartnersCardProps) {
  if (partners.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2">
        <div className="h-px flex-1 bg-slate-200" />
        <div className="flex items-center gap-2 text-slate-400">
          <Star size={12} className="text-amber-500 fill-amber-500" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">
            Parceiros Gourmet
          </span>
        </div>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {partners.map((partner, idx) => (
          <a
            key={idx}
            href={partner.link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:border-emerald-200 transition-all flex flex-col items-center text-center gap-2"
          >
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
              {partner.logo_url ? (
                <img
                  src={normalizeImageUrl(partner.logo_url) || ""}
                  alt={partner.name}
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                <LayoutGrid size={14} className="text-slate-200" />
              )}
            </div>
            <h4 className="text-[9px] font-black text-slate-900 uppercase leading-none truncate w-full">
              {partner.name}
            </h4>
            <span className="text-[7px] font-bold text-emerald-500 uppercase flex items-center gap-1">
              {partner.discount_text} <ExternalLink size={8} />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
