import React from "react";
import type { CheckoutVM } from "../logic/useCheckoutLogic";
import { User, Lock, Phone, IdCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  state: CheckoutVM["state"];
  actions: CheckoutVM["actions"];
};

/* --- 🎭 FUNÇÕES DE MÁSCARA --- */
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove tudo o que não é dígito
    .replace(/(\d{3})(\d)/, "$1.$2") // Coloca ponto após os 3 primeiros dígitos
    .replace(/(\d{3})(\d)/, "$1.$2") // Coloca ponto após os 6 primeiros dígitos
    .replace(/(\d{3})(\d{1,2})/, "$1-$2") // Coloca hífen após os 9 primeiros dígitos
    .replace(/(-\d{2})\d+?$/, "$1"); // Impede que digite mais de 11 números
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove tudo o que não é dígito
    .replace(/(\d{2})(\d)/, "($1) $2") // Coloca parênteses no DDD
    .replace(/(\d{5})(\d)/, "$1-$2") // Coloca hífen no número
    .replace(/(-\d{4})\d+?$/, "$1"); // Limita a 11 dígitos (DDD + 9 + 4)
};

export function CheckoutCustomer({ state, actions }: Props) {
  const { isLogin, isLoggedIn, email, password, name, cpf, whatsapp, isLoading } = state;
  const { setIsLogin, setEmail, setPassword, setName, setCpf, setWhatsapp, handleSubmit } = actions;

  /* ------------------------------------------------------------------------ */
  /* CASO 1: JÁ ESTÁ LOGADO                                                  */
  /* ------------------------------------------------------------------------ */
  if (isLoggedIn) {
    return (
      <section className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.06)] px-6 md:px-8 py-6 space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-emerald-500">Dados pessoais</p>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Olá, <span className="text-emerald-600">{name || "cliente Gourmet"}</span>
            </h2>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">Nome completo</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-300"><User size={16} /></span>
              <Input
                className="pl-9 h-11 rounded-xl bg-slate-50 border-slate-200"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">E-mail</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-300"><Lock size={16} /></span>
              <Input className="pl-9 h-11 rounded-xl bg-slate-50 border-slate-200" value={email} readOnly />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">CPF</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-300"><IdCard size={16} /></span>
              <Input
                className="pl-9 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">WhatsApp</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-300"><Phone size={16} /></span>
              <Input
                className="pl-9 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                value={whatsapp}
                onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* CASO 2: NÃO LOGADO (LOGIN / CADASTRO)                                    */
  /* ------------------------------------------------------------------------ */
  return (
    <section className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.06)] px-6 md:px-8 py-6 space-y-6">
      <header>
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-emerald-500">Acesse sua conta</p>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          {isLogin ? "Identifique-se para continuar" : "Crie sua conta Gourmet"}
        </h2>
      </header>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">E-mail ou CPF</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-300"><User size={16} /></span>
            <Input
              className="pl-9 h-11 rounded-xl bg-slate-50 border-slate-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">Senha</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-300"><Lock size={16} /></span>
            <Input
              className="pl-9 h-11 rounded-xl bg-slate-50 border-slate-200"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {!isLogin && (
          <div className="grid md:grid-cols-2 gap-4 animate-in fade-in duration-300">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">Nome completo</label>
              <Input
                className="h-11 rounded-xl bg-slate-50 border-slate-200"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">CPF</label>
              <Input
                className="h-11 rounded-xl bg-slate-50 border-slate-200"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">WhatsApp</label>
              <Input
                className="h-11 rounded-xl bg-slate-50 border-slate-200"
                value={whatsapp}
                onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 rounded-full text-[13px] font-extrabold tracking-[0.18em] uppercase bg-emerald-600 hover:bg-emerald-700 transition-all active:scale-[0.98]"
          disabled={isLoading}
        >
          {isLoading ? "Processando..." : isLogin ? "Entrar no sistema" : "Cadastrar e continuar"}
        </Button>
      </form>

      <div className="text-center text-[12px] text-slate-500">
        {isLogin ? (
          <>Ainda não tem conta? <button type="button" className="text-emerald-600 font-semibold hover:underline" onClick={() => setIsLogin(false)}>Cadastre-se</button></>
        ) : (
          <>Já possui conta? <button type="button" className="text-emerald-600 font-semibold hover:underline" onClick={() => setIsLogin(true)}>Fazer login</button></>
        )}
      </div>
    </section>
  );
}