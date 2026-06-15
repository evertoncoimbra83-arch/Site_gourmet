import React, { useState } from "react";
import {
  ShieldAlert, Smartphone, Laptop, Tablet, Globe,
  Trash2, ShieldCheck, LogOut, Clock, Activity, Loader2, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Interface do VM do Perfil
interface SecurityTabProps {
  vm: any; // ProfileVM
}

// Interface de Sessão do Backend
interface UserSession {
  sessionId: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  currentSession: boolean;
  userAgent: string | null;
  ip: string | null;
  lastActivity: Date | string | null;
}

// Interface de Log de Autenticação
interface AuthLog {
  id: number;
  action: string;
  severity: string;
  createdAt: Date | string;
  ipAddress: string;
  userAgent: string;
  reason?: string;
}

// Parser de User Agent ultra leve
function parseUserAgent(ua: string | null) {
  if (!ua) return { browser: "Navegador Desconhecido", os: "Dispositivo Desconhecido", isMobile: false, isTablet: false };
  const lower = ua.toLowerCase();

  let browser = "Navegador";
  if (lower.includes("firefox")) browser = "Mozilla Firefox";
  else if (lower.includes("edg")) browser = "Microsoft Edge";
  else if (lower.includes("opera") || lower.includes("opr")) browser = "Opera";
  else if (lower.includes("chrome") || lower.includes("crios")) browser = "Google Chrome";
  else if (lower.includes("safari")) browser = "Apple Safari";

  let os = "Dispositivo";
  if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("macintosh") || lower.includes("mac os x")) os = "macOS";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("iphone")) os = "iPhone (iOS)";
  else if (lower.includes("ipad")) os = "iPad (iOS)";
  else if (lower.includes("linux")) os = "Linux";

  const isTablet = lower.includes("ipad") || (lower.includes("android") && !lower.includes("mobile"));
  const isMobile = !isTablet && (lower.includes("mobile") || lower.includes("iphone") || lower.includes("android"));

  return { browser, os, isMobile, isTablet };
}

// Tradutor de Ações de Auditoria
function translateAction(action: string) {
  const map: Record<string, string> = {
    LOGIN_PASSWORD_SUCCESS: "Login realizado com sucesso",
    LOGIN_PASSWORD_FAIL: "Falha de login (Senha incorreta)",
    REGISTER_PASSWORD_SUCCESS: "Conta registrada com sucesso",
    RESET_REQUESTED: "Solicitação de recuperação de senha",
    RESET_SUCCESS: "Senha redefinida com sucesso",
    LOGOUT: "Sessão encerrada (Logout)",
    LOGOUT_OTHER_SESSIONS: "Outros dispositivos desconectados",
    LOGOUT_ALL_SESSIONS: "Todos os dispositivos desconectados",
    SESSION_REVOKED: "Dispositivo desconectado individualmente",
    LOGIN_BLOCKED_DELETED: "Login bloqueado (Conta excluída)",
    OAUTH_LOGIN_SUCCESS: "Login via Google com sucesso",
    OAUTH_REGISTER_SUCCESS: "Cadastro via Google realizado",
    OAUTH_LINK_SUCCESS: "Conta Google vinculada",
    OAUTH_LINK_DENIED: "Vínculo social negado/bloqueado",
    OAUTH_UNLINK: "Conta Google desvinculada",
  };
  return map[action] || action;
}

export function SecurityTab({ vm }: SecurityTabProps) {
  const sessions = (vm.sessions || []) as UserSession[];
  const logs = (vm.recentAuthActivity || []) as AuthLog[];
  const isLoading = vm.isLoadingSessions || vm.isLoadingRecentAuth || vm.isLoadingOauthAccounts;

  const [confirmTarget, setConfirmTarget] = useState<"others" | "all" | "unlink_google" | string | null>(null);

  const params = new URLSearchParams(window.location.search);
  const linkingToken = params.get("linkingToken");
  const email = params.get("email");

  const handleRevokeOthers = async () => {
    try {
      await vm.logoutOtherSessions();
      setConfirmTarget(null);
    } catch {}
  };

  const handleRevokeAll = async () => {
    try {
      await vm.logoutAllSessions();
      setConfirmTarget(null);
    } catch {}
  };

  const handleRevokeSingle = async (sessionId: string) => {
    try {
      await vm.logoutSession(sessionId);
      setConfirmTarget(null);
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-[10px] font-black uppercase tracking-widest">Carregando segurança da conta...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-x-hidden text-left">

      {/* Seção Informativa de Cabeçalho */}
      <div>
        <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
          Segurança da Conta
        </h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Gerencie e desconecte as sessões ativas nos seus dispositivos e consulte o histórico de login recente.
        </p>
      </div>

      {/* Confirmações Inline Dinâmicas (Aesthetics) */}
      {confirmTarget && (
        <Card className="rounded-3xl border border-amber-200 bg-amber-50/50 shadow-md animate-in slide-in-from-top-4 duration-300">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-2.5 rounded-2xl shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-amber-900 uppercase tracking-tight">
                  {confirmTarget === "others" ? "Desconectar outros dispositivos?" :
                   confirmTarget === "all" ? "Desconectar TODOS os dispositivos?" :
                   confirmTarget === "unlink_google" ? "Desvincular conta Google?" :
                   "Desconectar este dispositivo específico?"}
                </h4>
                <p className="text-xs text-amber-700 font-semibold tracking-tight mt-1 leading-snug">
                  {confirmTarget === "others" ? "Esta ação encerrará o acesso nos demais celulares e computadores conectados à sua conta." :
                   confirmTarget === "all" ? "Aviso: Isso encerrará sua sessão atual e você precisará fazer login novamente em todos os dispositivos." :
                   confirmTarget === "unlink_google" ? "Sua conta do Google será desvinculada e você não poderá mais usá-la para fazer login rápido, a menos que a reconecte." :
                   "Este celular ou computador perderá o acesso imediato à sua conta e exigirá um novo login."}
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmTarget(null)}
                className="rounded-xl font-bold uppercase text-[9px] tracking-wider border-slate-200"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-xl font-bold uppercase text-[9px] tracking-wider bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  if (confirmTarget === "others") handleRevokeOthers();
                  else if (confirmTarget === "all") handleRevokeAll();
                  else if (confirmTarget === "unlink_google") {
                    try {
                      await vm.unlinkOauthAccount("google", true);
                      setConfirmTarget(null);
                    } catch {}
                  }
                  else handleRevokeSingle(confirmTarget);
                }}
              >
                Confirmar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmação de Vinculação OAuth */}
      {linkingToken && email && (
        <Card className="rounded-3xl border border-emerald-200 bg-emerald-50/50 shadow-md animate-in slide-in-from-top-4 duration-300 mb-6">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 p-2.5 rounded-2xl shrink-0 mt-0.5 text-emerald-600">
                <Globe className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-tight">
                  Vincular Conta Google?
                </h4>
                <p className="text-xs text-emerald-800 font-semibold tracking-tight mt-1 leading-snug">
                  Deseja conectar a conta Google <strong>{email}</strong> ao seu perfil do Gourmet Saudável?
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.history.replaceState({}, "", window.location.pathname);
                  vm.refreshAll();
                }}
                className="rounded-xl font-bold uppercase text-[9px] tracking-wider border-slate-200"
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={vm.isLinkingOauth}
                className="rounded-xl font-bold uppercase text-[9px] tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={async () => {
                  try {
                    await vm.linkOauthAccount(linkingToken, true);
                    window.history.replaceState({}, "", window.location.pathname);
                    vm.refreshAll();
                  } catch {}
                }}
              >
                Vincular
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GRID Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Lado Esquerdo/Centro: Sessões Ativas (Col-span 2) */}
        <div className="md:col-span-2 space-y-6">

          <Card className="rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3 md:py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-500">
                <Smartphone className="h-4 w-4 text-slate-400" />
                Dispositivos Conectados ({sessions.length})
              </CardTitle>

              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setConfirmTarget("others")}
                  disabled={sessions.length <= 1 || vm.isLoggingOutOther}
                  className="rounded-xl font-bold uppercase text-[9px] tracking-widest h-8 px-3 border-slate-200 hover:bg-slate-100 text-slate-600"
                >
                  Desconectar Outros
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmTarget("all")}
                  disabled={vm.isLoggingOutAll}
                  className="rounded-xl font-bold uppercase text-[9px] tracking-widest h-8 px-3 text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700"
                >
                  <LogOut className="h-3 w-3 mr-1" /> Desconectar Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 divide-y divide-slate-100">
              {sessions.map((session) => {
                const ua = parseUserAgent(session.userAgent);
                return (
                  <div key={session.sessionId} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0 transition-colors duration-200 hover:bg-slate-50/30 px-2 rounded-2xl">
                    <div className="flex items-center gap-4">
                      {/* Ícone conforme tipo de dispositivo */}
                      <div className={cn(
                        "p-3 rounded-2xl shadow-sm shrink-0",
                        session.currentSession ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
                      )}>
                        {ua.isMobile ? <Smartphone className="h-5 w-5" /> :
                         ua.isTablet ? <Tablet className="h-5 w-5" /> :
                         ua.isMobile === false ? <Laptop className="h-5 w-5" /> :
                         <Globe className="h-5 w-5" />}
                      </div>

                      {/* Informações detalhadas do dispositivo */}
                      <div className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-800 leading-snug">
                            {ua.os} • {ua.browser}
                          </span>
                          {session.currentSession && (
                            <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full leading-none">
                              Este Dispositivo
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold tracking-tight mt-1 leading-none">
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-500 font-bold">
                            IP: {session.ip || "Desconhecido"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0 text-slate-300" />
                            Acesso: {new Date(session.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Revogação Individual */}
                    {!session.currentSession && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmTarget(session.sessionId)}
                        disabled={vm.isRevokingSession}
                        className="rounded-full h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                        title="Desconectar este dispositivo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Contas Conectadas */}
          <Card className="rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3 md:py-4 px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-500">
                <Globe className="h-4 w-4 text-slate-400" />
                Contas Conectadas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl shadow-sm shrink-0",
                    vm.oauthAccounts.some((acc: any) => acc.provider === "google") ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-400"
                  )}>
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold text-slate-800 leading-snug">
                      Google
                    </span>
                    {vm.oauthAccounts.some((acc: any) => acc.provider === "google") ? (
                      <div className="flex flex-col text-[10px] text-slate-400 font-semibold tracking-tight mt-1">
                        <span className="text-slate-600">
                          Conectado como: {vm.oauthAccounts.find((acc: any) => acc.provider === "google")?.email}
                        </span>
                        <span>
                          Vinculado em: {new Date(vm.oauthAccounts.find((acc: any) => acc.provider === "google")?.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Não conectado
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  {vm.oauthAccounts.some((acc: any) => acc.provider === "google") ? (
                    <Button
                      variant="outline"
                      onClick={() => setConfirmTarget("unlink_google")}
                      disabled={vm.isUnlinkingOauth}
                      className="rounded-xl font-bold uppercase text-[9px] tracking-widest h-8 px-3 border-slate-200 text-red-600 hover:bg-red-50"
                    >
                      Desvincular
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await vm.startOauthGoogle();
                        } catch {}
                      }}
                      disabled={vm.isStartingOauthGoogle}
                      className="rounded-xl font-bold uppercase text-[9px] tracking-widest h-8 px-3 border-slate-200 text-emerald-600 hover:bg-emerald-50"
                    >
                      Vincular Google
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Histórico de Atividades (Col-span 1) */}
        <div className="md:col-span-1 space-y-6">
          <Card className="rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white h-full flex flex-col">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3 md:py-4 px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-500">
                <Activity className="h-4 w-4 text-slate-400" />
                Histórico Recente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-5 flex-1 overflow-y-auto max-h-125 space-y-4 no-scrollbar">
              {logs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                  Nenhuma atividade registrada.
                </div>
              ) : (
                logs.map((log) => {
                  const ua = parseUserAgent(log.userAgent);
                  return (
                    <div key={log.id} className="flex gap-3 text-left group">
                      {/* Timeline Dot/Icon */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className={cn(
                          "w-2.5 h-2.5 rounded-full mt-1.5 transition-transform group-hover:scale-125",
                          log.severity === "critical" ? "bg-red-500 shadow-red-200 shadow-lg" :
                          log.severity === "warning" ? "bg-amber-500 shadow-amber-200 shadow-lg" :
                          "bg-emerald-500 shadow-emerald-200 shadow-lg"
                        )} />
                        <div className="w-0.5 flex-1 bg-slate-100 mt-2" />
                      </div>

                      {/* Detalhes do Log */}
                      <div className="space-y-1 pb-4 border-b border-slate-50 last:border-b-0 w-full">
                        <p className="text-[11px] font-bold text-slate-800 leading-tight">
                          {translateAction(log.action)}
                        </p>
                        <p className="text-[9px] text-slate-400 font-semibold leading-none tracking-tight">
                          {new Date(log.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" })}
                        </p>
                        <p className="text-[9px] text-slate-500 font-bold tracking-tight">
                          {ua.os} • {ua.browser} • <span className="bg-slate-100 px-1 rounded-sm text-[8px] text-slate-400">IP: {log.ipAddress}</span>
                        </p>
                        {log.reason && log.reason !== "account_match" && (
                          <p className="text-[9px] text-slate-400 italic font-semibold">
                            Motivo: {log.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
