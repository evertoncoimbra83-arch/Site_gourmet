// client/src/pages/adminPackages/components/PackageAutoGenerator.tsx
// Redesign: seleção de "Objetivo" substituiu seleção de "Persona".
// Nenhuma dependência de banco — usa DEFAULT_PACKAGE_PERSONAS diretamente.
// Toda a lógica de geração permanece idêntica.

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Scale, UtensilsCrossed,
  CheckSquare, Search, BrainCircuit, Target,
  Sparkles, Beef, Leaf, Wallet, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { appToast as toast } from "@/lib/app-toast";
import { safeInteger, safeNumber } from "@/lib/safe-parse";

import { DEFAULT_PACKAGE_PERSONAS } from "../logic/generator/package-personas";
import { generateSmartPackage } from "../logic/generator/smartGenerator";
import { mapAdminDishesToCandidates, AdminDishForGenerator } from "../logic/generator/package-adapter";
import { AdminDish } from "../logic/hooks/useAdminPackages";
import { SlotDraft, RawAccompanimentRule, GeneratedSlot } from "../logic/generator/package-generator-types";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface Size     { id: string | number; name: string; }
interface Option   { id: string | number; name: string; }
interface Category { id: string | number; name: string; }

interface UIRule {
  id: string;
  sizeId: string;
  quantity: number;
  allowedCategories: string[];
  accompaniments: RawAccompanimentRule[];
  maxAccompaniments: number;
}

interface AutoGeneratorProps {
  categories: Category[];
  allOptions: Option[];
  allSizes: Size[];
  allDishes: AdminDish[];
  onGenerated: (slots: GeneratedSlot[]) => void;
}

// ─── Metadados visuais dos objetivos ─────────────────────────────────────────
// Cada entrada mapeia um id de DEFAULT_PACKAGE_PERSONAS para ícone + descrição + cor.

const GOAL_META: Record<
  string,
  { icon: React.ReactNode; description: string; tag: string; color: string; bg: string; ring: string }
> = {
  balanced: {
    icon: <BarChart3 size={20} />,
    description: "Variedade máxima, sem repetição de proteínas.",
    tag: "Variedade",
    color: "text-blue-600",
    bg: "bg-blue-50",
    ring: "ring-blue-500/20 border-blue-400",
  },
  high_protein: {
    icon: <Beef size={20} />,
    description: "Pratos com mínimo de 25g de proteína por porção.",
    tag: "Mín 25g prot",
    color: "text-red-600",
    bg: "bg-red-50",
    ring: "ring-red-500/20 border-red-400",
  },
  low_carb: {
    icon: <Leaf size={20} />,
    description: "Pratos com menos de 15g de carboidratos.",
    tag: "Máx 15g carb",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    ring: "ring-emerald-500/20 border-emerald-400",
  },
  economical: {
    icon: <Wallet size={20} />,
    description: "Favorece os pratos com melhor custo-benefício.",
    tag: "Menor custo",
    color: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-500/20 border-amber-400",
  },
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function PackageAutoGenerator({
  onGenerated,
  allOptions,
  categories,
  allSizes,
  allDishes,
}: AutoGeneratorProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string>("balanced");
  const [numOptionsPerSlot, setNumOptionsPerSlot] = useState(2);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  const [rules, setRules] = useState<UIRule[]>([
    { id: crypto.randomUUID(), sizeId: "", quantity: 5, allowedCategories: [], accompaniments: [], maxAccompaniments: 2 },
  ]);

  // ── Handlers de regras ────────────────────────────────────────────────────

  const setSearchTerm = (accId: string, term: string) =>
    setSearchTerms((prev) => ({ ...prev, [accId]: term }));

  const addRule = () =>
    setRules([...rules, { id: crypto.randomUUID(), sizeId: "", quantity: 5, allowedCategories: [], accompaniments: [], maxAccompaniments: 2 }]);

  const removeRule = (id: string) =>
    rules.length > 1 && setRules(rules.filter((r) => r.id !== id));

  const updateRule = (id: string, updates: Partial<UIRule>) =>
    setRules(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));

  const addAccompaniment = (ruleId: string) => {
    setRules(rules.map((r) =>
      r.id === ruleId
        ? { ...r, accompaniments: [...r.accompaniments, { id: crypto.randomUUID(), label: `Etiqueta ${r.accompaniments.length + 1}`, optionIds: [] }] }
        : r
    ));
  };

  const updateAccompaniment = (ruleId: string, accId: string, updates: Partial<RawAccompanimentRule>) => {
    setRules(rules.map((r) =>
      r.id === ruleId
        ? { ...r, accompaniments: r.accompaniments.map((a) => (a.id === accId ? { ...a, ...updates } : a)) }
        : r
    ));
  };

  // ── Geração ───────────────────────────────────────────────────────────────

  const handleMagicBuild = (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      const persona = DEFAULT_PACKAGE_PERSONAS[selectedGoalId];
      if (!persona) { toast.error("Objetivo não encontrado."); return; }

      const candidates = mapAdminDishesToCandidates(allDishes as AdminDishForGenerator[]);
      const allDrafts: SlotDraft[] = [];
      const allAccRules: RawAccompanimentRule[] = [];

      rules.forEach((rule) => {
        for (let i = 0; i < rule.quantity; i++) {
          allDrafts.push({
            name: `Refeição ${allDrafts.length + 1}`,
            numOptions: numOptionsPerSlot,
            requiredSizeId: rule.sizeId || null,
            allowedCategories: rule.allowedCategories.length > 0 ? rule.allowedCategories : undefined,
            requiredGroupIds: rule.accompaniments.map((a) => a.id),
            maxAccompaniments: rule.maxAccompaniments,
          });
        }
        allAccRules.push(...rule.accompaniments);
      });

      const result = generateSmartPackage({
        persona,
        dishes: candidates,
        slots: allDrafts,
        rawAccompanimentRules: allAccRules,
      });

      if (result.slots.length === 0) { toast.error("Nenhum prato encontrado com esses filtros!"); return; }
      if (result.warnings.length > 0) result.warnings.forEach((w) => toast.warning(w));

      onGenerated(result.slots);
      toast.success(`Pacote "${persona.label}" gerado com sucesso!`);
    } catch (err) {
      console.error("Erro na geração:", err);
      toast.error("Erro na geração inteligente.");
    }
  };

  const totalQuantity = rules.reduce((acc, r) => acc + safeNumber(r.quantity), 0);
  const canGenerate   = totalQuantity > 0 && rules.every((r) => r.sizeId) && allDishes.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 bg-white/90 backdrop-blur-md rounded-[3rem] text-slate-900 space-y-8 shadow-2xl shadow-slate-200/50 border border-slate-100 text-left mt-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-2xl">
            <BrainCircuit size={24} className="text-orange-600" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest leading-none text-slate-800">Smart Builder 2.0</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase italic mt-1">Inteligência Nutricional Ativa</p>
          </div>
        </div>
        <Badge className="bg-slate-100 text-slate-600 font-black px-4 py-1.5 rounded-full border-none shadow-sm">
          {totalQuantity} MARMITAS
        </Badge>
      </div>

      {/* SELEÇÃO DE OBJETIVO — cards ricos, sem depender de banco */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
          <Target size={12} className="text-orange-500" /> Objetivo do Pacote
        </label>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(DEFAULT_PACKAGE_PERSONAS).map((persona) => {
            const meta  = GOAL_META[persona.id];
            const active = selectedGoalId === persona.id;
            if (!meta) return null;

            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => setSelectedGoalId(persona.id)}
                className={cn(
                  "p-5 rounded-[2rem] border-2 transition-all text-left space-y-2 ring-4",
                  active
                    ? `${meta.bg} ${meta.ring} shadow-md`
                    : "border-slate-100 bg-slate-50/50 ring-transparent hover:bg-white hover:border-slate-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn("p-2 rounded-xl", active ? meta.bg : "bg-white")}>
                    <span className={active ? meta.color : "text-slate-300"}>
                      {meta.icon}
                    </span>
                  </div>
                  <span className={cn(
                    "text-[9px] font-black uppercase px-2.5 py-1 rounded-full",
                    active ? `${meta.bg} ${meta.color}` : "bg-slate-100 text-slate-400"
                  )}>
                    {meta.tag}
                  </span>
                </div>
                <div>
                  <p className={cn("text-xs font-black uppercase tracking-tight", active ? meta.color : "text-slate-600")}>
                    {persona.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-snug">
                    {meta.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* OPÇÕES POR MARMITA */}
      <div className="space-y-3 bg-slate-50/50 p-6 rounded-4xl border border-slate-100">
        <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
          <CheckSquare size={12} className="text-orange-500" /> Opções de Pratos por Marmita
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNumOptionsPerSlot(n)}
              className={cn(
                "flex-1 h-10 rounded-xl font-black text-[10px] uppercase border-2 transition-all",
                numOptionsPerSlot === n
                  ? "border-orange-500 text-orange-600 bg-white"
                  : "border-slate-100 text-slate-300 bg-transparent"
              )}
            >
              {n} {n === 1 ? "Opção" : "Opções"}
            </button>
          ))}
        </div>
      </div>

      {/* REGRAS DE LOTE */}
      <div className="space-y-6">
        {rules.map((rule, idx) => (
          <div key={rule.id} className="p-6 bg-slate-50/30 rounded-4xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Lote #{idx + 1}</span>
              {rules.length > 1 && (
                <button type="button" onClick={() => removeRule(rule.id)} className="text-slate-300 hover:text-red-400 p-2">
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <UtensilsCrossed size={12} /> Quantidade de Marmitas
                </label>
                <Input
                  type="number"
                  value={rule.quantity}
                  onChange={(e) => updateRule(rule.id, { quantity: safeInteger(e.target.value) })}
                  className="bg-white border-slate-100 h-12 font-bold rounded-xl shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Scale size={12} /> Tamanho
                </label>
                <select
                  className="w-full bg-white border border-slate-100 rounded-xl h-12 px-3 text-sm font-bold text-slate-700 outline-none shadow-sm"
                  value={rule.sizeId}
                  onChange={(e) => updateRule(rule.id, { sizeId: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {allSizes.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400">Filtrar Categorias:</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const catId = String(cat.id);
                  return (
                    <Badge
                      key={cat.id}
                      onClick={() => {
                        const current = rule.allowedCategories;
                        updateRule(rule.id, {
                          allowedCategories: current.includes(catId)
                            ? current.filter((c) => c !== catId)
                            : [...current, catId],
                        });
                      }}
                      className={cn(
                        "cursor-pointer px-3 py-1 text-[9px] font-black uppercase rounded-lg border-none shadow-sm",
                        rule.allowedCategories.includes(catId)
                          ? "bg-orange-500 text-white"
                          : "bg-white text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {cat.name}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-slate-400">Acompanhamentos Disponíveis</label>
                <Button
                  type="button"
                  onClick={() => addAccompaniment(rule.id)}
                  variant="ghost"
                  className="h-8 text-[10px] font-black uppercase text-orange-500 hover:bg-orange-50"
                >
                  <Plus size={14} /> Add Etiqueta
                </Button>
              </div>

              {rule.accompaniments.map((acc) => (
                <div key={acc.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Ex: Carboidrato 100g"
                      value={acc.label}
                      onChange={(e) => updateAccompaniment(rule.id, acc.id, { label: e.target.value })}
                      className="bg-slate-50/50 border-none text-xs font-bold h-10"
                    />
                    <button
                      type="button"
                      onClick={() => updateRule(rule.id, { accompaniments: rule.accompaniments.filter((a) => a.id !== acc.id) })}
                      className="text-slate-200 hover:text-red-400 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                    <Input
                      placeholder="Buscar item..."
                      value={searchTerms[acc.id] || ""}
                      onChange={(e) => setSearchTerm(acc.id, e.target.value)}
                      className="h-8 pl-9 bg-slate-50/30 border-slate-100 text-[10px]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {allOptions
                      .filter((opt) => opt.name.toLowerCase().includes((searchTerms[acc.id] || "").toLowerCase()))
                      .map((opt) => {
                        const optId = String(opt.id);
                        return (
                          <Badge
                            key={opt.id}
                            onClick={() => {
                              const current = acc.optionIds;
                              updateAccompaniment(rule.id, acc.id, {
                                optionIds: current.includes(optId)
                                  ? current.filter((i) => i !== optId)
                                  : [...current, optId],
                              });
                            }}
                            className={cn(
                              "cursor-pointer px-3 py-1 text-[9px] font-black uppercase rounded-lg border-none",
                              acc.optionIds.includes(optId)
                                ? "bg-blue-500 text-white shadow-md"
                                : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )}
                          >
                            {opt.name}
                          </Badge>
                        );
                      })}
                  </div>
                </div>
              ))}

              {rule.accompaniments.length > 0 && (
                <div className="space-y-2 mt-4 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                  <label className="text-[10px] font-black uppercase text-orange-600 flex items-center gap-2">
                    <Target size={12} /> Sorteio de Acompanhamentos
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => updateRule(rule.id, { maxAccompaniments: num })}
                        className={cn(
                          "flex-1 h-9 rounded-xl font-black text-[10px] border-2 transition-all",
                          rule.maxAccompaniments === num
                            ? "border-orange-500 bg-white text-orange-600"
                            : "border-slate-100 bg-transparent text-slate-400"
                        )}
                      >
                        {num} {num === 1 ? "Item" : "Itens"}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 italic">
                    * O sistema sorteará {rule.maxAccompaniments} {rule.maxAccompaniments === 1 ? "item aleatório" : "itens aleatórios"} das etiquetas acima para cada marmita.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <Button
          type="button"
          onClick={addRule}
          variant="outline"
          className="w-full h-12 border-dashed border-slate-200 text-slate-400 rounded-2xl gap-2 text-[10px] font-black uppercase hover:bg-slate-50 transition-all bg-transparent"
        >
          <Plus size={14} /> Novo lote de regras
        </Button>

        <Button
          type="button"
          onClick={handleMagicBuild}
          disabled={!canGenerate}
          className="w-full h-16 bg-slate-900 hover:bg-orange-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-xl shadow-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles size={16} className="mr-2" /> Executar Construção Inteligente
        </Button>

        {!rules.every((r) => r.sizeId) && (
          <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            ⚠ Selecione um tamanho em todos os lotes para gerar
          </p>
        )}
      </div>
    </div>
  );
}
