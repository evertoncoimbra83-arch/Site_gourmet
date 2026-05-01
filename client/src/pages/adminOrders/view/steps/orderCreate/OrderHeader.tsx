import React from "react";
import { Zap, Calendar, Trash2, Loader2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  orderDate: string;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  total: number;
  isCancelling: boolean;
  onCancel: () => void;
  isEditing?: boolean; // ✅ Prop opcional para mudar o visual se for edição
}

export const OrderHeader = ({ orderDate, onDateChange, total, isCancelling, onCancel, isEditing }: Props) => (
  <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-4xl border border-slate-100 shadow-sm gap-4">
    <div className="flex items-center gap-4">
      {/* Muda a cor e o ícone se for edição */}
      <div className={`p-3 rounded-2xl text-white shadow-lg ${isEditing ? "bg-amber-500" : "bg-emerald-500"}`}>
        {isEditing ? <Edit3 size={24} /> : <Zap size={24} fill="currentColor" />}
      </div>
      <div className="text-left">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
          PDV <span className={isEditing ? "text-amber-500" : "text-emerald-500"}>
            {isEditing ? "Edição" : "Express"}
          </span>
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {isEditing ? "Alteração de Pedido" : "Venda Direta Admin"}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-6">
      <div className="flex flex-col items-end gap-1">
        <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">
          <Calendar size={10} /> Data da Venda
        </label>
        <input 
          type="date" 
          value={orderDate}
          onChange={onDateChange}
          className="bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-black uppercase text-slate-600 outline-none focus:ring-2 ring-emerald-500"
        />
      </div>
      <div className="h-12 w-px bg-slate-100 hidden md:block" />
      <div className="text-right font-black">
        <p className="text-[9px] uppercase text-emerald-500 mb-1 italic">Total Líquido</p>
        <p className="text-slate-900 italic text-3xl tracking-tighter leading-none">
          {/* ✅ Fallback seguro (total || 0) */}
          R$ {(total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onCancel}
        disabled={isCancelling}
        className="h-12 w-12 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"
        title="Cancelar Sessão"
      >
        {isCancelling ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
      </Button>
    </div>
  </header>
);