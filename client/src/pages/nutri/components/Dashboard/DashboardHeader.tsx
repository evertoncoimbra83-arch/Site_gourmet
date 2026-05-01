import React from "react";
import { Activity, Users, BookOpen, History, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  activeTab: "clients" | "templates" | "history";
  // ✅ CORREÇÃO: Tipagem estrita para a função de troca de aba
  setActiveTab: (tab: "clients" | "templates" | "history") => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onCreateTemplate: () => void;
}

export const DashboardHeader = ({ 
  activeTab, 
  setActiveTab, 
  searchTerm, 
  setSearchTerm, 
  onCreateTemplate 
}: Props) => (
  <header className="flex flex-col md:flex-row justify-between items-end gap-6 pt-12 text-left">
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-600">
        <Activity size={16} strokeWidth={3} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dashboard Profissional</span>
      </div>
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200 shadow-sm">
        <button 
          onClick={() => setActiveTab("clients")} 
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all", 
            activeTab === "clients" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Users size={14} /> Pacientes
        </button>
        <button 
          onClick={() => setActiveTab("templates")} 
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all", 
            activeTab === "templates" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <BookOpen size={14} /> Biblioteca
        </button>
        <button 
          onClick={() => setActiveTab("history")} 
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all", 
            activeTab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <History size={14} /> Histórico
        </button>
      </div>
    </div>
    <div className="flex items-center gap-4 w-full md:w-auto">
      <div className="relative flex-1 md:w-80">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input 
          placeholder="PESQUISAR..." 
          className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-bold text-[10px] uppercase" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>
      {activeTab === "templates" && (
        <Button 
          onClick={onCreateTemplate} 
          className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-[11px] font-black uppercase gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} strokeWidth={3} /> Criar Modelo
        </Button>
      )}
    </div>
  </header>
);