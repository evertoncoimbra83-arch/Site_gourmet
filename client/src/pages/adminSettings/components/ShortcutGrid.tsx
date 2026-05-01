// client/src/pages/adminSettings/components/ShortcutGrid.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { SettingsShortcut } from "../config/settingsAreas";

interface ShortcutGridProps {
  shortcuts: SettingsShortcut[];
}

export function ShortcutGrid({ shortcuts }: ShortcutGridProps) {
  if (shortcuts.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
          Áreas dedicadas
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <Link key={shortcut.href + shortcut.title} to={shortcut.href}>
              <Card className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <Icon size={18} />
                  </div>
                  {shortcut.badge && (
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                      {shortcut.badge}
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-black uppercase tracking-wide text-slate-900">
                    {shortcut.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {shortcut.description}
                  </p>
                </div>
                <div className="mt-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700">
                    <span>Abrir</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}