// client/src/pages/checkout/components/CheckoutCustomer.tsx

import React, { useEffect, useRef, useState } from "react";
import { User as UserIcon, Phone, Fingerprint, LogIn, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/_core/trpc";
import { useCheckout } from "../context/CheckoutContext";
import type { CheckoutFocusField } from "@shared/domain/ux/checkoutFocus";
import {
  EMAIL_IDENTITY_CHECK_DEBOUNCE_MS,
  EMAIL_IDENTITY_RATE_LIMIT_PAUSE_MS,
  canCheckUserExists,
  isValidCheckoutEmail,
  normalizeCheckoutEmail,
} from "@shared/domain/checkout/emailIdentityCheck";
import {
  formatCpf,
  isValidCpf,
  maskCpfForDisplay,
  normalizeCpf,
} from "@shared/domain/checkout/cpf";

const applyPhoneMask = (val: string) => {
  let s = val.replace(/\D/g, "");
  if (s.length > 11) s = s.slice(0, 11);
  if (s.length > 2) s = `(${s.slice(0, 2)}) ${s.slice(2)}`;
  if (s.length > 9) s = `${s.slice(0, 10)}-${s.slice(10)}`;
  return s;
};

interface AuthContextContract {
  isAuthenticated: boolean;
  loading?: boolean;
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
  const createGuestMutation = trpc.auth.createGuestSession.useMutation();
  const trpcUtils = trpc.useUtils();

  const [duplicateError, setDuplicateError] = useState(false);
  const [highlightedField, setHighlightedField] =
    useState<CheckoutFocusField | null>(null);
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);
  const [localErrors, setLocalErrors] = useState<{ name?: string; phone?: string; cpf?: string; email?: string }>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const cpfRef = useRef<HTMLInputElement>(null);
  const lastCheckedEmailRef = useRef<string | null>(null);
  const lastCheckedCpfRef = useRef<string | null>(null);
  const rateLimitedEmailRef = useRef<string | null>(null);
  const rateLimitedUntilRef = useRef(0);
  const checkUserMutationRef = useRef(checkUserMutation);
  const isCreatingGuestRef = useRef(false);
  const createdGuestPayloadRef = useRef<string | null>(null);
  const pendingGuestPayloadRef = useRef<string | null>(null);

  const isLogged = auth.isAuthenticated;
  const authLoading = auth.loading === true;
  const normalizedEmail = normalizeCheckoutEmail(
    isLogged ? auth.user?.email || "" : customer.email,
  );
  const cleanCpf = normalizeCpf(customer.cpf);

  // ✅ Trava global: impede edição se estiver enviando pedido ou processando transições
  const isLocked = isBusy || machineState === 'submitting' || machineState === 'success';

  useEffect(() => {
    const onFocusError = (event: Event) => {
      const field = (event as CustomEvent<{ field?: CheckoutFocusField }>).detail
        ?.field;
      const input =
        field === "customerName"
          ? nameRef.current
          : field === "customerPhone"
            ? phoneRef.current
            : field === "customerCpf"
              ? cpfRef.current
              : null;

      if (!field || !input) return;

      setHighlightedField(field);
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => input.focus({ preventScroll: true }), 250);
      window.setTimeout(() => setHighlightedField(null), 2200);
    };

    window.addEventListener("checkout-focus-error", onFocusError);
    return () => window.removeEventListener("checkout-focus-error", onFocusError);
  }, []);

  useEffect(() => {
    checkUserMutationRef.current = checkUserMutation;
  }, [checkUserMutation]);

  useEffect(() => {
    const now = Date.now();
    const rateLimitedUntil =
      rateLimitedEmailRef.current === normalizedEmail
        ? rateLimitedUntilRef.current
        : 0;

    const cpfToPass = cleanCpf.length === 11 ? cleanCpf : "";

    if (
      !canCheckUserExists({
        authLoading,
        isAuthenticated: isLogged,
        normalizedEmail,
        cleanCpf,
        lastCheckedEmail: lastCheckedEmailRef.current,
        lastCheckedCpf: lastCheckedCpfRef.current,
        isPending: checkUserMutation.isPending,
        now,
        rateLimitedUntil,
      })
    ) {
      if (isLogged || !isValidCheckoutEmail(normalizedEmail)) {
        setDuplicateError(false);
      }
      return;
    }

    const timer = window.setTimeout(async () => {
      if (checkUserMutationRef.current.isPending) return;
      if (
        rateLimitedEmailRef.current === normalizedEmail &&
        Date.now() < rateLimitedUntilRef.current
      ) {
        return;
      }

      lastCheckedEmailRef.current = normalizedEmail;
      lastCheckedCpfRef.current = cpfToPass;
      try {
        const res = await checkUserMutationRef.current.mutateAsync({
          email: normalizedEmail,
          document: cpfToPass || undefined,
        });
        setDuplicateError(res.exists);
        setLocalErrors((current) =>
          current.email === "Muitas tentativas para verificar e-mail. Você pode continuar como visitante."
            ? { ...current, email: undefined }
            : current,
        );
      } catch (err: any) {
        const code = err?.data?.code || err?.shape?.data?.code;
        if (code === "TOO_MANY_REQUESTS") {
          rateLimitedEmailRef.current = normalizedEmail;
          rateLimitedUntilRef.current =
            Date.now() + EMAIL_IDENTITY_RATE_LIMIT_PAUSE_MS;
          setLocalErrors((current) => ({
            ...current,
            email:
              "Muitas tentativas para verificar e-mail. Você pode continuar como visitante.",
          }));
          return;
        }

        console.error("Erro ao verificar duplicidade:", err);
      }
    }, EMAIL_IDENTITY_CHECK_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [
    authLoading,
    cleanCpf,
    isLogged,
    normalizedEmail,
    checkUserMutation.isPending,
  ]);

  const handleContinueAsGuest = async () => {
    if (isLogged || isCreatingGuestRef.current || createGuestMutation.isPending) {
      return;
    }

    setLocalErrors({});
    let hasError = false;
    const errors: { name?: string; phone?: string; cpf?: string; email?: string } = {};

    if (!customer.name.trim()) {
      errors.name = "Nome é obrigatório.";
      hasError = true;
    }
    if (customer.phone.replace(/\D/g, "").length < 10) {
      errors.phone = "WhatsApp é obrigatório.";
      hasError = true;
    }
    if (!cleanCpf) {
      errors.cpf = "CPF é obrigatório.";
      hasError = true;
    } else if (!isValidCpf(cleanCpf)) {
      errors.cpf = "CPF inválido.";
      hasError = true;
    }
    const cleanEmail = (customer.email || "").trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      errors.email = "E-mail inválido.";
      hasError = true;
    }

    if (hasError) {
      setLocalErrors(errors);
      return;
    }

    const guestPayload = {
      email: cleanEmail.toLowerCase(),
      name: customer.name.trim(),
      phone: customer.phone.replace(/\D/g, ""),
      cpf: cleanCpf,
    };
    const guestPayloadKey = JSON.stringify(guestPayload);

    if (
      pendingGuestPayloadRef.current === guestPayloadKey ||
      createdGuestPayloadRef.current === guestPayloadKey
    ) {
      return;
    }

    isCreatingGuestRef.current = true;
    pendingGuestPayloadRef.current = guestPayloadKey;
    setIsCreatingGuest(true);
    try {
      await createGuestMutation.mutateAsync(guestPayload);
      createdGuestPayloadRef.current = guestPayloadKey;
      await trpcUtils.auth.me.invalidate();
      await trpcUtils.auth.me.fetch();
      await trpcUtils.store.addresses.list.invalidate();
    } catch (err: any) {
      console.error("Erro ao criar sessão de visitante:", err);
      setLocalErrors({
        email:
          err.message ||
          "Não foi possível preparar o checkout visitante. Tente novamente.",
      });
    } finally {
      pendingGuestPayloadRef.current = null;
      isCreatingGuestRef.current = false;
      setIsCreatingGuest(false);
    }
  };

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
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 rounded-full border border-amber-100 hover:bg-amber-100 transition-colors text-left"
          >
            <LogIn size={10} className="text-amber-600 shrink-0" />
            <span className="text-[8px] font-black uppercase text-amber-600">
              Já comprou antes? Entre para recuperar seus dados e endereços.
            </span>
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-4xl p-6 md:p-10 shadow-2xl shadow-slate-200/40 space-y-6 md:space-y-8 overflow-hidden text-left">
        {!isLogged && (
          <div className="bg-emerald-50 border border-emerald-100/50 rounded-2xl p-4 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
                <UserIcon size={12} />
              </div>
              <span>Você não precisa criar senha para concluir o pedido. Usaremos seus dados para identificar a compra, contato de entrega e envio de confirmação.</span>
            </div>
            <p className="text-[9px] font-bold text-emerald-700/80 leading-normal ml-9 normal-case">
              Para facilitar a entrega e o acompanhamento, criaremos um cadastro temporário de visitante. Se quiser salvar seus dados para próximas compras, você poderá criar uma conta depois.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

          <div className="space-y-2 group" data-checkout-field="customerName">
            <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest group-focus-within:text-emerald-500 transition-colors">
              Nome Completo
            </Label>
            <div className="relative">
              <Input
                ref={nameRef}
                value={customer.name}
                disabled={isLocked}
                onChange={(e) => actions.setField("customerName", e.target.value)}
                placeholder="Ex: João Silva"
                aria-invalid={highlightedField === "customerName" || !!customer.errors?.name || !!localErrors.name}
                className={cn(
                  "h-14 rounded-2xl bg-slate-50 border-2 border-transparent font-bold text-slate-900 focus:bg-white focus:border-emerald-500/20 transition-all pl-12 disabled:opacity-50",
                  (highlightedField === "customerName" || !!customer.errors?.name || !!localErrors.name) &&
                    "border-rose-400 bg-rose-50 ring-4 ring-rose-100",
                )}
              />
              <UserIcon className="absolute left-4 top-4.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
            </div>
            {(customer.errors?.name || localErrors.name) && (
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider ml-1 mt-1 block">
                {customer.errors?.name || localErrors.name}
              </span>
            )}
          </div>

          <div className="space-y-2 group" data-checkout-field="customerEmail">
            <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest group-focus-within:text-emerald-500 transition-colors">
              E-mail
            </Label>
            <div className="relative">
              <Input
                value={isLogged ? auth.user?.email || "" : customer.email || ""}
                disabled={isLogged || isLocked}
                onChange={(e) => actions.setField("customerEmail", e.target.value)}
                placeholder="seu-email@provedor.com"
                aria-invalid={!!customer.errors?.email || !!localErrors.email}
                className={cn(
                  "h-14 rounded-2xl pl-12 transition-all font-bold",
                  isLogged ? "bg-slate-100 border-none text-slate-500 cursor-not-allowed" :
                  "bg-slate-50 border-2 border-transparent text-slate-900 focus:bg-white focus:border-emerald-500/20",
                  (!!customer.errors?.email || !!localErrors.email) &&
                    "border-rose-400 bg-rose-50 ring-4 ring-rose-100",
                )}
              />
              <LogIn className="absolute left-4 top-4.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
            </div>
            {(customer.errors?.email || localErrors.email) && (
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider ml-1 mt-1 block">
                {customer.errors?.email || localErrors.email}
              </span>
            )}
          </div>

          <div className="space-y-2 group" data-checkout-field="customerPhone">
            <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest group-focus-within:text-emerald-500 transition-colors">
              WhatsApp
            </Label>
            <div className="relative">
              <Input
                ref={phoneRef}
                value={applyPhoneMask(customer.phone)}
                disabled={isLocked}
                onChange={(e) => actions.setField("customerPhone", e.target.value.replace(/\D/g, ""))}
                placeholder="(00) 00000-0000"
                aria-invalid={highlightedField === "customerPhone" || !!customer.errors?.phone || !!localErrors.phone}
                className={cn(
                  "h-14 rounded-2xl bg-slate-50 border-2 border-transparent font-bold text-slate-900 focus:bg-white focus:border-emerald-500/20 transition-all pl-12 disabled:opacity-50",
                  (highlightedField === "customerPhone" || !!customer.errors?.phone || !!localErrors.phone) &&
                    "border-rose-400 bg-rose-50 ring-4 ring-rose-100",
                )}
              />
              <Phone className="absolute left-4 top-4.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
            </div>
            {(customer.errors?.phone || localErrors.phone) && (
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider ml-1 mt-1 block">
                {customer.errors?.phone || localErrors.phone}
              </span>
            )}
          </div>

          <div
            data-checkout-field="customerCpf"
            className={cn("space-y-2", (isLogged || isLocked) ? "opacity-60" : "group")}
          >
            <Label className={cn("text-[9px] font-black uppercase ml-1 tracking-widest transition-colors", duplicateError ? "text-amber-600" : "text-slate-400 group-focus-within:text-emerald-500")}>
              CPF
            </Label>
            <div className="relative">
              <Input
                ref={cpfRef}
                value={isLogged ? maskCpfForDisplay(customer.cpf) : formatCpf(customer.cpf)}
                disabled={isLogged || isLocked}
                onChange={(e) => actions.setField("customerCpf", normalizeCpf(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                aria-invalid={highlightedField === "customerCpf" || duplicateError || !!customer.errors?.cpf || !!localErrors.cpf}
                className={cn(
                  "h-14 rounded-2xl font-bold pl-12 transition-all",
                  isLogged ? "bg-slate-100 border-none text-slate-500 cursor-not-allowed" :
                  duplicateError ? "bg-amber-50 border-2 border-amber-300 text-amber-900 focus:border-amber-400" :
                  "bg-slate-50 border-2 border-transparent text-slate-900 focus:bg-white focus:border-emerald-500/20",
                  (highlightedField === "customerCpf" || duplicateError || !!customer.errors?.cpf || !!localErrors.cpf) &&
                    "border-rose-400 bg-rose-50 ring-4 ring-rose-100",
                )}
              />
              <Fingerprint className={cn("absolute left-4 top-4.5 transition-colors", duplicateError ? "text-amber-500" : "text-slate-400")} size={18} />
            </div>
            {(customer.errors?.cpf || localErrors.cpf) && (
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider ml-1 mt-1 block">
                {customer.errors?.cpf || localErrors.cpf}
              </span>
            )}
          </div>

          {duplicateError && (
            <div className="col-span-1 md:col-span-2 p-4 mt-2 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3 text-amber-700">
                <AlertCircle size={24} className="shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">
                  Já existe uma conta com estes dados.<br/>
                  <span className="font-bold opacity-80">Você pode entrar para acumular pontos, mas pode continuar como visitante.</span>
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

          {!isLogged && (
            <div className="col-span-1 md:col-span-2 pt-4">
              <button
                type="button"
                disabled={isLocked || isCreatingGuest}
                onClick={handleContinueAsGuest}
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2"
              >
                {isCreatingGuest ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Finalizar como visitante"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
