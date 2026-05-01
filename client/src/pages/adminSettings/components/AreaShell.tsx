// client/src/pages/adminSettings/components/AreaShell.tsx
import React from "react";
import type { SettingsArea } from "../config/settingsAreas";

interface AreaShellProps {
  area: SettingsArea;
  children: React.ReactNode;
}

export function AreaShell({ area, children }: AreaShellProps) {
  const Icon = area.icon;

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-left shadow-sm md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                <Icon size={22} className={area.accent} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
                  {area.label}
                </h2>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {area.description}
                </p>
              </div>
            </div>
            {area.badges && area.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {area.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
          {area.shortcuts && area.shortcuts.length > 0 && (
            <p className="max-w-xl text-sm text-slate-500">
              Esta área reúne o que já pode ser ajustado aqui e aponta para telas
              administrativas dedicadas quando a configuração vive fora desta página.
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}