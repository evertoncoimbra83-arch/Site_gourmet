import React from "react";
import { Info, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PatientPrescription } from "../hooks/usePrescriptionLogic";

interface PrescriptionHeaderProps {
  plan: PatientPrescription;
}

export function PrescriptionHeader({ plan }: PrescriptionHeaderProps) {
  return (
    <header className="mb-12 text-left">
      <div className="flex gap-2 mb-4">
        <Badge className="bg-emerald-100 text-emerald-700 border-none font-black uppercase text-[9px]">
          Plano Ativo
        </Badge>
        {Number(plan?.discountPercentage) > 0 && (
          <Badge className="bg-amber-100 text-amber-700 border-none font-black uppercase text-[9px]">
            <Tag size={10} className="mr-1 inline" /> {plan.discountPercentage}% Nutri OFF
          </Badge>
        )}
      </div>
      
      <h1 className="text-4xl md:text-5xl font-black uppercase italic text-slate-900 leading-tight">
        {plan?.planName || "Plano Alimentar"}
      </h1>
      
      {plan?.technicalInsight && (
        <div className="mt-6 p-5 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex gap-4 shadow-sm">
          <Info className="text-blue-500 shrink-0" size={24} />
          <div>
            <span className="text-[9px] font-black uppercase text-blue-600 block mb-1">
              Palavra do Nutricionista
            </span>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              {plan.technicalInsight}
            </p>
          </div>
        </div>
      )}
    </header>
  );
}