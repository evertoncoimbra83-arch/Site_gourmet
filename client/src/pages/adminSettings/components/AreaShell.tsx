import React from "react";
import type { SettingsArea } from "../config/settingsAreas";

interface AreaShellProps {
  area: SettingsArea;
  children: React.ReactNode;
}

export function AreaShell({ area, children }: AreaShellProps) {
  const Icon = area.icon;
  const hasShortcuts = (area.shortcuts?.length || 0) > 0;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                <Icon size={22} className={area.accent} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">
                  {area.label}
                </h2>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                  {area.description}
                </p>
              </div>
            </div>

            {area.badges && area.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {area.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          {hasShortcuts && (
            <p className="max-w-xl text-sm leading-relaxed text-slate-500">
              Esta area concentra o que pode ser ajustado aqui e deixa apenas os
              atalhos que levam para telas realmente externas a este fluxo.
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
