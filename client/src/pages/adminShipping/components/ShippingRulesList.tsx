import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Trash2, Edit3, DollarSign, Box, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

// 🛡️ Interface para bater com o retorno do Banco/Router
export interface ShippingRule {
  id: number;
  name: string;
  type: 'polygon' | 'circle' | 'zipcode';
  shippingCost: string | number;
  storeSlug: string;
  description?: string | null;
}

interface ShippingRulesListProps {
  rules: ShippingRule[]; // ✅ Tipagem correta
  onEdit: (rule: ShippingRule) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
}

export function ShippingRulesList({ rules, onEdit, onDelete, isLoading }: ShippingRulesListProps) {
  if (isLoading) {
    return (
      <Card className="rounded-[3rem] border-none shadow-xl bg-white p-8">
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sincronizando Banco de Dados...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden">
      <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl shadow-lg">
              <Box size={20} className="text-white" />
            </div>
            <div className="text-left">
              <CardTitle className="text-lg font-black uppercase italic tracking-tighter leading-none">Zonas de Entrega</CardTitle>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Malha e Precificação</p>
            </div>
          </div>
          <div className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full font-black text-[10px] uppercase tracking-tighter">
            {rules.length} Unidades de Cobertura
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        {rules.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-[2rem] space-y-3">
            <MapPin size={40} className="mx-auto text-slate-200" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">
              Nenhuma zona de entrega ativa<br />nesta unidade operacional.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rules.map((rule) => (
              <div 
                key={rule.id}
                className="group relative flex flex-col p-6 bg-slate-50 border border-slate-100 rounded-[2rem] transition-all hover:bg-white hover:shadow-2xl hover:shadow-slate-200/60"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-2">
                       <span className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-md",
                        rule.type === 'polygon' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {rule.type === 'polygon' ? "Desenho Livre" : "Raio Fixo"}
                      </span>
                      {rule.storeSlug === 'default' && (
                        <span className="flex items-center gap-1 text-[8px] font-black uppercase bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                          <Globe size={8} /> Global
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-black text-slate-900 uppercase italic leading-tight tracking-tighter">{rule.name}</h4>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(rule)}
                      className="h-8 w-8 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-emerald-500 hover:border-emerald-200"
                    >
                      <Edit3 size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onDelete(rule.id)}
                      className="h-8 w-8 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo de Entrega</span>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <DollarSign size={14} strokeWidth={3} />
                      <span className="text-2xl font-black tracking-tighter leading-none">
                        {Number(rule.shippingCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-white border border-slate-100 rounded-full flex items-center justify-center">
                     <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}