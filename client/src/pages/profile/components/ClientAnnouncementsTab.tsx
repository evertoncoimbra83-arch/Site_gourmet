import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Tag, Megaphone, Truck, AlertTriangle, Bell, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileVM } from "../logic/ProfileLogic";

// Configurações visuais por tipo de aviso
const typeConfig = {
  INFO: {
    label: "Comunicado",
    icon: Info,
    colorClass: "bg-blue-50/50 text-blue-600 border-blue-100",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
  PROMO: {
    label: "Novidades",
    icon: Tag,
    colorClass: "bg-purple-50/50 text-purple-600 border-purple-100",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  NEWS: {
    label: "Lançamento",
    icon: Megaphone,
    colorClass: "bg-emerald-50/50 text-emerald-600 border-emerald-100",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  DELIVERY: {
    label: "Funcionamento",
    icon: Truck,
    colorClass: "bg-amber-50/50 text-amber-600 border-amber-100",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  SYSTEM: {
    label: "Aviso do Sistema",
    icon: AlertTriangle,
    colorClass: "bg-rose-50/50 text-rose-600 border-rose-100",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
  },
};

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

export function ClientAnnouncementsTab({ vm }: { vm: ProfileVM }) {
  const { announcements, isLoadingAnnouncements } = vm;

  if (isLoadingAnnouncements) {
    return (
      <div className="p-12 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">
        Carregando avisos...
      </div>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <div className="p-12 md:p-20 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in duration-500">
        <div className="bg-slate-50 p-4 rounded-full mb-4 text-slate-300">
          <Bell className="h-8 w-8" />
        </div>
        <p className="text-slate-500 font-black text-xs md:text-sm uppercase tracking-widest">
          Nenhum aviso no momento
        </p>
        <p className="text-slate-400 text-[10px] md:text-xs font-semibold uppercase tracking-tight mt-1 max-w-sm">
          Fique de olho! Quando houver novidades, comunicados ou alterações, eles aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 text-left animate-in fade-in duration-500 max-w-full overflow-hidden">
      <header className="mb-2">
        <h3 className="text-lg font-black uppercase italic text-slate-900 tracking-tight flex items-center gap-2">
          <Bell className="h-5 w-5 text-emerald-600" />
          Central de Avisos
        </h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
          Acompanhe novidades, horários especiais e comunicados operacionais
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {announcements.map((announcement) => {
          const config = typeConfig[announcement.type] || typeConfig.INFO;
          const IconComponent = config.icon;

          return (
            <Card
              key={announcement.id}
              className={cn(
                "rounded-3xl border shadow-sm overflow-hidden bg-white hover:shadow-md transition-all duration-300",
                "hover:border-slate-200"
              )}
            >
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start gap-5">
                {/* Ícone Redondo ou Emoji */}
                <div
                  className={cn(
                    "p-3 rounded-2xl border shrink-0 flex items-center justify-center min-w-12 min-h-12",
                    config.colorClass
                  )}
                >
                  {announcement.iconEmoji ? (
                    <span className="text-2xl leading-none select-none">{announcement.iconEmoji}</span>
                  ) : (
                    <IconComponent className="h-6 w-6" />
                  )}
                </div>

                {/* Conteúdo do Aviso */}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                        config.badgeClass
                      )}
                    >
                      {config.label}
                    </span>
                    {announcement.createdAt && (
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(announcement.createdAt)}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base md:text-lg font-black text-slate-900 tracking-tight leading-snug">
                    {announcement.title}
                  </h4>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                    {announcement.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default ClientAnnouncementsTab;
