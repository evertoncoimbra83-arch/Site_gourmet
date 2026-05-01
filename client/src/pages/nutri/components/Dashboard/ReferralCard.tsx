import React, { useState } from "react";
import { Link2, Pencil, Save, X, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferralCardProps {
  activeCode: string;
  referralLink: string;
  onUpdateCode: (code: string) => void;
}

export function ReferralCard({ activeCode, referralLink, onUpdateCode }: ReferralCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newSlug, setNewSlug] = useState(activeCode);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onUpdateCode(newSlug);
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-900 rounded-4xl p-8 text-white shadow-2xl flex flex-col justify-between border-b-8 border-emerald-500 min-h-80 sticky top-8 text-left transition-all">
      <div>
        <div className="flex justify-between items-center mb-10">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner shrink-0">
            <Link2 size={28} strokeWidth={2.5} />
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsEditing(!isEditing)} 
            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"
          >
            {isEditing ? <X size={20} /> : <Pencil size={20} />}
          </Button>
        </div>
        <h3 className="text-xl font-black uppercase italic mb-2 tracking-tighter">Captar Pacientes</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          Divulgue seu link para novos cadastros.
        </p>
      </div>

      <div className="mt-8">
        {isEditing ? (
          <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
            <input 
              type="text" 
              value={newSlug} 
              onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} 
              className="bg-slate-800 border border-emerald-500/50 h-12 rounded-xl text-emerald-400 font-mono px-4 w-full text-xs outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" 
              placeholder="seu-codigo"
              autoFocus
            />
            <Button 
              onClick={handleSave} 
              className="bg-emerald-600 hover:bg-emerald-500 h-12 w-12 rounded-xl shrink-0 shadow-lg shadow-emerald-900/20"
            >
              <Save size={18} />
            </Button>
          </div>
        ) : (
          <div 
            className="relative group cursor-pointer active:scale-[0.98] transition-all" 
            onClick={handleCopy}
          >
            {/* ✅ CORREÇÃO: Adicionado 'pr-12' para o texto não encavalar no ícone e 'truncate' para segurança */}
            <div className="bg-slate-800 h-14 rounded-2xl flex items-center px-4 pr-12 text-[10px] font-mono text-slate-300 border border-slate-800 group-hover:border-emerald-500/40 transition-all overflow-hidden">
              <span className="truncate">{referralLink}</span>
            </div>
            
            {/* ✅ Ícone posicionado de forma que não atrapalha a leitura */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {copied ? (
                <CheckCircle2 size={18} className="text-emerald-500 animate-in zoom-in duration-300" />
              ) : (
                <Copy size={18} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
              )}
            </div>

            {/* Tooltip simples de feedback */}
            {copied && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-[8px] font-black uppercase px-2 py-1 rounded shadow-lg animate-in slide-in-from-bottom-1">
                Copiado!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}