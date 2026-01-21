import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accessibility, Eye, MessageSquareCode } from "lucide-react";

interface AccessibilitySettingsProps {
  settings: {
    vLibrasActive?: boolean;
    highContrastActive?: boolean;
  };
  onUpdate: (value: Partial<{ vLibrasActive: boolean; highContrastActive: boolean }>) => void;
}

// ✅ Export Nomeado
export function AccessibilitySettings({ settings, onUpdate }: AccessibilitySettingsProps) {
  return (
    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border border-slate-100">
      <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-3 text-indigo-600">
          <Accessibility size={24} />
          <CardTitle className="text-xl font-black uppercase italic tracking-tighter">
            Interface <span className="text-indigo-500">&</span> Acessibilidade
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        
        {/* VLIBRAS */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-indigo-500" />
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-700 leading-none">
                Libras & VLibras
              </Label>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
              Ativar widget de tradução em libras
            </p>
          </div>
          <Switch 
            checked={!!settings?.vLibrasActive} 
            onCheckedChange={(val) => onUpdate({ vLibrasActive: val })} 
          />
        </div>

        {/* ALTO CONTRASTE */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquareCode size={16} className="text-indigo-500" />
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-700 leading-none">
                Alto Contraste
              </Label>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
              Habilitar modos de daltonismo e contraste
            </p>
          </div>
          <Switch 
            checked={!!settings?.highContrastActive} 
            onCheckedChange={(val) => onUpdate({ highContrastActive: val })} 
          />
        </div>

      </CardContent>
    </Card>
  );
}