import { useMemo, useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaskedInput } from "@/components/masked-input";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { 
  Edit, Save, X, ShieldCheck, Phone, Cake, 
  Loader2, Lock, Eye, EyeOff 
} from "lucide-react";
import { usePasswordStrength } from "@/_core/hooks/usePasswordStrength";

// --- Helpers de Formatação ---
function onlyDigits(v: string) { return (v || "").replace(/\D/g, ""); }

function isoToDisplay(isoDate: any) {
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

function formatInitialCPF(v: string) {
  const clean = onlyDigits(v);
  if (!clean || clean.length !== 11) return clean || "";
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatInitialPhone(v: string) {
  const clean = onlyDigits(v);
  if (!clean) return "";
  if (clean.length === 11) return clean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return clean.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

export function PersonalDataTab({ user }: { user: any }) {
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
      toast.success("Dados atualizados com sucesso!");
      setIsEditing(false);
      await utils.profile.get.invalidate(); 
      await utils.auth.me.invalidate(); 
    },
    onError: (err) => toast.error("Erro ao salvar: " + err.message)
  });

  const changePasswordMutation = trpc.profile.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setShowPasswordForm(false);
      setPasswords({ current: "", new: "" });
    },
    onError: (err) => toast.error(err.message)
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
            Dados pessoais
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            Gerencie suas informações de contato e identificação.
          </p>
        </div>

        {!isEditing ? (
          <Button
            variant="secondary"
            className="rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending || !isCpfValid}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest bg-[#2D5A3D] hover:bg-[#1e3d29] text-white transition-all active:scale-95"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              <X className="h-4 w-4 mr-2" /> Cancelar
            </Button>
          </div>
        )}
      </div>

      <Card className="rounded-4xl border-slate-100 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
            Segurança e Identificação
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome completo</Label>
              <Input
                className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-[#D4AF37]/30 transition-all font-bold text-slate-700"
                value={formData.name}
                disabled={!isEditing}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail de acesso</Label>
              <Input
                className="h-12 rounded-2xl bg-slate-100 border-transparent font-bold text-slate-400 cursor-not-allowed"
                value={formData.email}
                disabled={true}
              />
            </div>

            <div className="space-y-2">
              <Label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", !isCpfValid ? "text-red-500" : "text-slate-400")}>
                CPF {user?.documentSource === 'order' && "• (Recuperado de pedidos)"}
              </Label>
              <MaskedInput
                mask="___.___.___-__"
                replacement={{ _: /\d/ }}
                className={cn(
                  "h-12 rounded-2xl bg-slate-50 border-transparent font-bold text-slate-700 focus:bg-white focus:border-[#D4AF37]/30 transition-all",
                  !isCpfValid && "border-red-200 bg-red-50 text-red-700"
                )}
                value={formData.document}
                disabled={!isEditing}
                placeholder="000.000.000-00"
                onChange={(e) => setFormData((p) => ({ ...p, document: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                <Phone className="h-3 w-3" /> WhatsApp
              </Label>
              <MaskedInput
                mask="(__) _____-____"
                replacement={{ _: /\d/ }}
                className="h-12 rounded-2xl bg-slate-50 border-transparent font-bold text-slate-700 focus:bg-white focus:border-[#D4AF37]/30 transition-all"
                value={formData.phone}
                disabled={!isEditing}
                placeholder="(00) 00000-0000"
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                <Cake className="h-3 w-3" /> Data de Nascimento
              </Label>
              <MaskedInput
                mask="__/__/____"
                replacement={{ _: /\d/ }}
                className="h-12 rounded-2xl bg-slate-50 border-transparent font-bold text-slate-700 focus:bg-white focus:border-[#D4AF37]/30 transition-all"
                value={formData.birthDate}
                disabled={!isEditing}
                placeholder="DD/MM/AAAA"
                onChange={(e) => setFormData((p) => ({ ...p, birthDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4 border-t border-slate-100">
        {!showPasswordForm ? (
          <Button 
            variant="outline" 
            onClick={() => setShowPasswordForm(true)} 
            className="rounded-xl border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest"
          >
            <Lock className="h-4 w-4 mr-2" /> Alterar Senha de Acesso
          </Button>
        ) : (
          <Card className="rounded-4xl border-amber-100 bg-amber-50/30 overflow-hidden animate-in slide-in-from-top-4">
            <CardHeader className="py-4 border-b border-amber-100 flex flex-row items-center justify-between">
              <CardTitle className="text-[11px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Segurança da Conta
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPasswordForm(false)} 
                className="h-8 w-8 p-0 rounded-full hover:bg-amber-100"
              >
                <X className="h-4 w-4"/>
              </Button>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-amber-700">Senha Atual</Label>
                  <Input 
                    type="password" 
                    placeholder="Sua senha de hoje" 
                    className="h-12 rounded-2xl bg-white border-amber-100 font-bold" 
                    value={passwords.current} 
                    onChange={e => setPasswords({...passwords, current: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-[10px] font-black uppercase text-amber-700">Nova Senha</Label>
                    {passwords.new && <span className={cn("text-[9px] font-black uppercase", colorClass)}>{label}</span>}
                  </div>
                  <div className="relative">
                    <Input 
                      type={showPass ? "text" : "password"} 
                      placeholder="Mínimo 6 caracteres" 
                      className="h-12 rounded-2xl bg-white border-amber-100 font-bold pr-12" 
                      value={passwords.new} 
                      onChange={e => setPasswords({...passwords, new: e.target.value})} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass(!showPass)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-300 hover:text-amber-500 transition-colors"
                    >
                      {showPass ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
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
                className="w-full h-12 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-lg active:scale-[0.98] transition-all"
              >
                {changePasswordMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Confirmar Nova Senha"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {user?.documentSource === 'order' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3 animate-in slide-in-from-bottom-2">
          <div className="bg-white p-2 rounded-full shadow-sm">
            <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-tight leading-tight">
            Notamos que seu CPF não estava no cadastro, mas o recuperamos do seu último pedido. 
            Confirme se está correto e clique em salvar para manter seus dados atualizados.
          </p>
        </div>
      )}
    </div>
  );
}