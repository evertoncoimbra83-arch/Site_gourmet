// client/src/pages/adminNutri/view/AdminNutriView.tsx
import React, { useState } from "react";
import {
  UserRound, ExternalLink, Search,
  Trash2, ShieldCheck, ShieldAlert,
  Loader2, Save, UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { appToast as toast } from "@/lib/app-toast";
import { safeInteger } from "@/lib/safe-parse";
import { cn } from "@/lib/utils";

import { useAdminNutri, NutriData } from "../logic/useAdminNutri";
import { AdminNutriDrawer } from "./adminNutriDrawer";

// ─── Componente auxiliar de edição de desconto ───────────────────────────────
function DiscountInputCell({
  nutriId,
  initialValue,
  onSave,
  isLoading,
}: {
  nutriId: string;
  initialValue: number | null;
  onSave: (id: string, val: number) => void;
  isLoading: boolean;
}) {
  const [val, setVal] = useState(initialValue?.toString() || "0");
  const originalValue = initialValue?.toString() || "0";
  const hasChanged = val !== originalValue;

  const handleSave = () => {
    const num = safeInteger(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      onSave(nutriId, num);
    } else {
      toast.error("Valor inválido", { description: "A comissão deve ser entre 0 e 100." });
      setVal(originalValue);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-16 h-8 text-center font-black text-xs rounded-lg border-slate-200 focus:border-emerald-500 bg-slate-50/50"
      />
      <span className="text-[10px] font-black text-slate-400">%</span>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={!hasChanged || isLoading}
        className={cn(
          "h-8 px-2 rounded-lg transition-all",
          hasChanged ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-100 text-slate-300"
        )}
      >
        {isLoading && hasChanged ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Save size={14} />
        )}
      </Button>
    </div>
  );
}

// ─── View principal ───────────────────────────────────────────────────────────
export function AdminNutriView() {
  const { nutris, isLoading, isUpdating, isDeleting, handleUpdate, handleDelete, copyReferralLink } =
    useAdminNutri();

  const [selectedNutri, setSelectedNutri] = useState<NutriData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");


  const filtered = nutris.filter(
    (n) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      (n.email || "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
        Sincronizando Parceiros...
      </p>
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto text-left">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
            Gestão <span className="text-emerald-600">Nutricionistas</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">
            Controle de acesso e comissionamento.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="PROCURAR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl bg-white border-slate-200 font-bold text-[10px] uppercase h-11 shadow-sm"
          />
        </div>
      </header>

      {/* TABELA */}
      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-400">Nutricionista</th>
                <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">CRN</th>
                <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Referral</th>
                <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Desconto (%)</th>
                <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50/30 transition-colors">

                  {/* NOME */}
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                        n.isVerified ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        <UserRound size={20} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase italic text-xs leading-none mb-1">{n.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold lowercase">{n.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* CRN */}
                  <td className="p-6 text-center">
                    <Badge variant="outline" className="font-mono font-bold text-[10px] text-slate-600 border-slate-200">
                      {n.crn}
                    </Badge>
                  </td>

                  {/* REFERRAL */}
                  <td className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                        {n.referralCode}
                      </span>
                      <button
                        onClick={() => n.referralCode && copyReferralLink(n.referralCode)}
                        className="text-slate-300 hover:text-emerald-600 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </td>

                  {/* DESCONTO */}
                  <td className="p-6 text-center">
                    <DiscountInputCell
                      nutriId={n.id}
                      initialValue={n.discountPercentage}
                      onSave={(id, val) => handleUpdate(id, { discountPercentage: val })}
                      isLoading={isUpdating}
                    />
                  </td>

                  {/* STATUS */}
                  <td className="p-6 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <Switch
                        checked={!!n.isActive}
                        onCheckedChange={(checked) => handleUpdate(n.id, { isActive: checked })}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                      <span className={cn(
                        "text-[8px] font-black uppercase italic tracking-tighter",
                        n.isActive ? "text-emerald-600" : "text-slate-400"
                      )}>
                        {n.isActive ? "Ativo" : "Bloqueado"}
                      </span>
                    </div>
                  </td>

                  {/* AÇÕES */}
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => { setSelectedNutri(n); setIsDrawerOpen(true); }}
                        className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-emerald-600"
                      >
                        <UserCog size={18} />
                      </Button>

                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleUpdate(n.id, { isVerified: !n.isVerified })}
                        className={cn(
                          "h-9 w-9 p-0 rounded-xl transition-all",
                          n.isVerified ? "text-blue-500 bg-blue-50" : "text-slate-300 hover:text-emerald-500"
                        )}
                        title="Verificar Profissional"
                      >
                        {n.isVerified ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                      </Button>

                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleDelete(n.id, n.name)}
                        disabled={isDeleting}
                        className="h-9 w-9 p-0 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && !isLoading && (
            <div className="p-20 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                {search ? "Nenhum resultado para a busca." : "Nenhum profissional na base."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DRAWER */}
      <AdminNutriDrawer
        nutri={selectedNutri}
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedNutri(null); }}
      />
    </div>
  );
}
