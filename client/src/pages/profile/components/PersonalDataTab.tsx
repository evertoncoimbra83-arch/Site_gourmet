import React, { useMemo, useState, useEffect } from "react"; // ✅ Adicionado React
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaskedInput } from "@/components/masked-input";
// ✅ Removido toast não utilizado para limpar ESLint
import { cn } from "@/lib/utils";
import { 
  Edit, Save, X, ShieldCheck, Phone, Cake, 
  Loader2, Lock, Eye, EyeOff 
} from "lucide-react";
import { usePasswordStrength } from "@/_core/hooks/usePasswordStrength";

// --- Tipagem do Usuário ---
export interface UserProfile {
  name?: string;
  email?: string;
  document?: string;
  customerDocument?: string;
  phone?: string;
  whatsapp?: string;
  birthDate?: string | Date;
  birth_date?: string | Date;
  documentSource?: 'order' | string;
}

// --- Helpers de Formatação ---
function onlyDigits(v: string | undefined | null) { 
  return (v || "").replace(/\D/g, ""); 
}

function isoToDisplay(isoDate: string | Date | undefined | null) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function displayToIso(displayDate: string) {
  if (!displayDate || displayDate.length < 10) return null;
  const [d, m, y] = displayDate.split("/");
  return `${y}-${m}-${d}`;
}

function formatInitialCPF(v: string | undefined | null) {
  const clean = onlyDigits(v);
  if (!clean || clean.length !== 11) return clean || "";
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatInitialPhone(v: string | undefined | null) {
  const clean = onlyDigits(v);
  if (!clean) return "";
  if (clean.length === 11) return clean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return clean.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

export function PersonalDataTab({ user }: { user: UserProfile }) {
  const utils = trpc.useUtils();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    document: "",
    phone: "",
    birthDate: "",
  });

  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [showPass, setShowPass] = useState(false);
  
  const { score, label, color } = usePasswordStrength(passwords.new);
  const strength = score;
  const colorClass = color;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        document: formatInitialCPF(user.document || user.customerDocument || ""),
        phone: formatInitialPhone(user.phone || user.whatsapp || ""),
        birthDate: isoToDisplay(user.birthDate || user.birth_date),
      });
    }
  }, [user]);

  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: async () => {
      setIsEditing(false);
      await utils.profile.get.invalidate(); 
      await utils.auth.me.invalidate(); 
    }
  });

  const changePasswordMutation = trpc.profile.changePassword.useMutation({
    onSuccess: () => {
      setShowPasswordForm(false);
      setPasswords({ current: "", new: "" });
    }
  });

  const isCpfValid = useMemo(() => {
    const digits = onlyDigits(formData.document);
    return digits.length === 0 || digits.length === 11;
  }, [formData.document]);

  const handleSave = async () => {
    const yearParts = formData.birthDate.split("/");
    const year = yearParts.length === 3 ? Number(yearParts[2]) : null;

    const payload = {
      name: formData.name,
      phone: onlyDigits(formData.phone),   
      cpf: onlyDigits(formData.document),   
      birthDate: displayToIso(formData.birthDate),
      birthYear: year,
    };

    await updateProfileMutation.mutateAsync(payload);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        document: formatInitialCPF(user.document || user.customerDocument || ""),
        phone: formatInitialPhone(user.phone || user.whatsapp || ""),
        birthDate: isoToDisplay(user.birthDate || user.birth_date),
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase italic tracking-tighter">
            Dados pessoais
          </h3>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Gerencie suas informações de contato e identificação.
          </p>
        </div>

        <div className="flex w-full sm:w-auto gap-2">
          {!isEditing ? (
            <Button
              variant="secondary"
              className="w-full sm:w-auto rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Button>
          ) : (
            <div className="flex w-full gap-2">
              <Button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending || !isCpfValid}
                className="flex-1 sm:flex-none rounded-xl font-bold uppercase text-[10px] tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95 border-none"
              >
                {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 sm:flex-none rounded-xl font-bold uppercase text-[10px] tracking-widest"
              >
                <X className="h-4 w-4 mr-2" /> Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card className="rounded-3xl md:rounded-4xl border-slate-100 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3 md:py-4">
          <CardTitle className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Segurança e Identificação
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 md:p-8 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome completo</Label>
              <Input
                className="h-11 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500/30 transition-all font-bold text-slate-700"
                value={formData.name}
                disabled={!isEditing}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail de acesso</Label>
              <Input
                className="h-11 md:h-12 rounded-xl md:rounded-2xl bg-slate-100 border-transparent font-bold text-slate-400 cursor-not-allowed"
                value={formData.email}
                disabled={true}
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className={cn("text-[9px] md:text-[10px] font-black uppercase tracking-widest ml-1", !isCpfValid ? "text-red-500" : "text-slate-400")}>
                CPF {user?.documentSource === 'order' && "• (Recuperado)"}
              </Label>
              <MaskedInput
                mask="___.___.___-__"
                replacement={{ _: /\d/ }}
                className={cn(
                  "h-11 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 border-transparent font-bold text-slate-700 focus:bg-white focus:border-emerald-500/30 transition-all",
                  !isCpfValid && "border-red-200 bg-red-50 text-red-700"
                )}
                value={formData.document}
                disabled={!isEditing}
                placeholder="000.000.000-00"
                onChange={(e) => setFormData((p) => ({ ...p, document: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                <Phone className="h-3 w-3" /> WhatsApp
              </Label>
              <MaskedInput
                mask="(__) _____-____"
                replacement={{ _: /\d/ }}
                className="h-11 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 border-transparent font-bold text-slate-700 focus:bg-white focus:border-emerald-500/30 transition-all"
                value={formData.phone}
                disabled={!isEditing}
                placeholder="(00) 00000-0000"
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                <Cake className="h-3 w-3" /> Nascimento
              </Label>
              <MaskedInput
                mask="__/__/____"
                replacement={{ _: /\d/ }}
                className="h-11 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 border-transparent font-bold text-slate-700 focus:bg-white focus:border-emerald-500/30 transition-all"
                value={formData.birthDate}
                disabled={!isEditing}
                placeholder="DD/MM/AAAA"
                onChange={(e) => setFormData((p) => ({ ...p, birthDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-2">
        {!showPasswordForm ? (
          <Button 
            variant="outline" 
            onClick={() => setShowPasswordForm(true)} 
            className="w-full sm:w-auto rounded-xl border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-widest h-10"
          >
            <Lock className="h-3 w-3 mr-2" /> Alterar Senha
          </Button>
        ) : (
          <Card className="rounded-3xl border-emerald-100 bg-emerald-50/30 overflow-hidden animate-in slide-in-from-top-4">
            <CardHeader className="py-3 md:py-4 border-b border-emerald-100 flex flex-row items-center justify-between px-4 md:px-8">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Segurança
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPasswordForm(false)} 
                className="h-8 w-8 p-0 rounded-full hover:bg-emerald-100"
              >
                <X className="h-4 w-4"/>
              </Button>
            </CardHeader>
            <CardContent className="p-4 md:p-8 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-emerald-700 ml-1">Senha Atual</Label>
                  <Input 
                    type="password" 
                    className="h-11 md:h-12 rounded-xl md:rounded-2xl bg-white border-emerald-100 font-bold" 
                    value={passwords.current} 
                    onChange={e => setPasswords({...passwords, current: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <Label className="text-[9px] font-black uppercase text-emerald-700">Nova Senha</Label>
                    {passwords.new && <span className={cn("text-[8px] font-black uppercase", colorClass)}>{label}</span>}
                  </div>
                  <div className="relative">
                    <Input 
                      type={showPass ? "text" : "password"} 
                      className="h-11 md:h-12 rounded-xl md:rounded-2xl bg-white border-emerald-100 font-bold pr-12" 
                      value={passwords.new} 
                      onChange={e => setPasswords({...passwords, new: e.target.value})} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass(!showPass)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300"
                    >
                      {showPass ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </button>
                  </div>
                  {passwords.new && (
                    <div className="h-1.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-500", colorClass.replace('text', 'bg'))} 
                        style={{ width: `${(strength + 1) * 25}%` }} 
                      />
                    </div>
                  )}
                </div>
              </div>
              <Button 
                onClick={() => changePasswordMutation.mutate({ 
                  currentPassword: passwords.current, 
                  newPassword: passwords.new 
                })} 
                disabled={changePasswordMutation.isPending || strength < 2} 
                className="w-full h-11 md:h-12 rounded-xl md:rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all border-none"
              >
                {changePasswordMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Confirmar Nova Senha"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {user?.documentSource === 'order' && (
        <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start sm:items-center gap-3">
          <div className="bg-white p-2 rounded-full shadow-sm shrink-0">
            <ShieldCheck className="h-3 w-3 md:h-4 md:w-4 text-emerald-500" />
          </div>
          <p className="text-[9px] md:text-[10px] font-bold text-emerald-700 uppercase tracking-tight leading-snug">
            Notamos que seu CPF não estava no cadastro, mas o recuperamos do seu último pedido. 
            Clique em salvar para confirmar sua identidade. 🍏
          </p>
        </div>
      )}
    </div>
  );
}