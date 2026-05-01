import React from "react"; // ✅ Adicionado para satisfazer a regra react-in-jsx-scope
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Home, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom"; 
import { motion } from "framer-motion";

export default function NotFound() {
  // ✅ CORREÇÃO: Usando useNavigate para redirecionamento
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FBFBFC] p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[3rem] bg-white overflow-hidden">
          <CardContent className="pt-12 pb-12 px-8 md:px-12 text-center">
            
            {/* ICONE COM ESTILO PREMIUM */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full scale-150 blur-2xl" />
                <div className="relative h-24 w-24 bg-slate-900 rounded-[2rem] flex items-center justify-center rotate-3 shadow-xl">
                  <Search className="h-10 w-10 text-emerald-500" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* TIPOGRAFIA PADRÃO DO PROJETO */}
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-2 italic tracking-tighter">
              40<span className="text-emerald-500">4</span>
            </h1>

            <h2 className="text-sm md:text-base font-black text-slate-400 uppercase tracking-[0.3em] mb-6">
              Página Não Encontrada
            </h2>

            <p className="text-slate-600 font-medium leading-relaxed mb-10 max-w-70 mx-auto text-sm">
              Parece que o ingrediente que você busca não está no nosso cardápio digital.
            </p>

            {/* GRUPO DE BOTÕES */}
            <div className="flex flex-col gap-3 max-w-60 mx-auto">
              <Button
                onClick={() => navigate("/")}
                className="bg-slate-900 hover:bg-slate-800 text-emerald-400 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate(-1)} 
                className="text-slate-400 hover:text-slate-900 font-black uppercase text-[10px] tracking-widest h-12 gap-2"
              >
                <ArrowLeft className="w-3 h-3" />
                Página Anterior
              </Button>
            </div>

          </CardContent>
        </Card>
        
        {/* FOOTER DISCRETO */}
        <p className="mt-8 text-center text-slate-300 font-black uppercase text-[8px] tracking-[0.5em] opacity-50 italic">
          Gourmet Saudável • Crafted with Excellence
        </p>
      </motion.div>
    </div>
  );
}