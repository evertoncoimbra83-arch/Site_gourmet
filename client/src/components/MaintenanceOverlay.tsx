import React from "react"; // ✅ Adicionado React para corrigir escopo JSX
import { AlertTriangle, Hammer, Clock, Instagram, MessageCircle } from "lucide-react";
import { APP_TITLE } from "@/const";

export default function MaintenanceOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6 text-left">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* Ícone Animado */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-red-100 rounded-full scale-150 animate-ping opacity-20" />
          <div className="relative bg-red-50 p-6 rounded-full">
            <AlertTriangle size={48} className="text-red-600" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
            Pausa <span className="text-red-600">Necessária</span>
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            O {APP_TITLE} está passando por uma manutenção rápida para melhorar sua experiência. 
            Voltaremos em instantes!
          </p>
        </div>

        {/* Badges de Status */}
        <div className="flex gap-2 justify-center">
          <div className="px-4 py-2 bg-slate-100 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Hammer size={14} /> Manutenção Ativa
          </div>
          <div className="px-4 py-2 bg-blue-50 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600">
            <Clock size={14} /> Retorno Breve
          </div>
        </div>

        {/* Canais de Contato */}
        <div className="pt-8 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase text-slate-400 mb-4 tracking-widest">Acompanhe por aqui</p>
          <div className="flex justify-center gap-4">
            <button 
              type="button"
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 border-none"
            >
              <MessageCircle size={18} /> WhatsApp
            </button>
            <button 
              type="button"
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 border-none"
            >
              <Instagram size={18} /> Instagram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}