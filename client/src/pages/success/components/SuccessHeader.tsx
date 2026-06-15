import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Hash,
  Loader2,
  SearchX,
  ShieldAlert,
} from "lucide-react";
import type { PageState } from "../types";

interface SuccessHeaderProps {
  pageState: PageState;
  headerTitle: string;
  displayOrderId: string;
}

export function SuccessHeader({
  pageState,
  headerTitle,
  displayOrderId,
}: SuccessHeaderProps) {
  return (
    <div className="bg-primary p-8 md:p-10 text-center relative overflow-hidden">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="inline-flex bg-emerald-500 p-3 rounded-2xl mb-4 shadow-xl shadow-emerald-500/30 rotate-3">
          {pageState === "loading" ? (
            <Loader2 className="text-white w-8 h-8 animate-spin" />
          ) : pageState === "ready" ? (
            <CheckCircle2 className="text-white w-8 h-8" strokeWidth={3} />
          ) : pageState === "access-denied" ? (
            <ShieldAlert className="text-white w-8 h-8" strokeWidth={2.4} />
          ) : pageState === "not-found" ? (
            <SearchX className="text-white w-8 h-8" strokeWidth={2.4} />
          ) : (
            <AlertTriangle className="text-white w-8 h-8" strokeWidth={2.4} />
          )}
        </div>

        <h1 className="text-white text-2xl font-black uppercase italic tracking-tighter leading-none">
          Pedido <span className="text-emerald-500">{headerTitle}</span>
        </h1>

        <div className="mt-4 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
          <Hash size={12} className="text-emerald-500" />
          <span className="text-white font-black text-[10px] tracking-widest uppercase opacity-60">
            ID:
          </span>
          <span className="text-white font-black text-sm tracking-widest uppercase">
            {displayOrderId}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
