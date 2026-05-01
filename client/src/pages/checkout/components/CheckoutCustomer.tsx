// client/src/pages/checkout/components/CheckoutCustomer.tsx

import React, { useEffect, useState } from "react";
import { User as UserIcon, Phone, Fingerprint, LogIn, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/_core/trpc";
import { useCheckout } from "../context/CheckoutContext";

const applyPhoneMask = (val: string) => {
  let s = val.replace(/\D/g, "");
  if (s.length > 11) s = s.slice(0, 11);
  if (s.length > 2) s = `(${s.slice(0, 2)}) ${s.slice(2)}`;
  if (s.length > 9) s = `${s.slice(0, 10)}-${s.slice(10)}`;
  return s;
};

const applyCPFMask = (val: string) => {
  let v = val.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return v;
};

const maskCPFDisplay = (val: string) => {
  const s = val.replace(/\D/g, "");
  if (s.length !== 11) return val;
  return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-$4");
};

interface AuthContextContract {
  isAuthenticated: boolean;
  user?: {
    email?: string;
    name?: string;
  };
  openAuthModal?: (mode: "login" | "register") => void;
}

export function CheckoutCustomer() {
  // ✅ Pegamos o machineState e isBusy para controlar a interatividade
  const { customer, actions, isLoading: vmLoading, machineState, isBusy } = useCheckout();
  const auth = useAuth() as unknown as AuthContextContract;

  const checkUserMutation = trpc.auth.checkUserExists.useMutation();
  const [duplicateError, setDuplicateError] = useState(false);

  const isLogged = auth.isAuthenticated;
  const currentEmail = auth.user?.email || "";

  // ✅ Trava global: impede edição se estiver enviando pedido ou processando transições
  const isLocked = isBusy || machineState === 'submitting' || machineState === 'success';

  useEffect(() => {
    const cleanCpf = customer.cpf.replace(/\D/g, "");
    if (isLogged || cleanCpf.length < 11) {
      setDuplicateError(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await checkUserMutation.mutateAsync({
          email: currentEmail, 
          document: cleanCpf,
        });
        setDuplicateError(res.exists);
      } catch (err) {
        console.error("Erro ao verificar duplicidade:", err);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [customer.cpf, isLogged, currentEmail, checkUserMutation]);

  if (vmLoading) {
    return (
      <div className="p-12 border-2 border-slate-100 rounded-4xl bg-white text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
        <Loader2 size={32} className="text-emerald-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
          Sincronizando perfil...
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left",
      isLocked && "opacity-70 pointer-events-none"
    )}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-md">
            <UserIcon size={12} />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">
            {isLogged ? "Seus Dados" : "Identificação do Pedido"}
          </h2>
        </div>

        {!isLogged && (
          <button
            type="button"
            disabled={isLocked}
            onClick={() => auth.openAuthModal?.("login")}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100 hover:bg-amber-100 transition-colors"
          >
            <LogIn size={10} className="text-amber-600" />
            <span className="text-[8px] font-black uppercase text-amber-600">
              Já tem conta? Entrar
            </span>
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-4xl p-6 md:p-10 shadow-2xl shadow-slate-200/40 space-y-8 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          
          <div className="space-y-2 group">
            <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest group-focus-within:text-emerald-500 transition-colors">
              Nome Completo
            </Label>
            <div className="relative">
              <Input
                value={customer.name}
                disabled={isLocked}
                onChange={(e) => actions.setField("customerName", e.target.value)}
                placeholder="Ex: João Silva"
                className="h-14 rounded-2xl bg-slate-50 border-2 border-transparent font-bold text-slate-900 focus:bg-white focus:border-emerald-500/20 transition-all pl-12 disabled:opacity-50"
              />
              <UserIcon className="absolute left-4 top-4.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
            </div>
          </div>

          <div className="space-y-2 group">
            <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest group-focus-within:text-emerald-500 transition-colors">
              WhatsApp
            </Label>
            <div className="relative">
              <Input
                value={applyPhoneMask(customer.phone)}
                disabled={isLocked}
                onChange={(e) => actions.setField("customerPhone", e.target.value.replace(/\D/g, ""))}
                placeholder="(00) 00000-0000"
                className="h-14 rounded-2xl bg-slate-50 border-2 border-transparent font-bold text-slate-900 focus:bg-white focus:border-emerald-500/20 transition-all pl-12 disabled:opacity-50"
              />
              <Phone className="absolute left-4 top-4.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
            </div>
          </div>

          <div className={cn("space-y-2", (isLogged || isLocked) ? "opacity-60" : "group")}>
            <Label className={cn("text-[9px] font-black uppercase ml-1 tracking-widest transition-colors", duplicateError ? "text-amber-600" : "text-slate-400 group-focus-within:text-emerald-500")}>
              CPF
            </Label>
            <div className="relative">
              <Input
                value={isLogged ? maskCPFDisplay(customer.cpf) : applyCPFMask(customer.cpf)}
                disabled={isLogged || isLocked}
                onChange={(e) => actions.setField("customerCpf", e.target.value.replace(/\D/g, ""))}
                placeholder="000.000.000-00"
                maxLength={14}
                className={cn(
                  "h-14 rounded-2xl font-bold pl-12 transition-all",
                  isLogged ? "bg-slate-100 border-none text-slate-500 cursor-not-allowed" : 
                  duplicateError ? "bg-amber-50 border-2 border-amber-300 text-amber-900 focus:border-amber-400" : 
                  "bg-slate-50 border-2 border-transparent text-slate-900 focus:bg-white focus:border-emerald-500/20"
                )}
              />
              <Fingerprint className={cn("absolute left-4 top-4.5 transition-colors", duplicateError ? "text-amber-500" : "text-slate-400")} size={18} />
            </div>
          </div>

          {duplicateError && (
            <div className="col-span-1 md:col-span-2 p-4 mt-2 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3 text-amber-700">
                <AlertCircle size={24} className="shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">
                  Conta já existente com este CPF.<br/>
                  <span className="font-bold opacity-80">Faça login para acumular seus pontos!</span>
                </p>
              </div>
              <button 
                type="button"
                disabled={isLocked}
                onClick={() => auth.openAuthModal?.("login")}
                className="shrink-0 w-full md:w-auto h-10 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-md disabled:grayscale"
              >
                Fazer Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}