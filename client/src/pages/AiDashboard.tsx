// client/src/pages/AiDashboard.tsx

import React from "react";
import AiDashboardView from "./aiDashboard/view/AiDashboardView";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AiDashboardPage() {
  return (
    <div className="relative min-h-screen bg-[#FBFBFC]">
      {/* ⚠️ BANNERS DE AVISO (BETA/TESTES) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 border-b border-amber-100 px-4 py-3"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <div className="bg-amber-500/10 p-1.5 rounded-lg text-amber-600">
            <AlertCircle size={16} strokeWidth={3} />
          </div>
          <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-amber-700 italic">
            Ferramenta em estágio experimental (Beta). Erros ou imprecisões podem ocorrer durante o processamento.
          </p>
        </div>
      </motion.div>

      {/* VIEW PRINCIPAL */}
      <AiDashboardView />
    </div>
  );
}