// client/src/pages/aiDashboard/components/AiScanCard.tsx

import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { Calendar, Trash2, ChevronRight, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface AiScanCardProps {
  scan: {
    id: string;
    createdAt: Date | string;
    status: string;
    [key: string]: unknown;
  };
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

// ✅ Usando forwardRef para que o Framer Motion consiga animar o componente corretamente
export const AiScanCard = forwardRef<HTMLDivElement, AiScanCardProps>(
  ({ scan, onClick, onDelete }, ref) => {
    return (
      <motion.div
        ref={ref} // ✅ Atribuindo a ref ao elemento principal
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={onClick}
        className="group bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer relative overflow-hidden"
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
            <Calendar size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
                {format(new Date(scan.createdAt), "EEEE, dd 'de' MMMM", {
                  locale: ptBR,
                })}
              </span>
              {scan.status === "completed" && (
                <Sparkles
                  size={10}
                  className="text-emerald-400 fill-emerald-400"
                />
              )}
            </div>
            <h4 className="text-base font-black italic uppercase text-slate-800 leading-tight">
              Análise #{scan.id.slice(0, 5)}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Button
            variant="ghost"
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // ✅ Evita que ao excluir, o card seja clicado
              onDelete(e);
            }}
            className="h-10 w-10 p-0 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 size={16} />
          </Button>
          <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-emerald-600 transition-all shadow-lg">
            <ChevronRight size={18} />
          </div>
        </div>
      </motion.div>
    );
  }
);

AiScanCard.displayName = "AiScanCard";