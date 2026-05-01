// client/src/pages/adminOrders/components/orderDrawer/print/components/ZebraSettingsPanel.tsx
//
// Painel de configuração física da impressora Zebra.
// Integra com ZebraPhysicalConfig e useZebraUSB.
// Persiste preferências em localStorage da estação.

import React, { useState, useEffect } from "react";
import { Usb, Wifi, WifiOff, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ZebraPhysicalConfig, ZebraDPI } from "../../adminLabelEditor/print-engine/generator";
import type { ZebraConnectionState } from "../../adminLabelEditor/print-engine/transport";

const STORAGE_KEY = "zebra_physical_config";

const DEFAULT_CONFIG: Required<ZebraPhysicalConfig> = {
  dpi:        203,
  darkness:   12,
  printSpeed: 3,
  mediaType:  "T",
};

interface Props {
  connection: ZebraConnectionState;
  isUSBSupported: boolean;
  onConnectUSB: () => void;
  onCheckBrowserPrint: () => void;
  onChange: (config: ZebraPhysicalConfig) => void;
}

export function ZebraSettingsPanel({
  connection,
  isUSBSupported,
  onConnectUSB,
  onCheckBrowserPrint,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<Required<ZebraPhysicalConfig>>(DEFAULT_CONFIG);

  // Carrega preferências salvas da estação
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ZebraPhysicalConfig>;
        const merged = { ...DEFAULT_CONFIG, ...parsed };
        setConfig(merged);
        onChange(merged);
      } else {
        onChange(DEFAULT_CONFIG);
      }
    } catch { onChange(DEFAULT_CONFIG); }
  }, []);

  const update = (patch: Partial<ZebraPhysicalConfig>) => {
    const next = { ...config, ...patch } as Required<ZebraPhysicalConfig>;
    setConfig(next);
    onChange(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* empty */ }
  };

  const methodIcon = connection.method === "usb"
    ? <Usb size={12} className="text-blue-600" />
    : connection.method === "browser_print"
    ? <Wifi size={12} className="text-emerald-600" />
    : <WifiOff size={12} className="text-slate-300" />;

  const methodLabel = connection.method === "usb"
    ? `USB — ${connection.deviceName ?? "Zebra"}`
    : connection.method === "browser_print"
    ? `Browser Print — ${connection.deviceName ?? "127.0.0.1:9100"}`
    : "Impressora offline";

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      {/* Header / Status bar */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 transition-colors",
          connection.isReady ? "bg-slate-50 hover:bg-slate-100" : "bg-red-50 hover:bg-red-100"
        )}
      >
        <div className="flex items-center gap-2">
          {methodIcon}
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
            {methodLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold text-slate-400 uppercase">
            {config.dpi}dpi · {config.mediaType === "T" ? "Transfer" : "Direto"} · D{config.darkness}
          </span>
          {open ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
        </div>
      </button>

      {/* Painel expansível */}
      {open && (
        <div className="p-4 space-y-5 border-t border-slate-100 bg-white animate-in fade-in slide-in-from-top-2 duration-200">

          {/* Conexão */}
          <div className="space-y-2">
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Conexão</p>
            <div className="grid grid-cols-2 gap-2">
              {isUSBSupported && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onConnectUSB}
                  className={cn(
                    "h-9 text-[9px] font-black uppercase rounded-xl gap-1.5",
                    connection.method === "usb" && "border-blue-300 bg-blue-50 text-blue-700"
                  )}
                >
                  <Usb size={12} /> USB Direto
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onCheckBrowserPrint}
                className={cn(
                  "h-9 text-[9px] font-black uppercase rounded-xl gap-1.5",
                  connection.method === "browser_print" && "border-emerald-300 bg-emerald-50 text-emerald-700"
                )}
              >
                <Wifi size={12} /> Browser Print
              </Button>
            </div>
          </div>

          {/* DPI */}
          <div className="space-y-2">
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">DPI da Impressora</p>
            <div className="flex gap-2">
              {([203, 300] as ZebraDPI[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => update({ dpi: d })}
                  className={cn(
                    "flex-1 h-9 text-[10px] font-black rounded-xl border transition-all",
                    config.dpi === d
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                  )}
                >
                  {d} dpi
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Mídia */}
          <div className="space-y-2">
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Tipo de Mídia</p>
            <div className="flex gap-2">
              {([
                { val: "T", label: "Thermal Transfer", desc: "Ribbon/resina — resistente a umidade" },
                { val: "D", label: "Direct Thermal",   desc: "Sem ribbon — econômico" },
              ] as const).map((m) => (
                <button
                  key={m.val}
                  type="button"
                  onClick={() => update({ mediaType: m.val })}
                  className={cn(
                    "flex-1 h-auto py-2 px-3 text-left rounded-xl border transition-all",
                    config.mediaType === m.val
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                  )}
                >
                  <p className="text-[9px] font-black uppercase leading-none">{m.label}</p>
                  <p className={cn("text-[8px] mt-0.5 leading-tight",
                    config.mediaType === m.val ? "text-slate-300" : "text-slate-400")}>
                    {m.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Darkness */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Darkness</p>
              <span className="text-[10px] font-black text-slate-700">{config.darkness}/30</span>
            </div>
            <input
              type="range" min={0} max={30} step={1}
              value={config.darkness}
              onChange={(e) => update({ darkness: Number(e.target.value) })}
              className="w-full accent-slate-900"
            />
            <p className="text-[8px] text-slate-400">Recomendado para etiqueta de marmita: 10–15. Aumente se estiver fraco.</p>
          </div>

          {/* Velocidade */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Velocidade (ips)</p>
              <span className="text-[10px] font-black text-slate-700">{config.printSpeed} ips</span>
            </div>
            <input
              type="range" min={1} max={14} step={1}
              value={config.printSpeed}
              onChange={(e) => update({ printSpeed: Number(e.target.value) })}
              className="w-full accent-slate-900"
            />
            <p className="text-[8px] text-slate-400">Recomendado: 2–4 ips. Mais lento = maior nitidez.</p>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[9px] text-amber-700 font-bold leading-relaxed">
            ⚠️ Darkness e velocidade por software sobrescrevem o preset da impressora a cada lote.
            Se preferir fixar no driver, deixe os controles no padrão e configure diretamente na Zebra.
          </div>
        </div>
      )}
    </div>
  );
}
