import React, { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Megaphone, Plus, PlusCircle, Pencil, Trash2, Loader2, Info, Tag, Truck, AlertTriangle, Calendar, BellRing, Users, X
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos válidos
type AnnouncementType = "INFO" | "PROMO" | "NEWS" | "DELIVERY" | "SYSTEM";
type VisibilityScope = "all" | "authenticated" | "specific_users";

interface TargetUser {
  id: string;
  name?: string | null;
  email?: string | null;
}

interface FormState {
  id?: string;
  title: string;
  content: string;
  type: AnnouncementType;
  isActive: boolean;
  startDate: string;
  endDate: string;
  iconEmoji: string;
  visibilityScope: VisibilityScope;
  selectedUsers: TargetUser[];
}

const initialFormState: FormState = {
  title: "",
  content: "",
  type: "INFO",
  isActive: true,
  startDate: "",
  endDate: "",
  iconEmoji: "",
  visibilityScope: "all",
  selectedUsers: [],
};

const typeConfig = {
  INFO: {
    label: "Comunicado",
    icon: Info,
    colorClass: "bg-blue-50 text-blue-600 border-blue-100",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
  PROMO: {
    label: "Novidades",
    icon: Tag,
    colorClass: "bg-purple-50 text-purple-600 border-purple-100",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  NEWS: {
    label: "Lançamento",
    icon: Megaphone,
    colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  DELIVERY: {
    label: "Funcionamento",
    icon: Truck,
    colorClass: "bg-amber-50 text-amber-600 border-amber-100",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  SYSTEM: {
    label: "Aviso do Sistema",
    icon: AlertTriangle,
    colorClass: "bg-rose-50 text-rose-600 border-rose-100",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
  },
};

// Converte Date ou string para YYYY-MM-DDTHH:mm para usar no input datetime-local
const toLocalDatetimeString = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Converte string datetime-local local do navegador para string ISO UTC para salvar no banco
const toUTCISOString = (dateTimeLocalStr: string | null | undefined): string | null => {
  if (!dateTimeLocalStr) return null;
  const d = new Date(dateTimeLocalStr);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const getRealStatus = (ann: any): "Inativo" | "Programado" | "Expirado" | "Ativo" => {
  if (!ann.isActive) return "Inativo";
  const now = new Date();
  if (ann.endDate && new Date(ann.endDate) < now) return "Expirado";
  if (ann.startDate && new Date(ann.startDate) > now) return "Programado";
  return "Ativo";
};

const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "Sem limite";
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const visibilityLabels: Record<VisibilityScope, string> = {
  all: "Todos",
  authenticated: "Logados",
  specific_users: "Usuarios especificos",
};

export default function AdminAnnouncements() {
  const utils = trpc.useUtils();
  const [accordionValue, setAccordionValue] = useState<string>("");
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [userSearch, setUserSearch] = useState("");
  const [announcementToDeleteId, setAnnouncementToDeleteId] = useState<string | null>(null);

  // Queries e Mutations
  const { data: announcements, isLoading } = trpc.admin.announcements.list.useQuery();
  const { data: userSearchResult, isFetching: isSearchingUsers } =
    trpc.admin.users.list.useQuery(
      { page: 1, limit: 8, search: userSearch },
      {
        enabled:
          formState.visibilityScope === "specific_users" &&
          userSearch.trim().length >= 2,
      }
    );

  const createMutation = trpc.admin.announcements.create.useMutation({
    onSuccess: () => {
      toast.success("Aviso criado com sucesso!");
      utils.admin.announcements.list.invalidate();
      utils.announcements.listActive.invalidate();
      handleDiscard();
    },
    onError: (err) => {
      toast.error("Erro ao criar aviso", { description: err.message });
    }
  });

  const updateMutation = trpc.admin.announcements.update.useMutation({
    onSuccess: () => {
      toast.success("Aviso atualizado com sucesso!");
      utils.admin.announcements.list.invalidate();
      utils.announcements.listActive.invalidate();
      handleDiscard();
    },
    onError: (err) => {
      toast.error("Erro ao atualizar aviso", { description: err.message });
    }
  });

  const deleteMutation = trpc.admin.announcements.delete.useMutation({
    onSuccess: () => {
      toast.success("Aviso excluído com sucesso!");
      utils.admin.announcements.list.invalidate();
      utils.announcements.listActive.invalidate();
    },
    onError: (err) => {
      toast.error("Erro ao excluir aviso", { description: err.message });
    }
  });

  const handleAddNew = () => {
    setFormState(initialFormState);
    setAccordionValue("announcement-form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDiscard = () => {
    setFormState(initialFormState);
    setAccordionValue("");
  };

  const handleEdit = (ann: any) => {
    setFormState({
      id: ann.id,
      title: ann.title,
      content: ann.content,
      type: ann.type as AnnouncementType,
      isActive: ann.isActive,
      startDate: ann.startDate ? toLocalDatetimeString(ann.startDate) : "",
      endDate: ann.endDate ? toLocalDatetimeString(ann.endDate) : "",
      iconEmoji: ann.iconEmoji || "",
      visibilityScope: (ann.visibilityScope || "all") as VisibilityScope,
      selectedUsers: ann.targetUsers || [],
    });
    setAccordionValue("announcement-form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleActive = (ann: any) => {
    updateMutation.mutate({
      id: ann.id,
      title: ann.title,
      content: ann.content,
      type: ann.type as AnnouncementType,
      isActive: !ann.isActive,
      startDate: ann.startDate ? new Date(ann.startDate).toISOString() : null,
      endDate: ann.endDate ? new Date(ann.endDate).toISOString() : null,
      iconEmoji: ann.iconEmoji || null,
      visibilityScope: (ann.visibilityScope || "all") as VisibilityScope,
      selectedUserIds: ann.targetUsers?.map((user: TargetUser) => user.id) || [],
    });
  };

  const handleDelete = (id: string) => {
    setAnnouncementToDeleteId(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }
    if (!formState.content.trim()) {
      toast.error("O conteúdo é obrigatório");
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Validação frontend de datas retroativas
    if (!formState.id && formState.startDate && new Date(formState.startDate) < startOfToday) {
      toast.error("A data de início não pode ser anterior ao dia atual.");
      return;
    }

    if (formState.endDate && new Date(formState.endDate) < startOfToday) {
      toast.error("A data de término não pode ser anterior ao dia atual.");
      return;
    }

    if (formState.startDate && formState.endDate && new Date(formState.endDate) < new Date(formState.startDate)) {
      toast.error("A data de término não pode ser anterior à data de início.");
      return;
    }

    // Validação de tamanho de emoji em unicode
    if (formState.iconEmoji && [...formState.iconEmoji].length > 4) {
      toast.error("O emoji do aviso deve conter no máximo 4 caracteres unicode.");
      return;
    }

    if (
      formState.visibilityScope === "specific_users" &&
      formState.selectedUsers.length === 0
    ) {
      toast.error("Selecione pelo menos um usuario para avisos especificos.");
      return;
    }

    const payload = {
      title: formState.title.trim(),
      content: formState.content.trim(),
      type: formState.type,
      isActive: formState.isActive,
      startDate: toUTCISOString(formState.startDate),
      endDate: toUTCISOString(formState.endDate),
      iconEmoji: formState.iconEmoji.trim() || null,
      visibilityScope: formState.visibilityScope,
      selectedUserIds:
        formState.visibilityScope === "specific_users"
          ? formState.selectedUsers.map((user) => user.id)
          : [],
    };

    if (formState.id) {
      updateMutation.mutate({
        ...payload,
        id: formState.id,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const userOptions = userSearchResult?.items || [];

  const handleSelectUser = (user: TargetUser) => {
    setFormState((prev) => {
      if (prev.selectedUsers.some((selected) => selected.id === user.id)) {
        return prev;
      }

      return {
        ...prev,
        selectedUsers: [...prev.selectedUsers, user],
      };
    });
    setUserSearch("");
  };

  const handleRemoveUser = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      selectedUsers: prev.selectedUsers.filter((user) => user.id !== id),
    }));
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-0 text-left">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 text-center md:text-left pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <BellRing size={18} className="animate-bounce" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">
              Marketing & Avisos
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Avisos ao <span className="text-emerald-600">Cliente</span>.
          </h1>
        </div>

        <Button
          onClick={handleAddNew}
          className="h-14 md:h-16 w-full md:w-auto px-8 rounded-4xl bg-slate-950 hover:bg-emerald-600 text-white font-black uppercase text-[10px] md:text-[11px] tracking-widest shadow-xl transition-all active:scale-95 group border-none"
        >
          <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
          Novo Aviso
        </Button>
      </header>

      {/* FORMULÁRIO (ACCORDION) */}
      <Accordion
        type="single"
        collapsible
        className="w-full border-none"
        value={accordionValue}
        onValueChange={setAccordionValue}
      >
        <AccordionItem value="announcement-form" className="border-none">
          <AccordionTrigger
            className="flex p-5 md:p-8 bg-white rounded-4xl border border-slate-100 shadow-sm hover:no-underline group transition-all"
          >
            <div className="flex items-center gap-4 text-left">
              <div className={cn(
                "h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center transition-all shrink-0 shadow-lg",
                formState.id ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
              )}>
                {formState.id ? <Pencil size={20} /> : <PlusCircle size={20} />}
              </div>
              <div className="min-w-0">
                <h2 className="text-base md:text-lg font-black uppercase tracking-tighter italic text-slate-900 leading-none truncate">
                  {formState.id ? `Editar Aviso` : "Configurar Novo Aviso"}
                </h2>
                <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {accordionValue === "announcement-form" ? "Preencha os campos abaixo" : "Clique para abrir o formulário"}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 md:pt-6">
            <form onSubmit={handleSubmit} className="bg-white p-5 md:p-10 rounded-4xl border-2 border-dashed border-slate-100 animate-in zoom-in-95 duration-500 space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* TÍTULO */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Título do Aviso
                  </Label>
                  <Input
                    id="title"
                    className="h-12 md:h-14 rounded-2xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    placeholder="Ex: Horário especial de feriado"
                    value={formState.title}
                    onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                    disabled={isPending}
                  />
                </div>

                {/* CONTEÚDO */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="content" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Conteúdo
                  </Label>
                  <Textarea
                    id="content"
                    className="min-h-32 rounded-2xl bg-slate-50 border-none font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all p-4"
                    placeholder="Escreva a mensagem detalhada para o cliente..."
                    value={formState.content}
                    onChange={(e) => setFormState(prev => ({ ...prev, content: e.target.value }))}
                    disabled={isPending}
                  />
                </div>

                {/* TIPO */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Categoria
                  </Label>
                  <Select
                    value={formState.type}
                    onValueChange={(val) => setFormState(prev => ({ ...prev, type: val as AnnouncementType }))}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-12 md:h-14 rounded-2xl bg-slate-50 border-none font-black uppercase text-[10px]">
                      <SelectValue placeholder="Escolha um tipo" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 font-black uppercase text-[10px]">
                      <SelectItem value="INFO">Comunicado (Info)</SelectItem>
                      <SelectItem value="PROMO">Novidades (Promo)</SelectItem>
                      <SelectItem value="NEWS">Lançamento (News)</SelectItem>
                      <SelectItem value="DELIVERY">Funcionamento (Delivery)</SelectItem>
                      <SelectItem value="SYSTEM">Aviso de Sistema (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* STATUS */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Status Inicial
                  </Label>
                  <Select
                    value={formState.isActive ? "true" : "false"}
                    onValueChange={(val) => setFormState(prev => ({ ...prev, isActive: val === "true" }))}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-12 md:h-14 rounded-2xl bg-slate-50 border-none font-black uppercase text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 font-black uppercase text-[10px]">
                      <SelectItem value="true">Ativo (Exibindo se no período)</SelectItem>
                      <SelectItem value="false">Pausado (Inativo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* DATA INICIAL */}
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Exibir a partir de (Opcional)
                  </Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    min={formState.id ? undefined : toLocalDatetimeString(new Date())}
                    className="h-12 md:h-14 rounded-2xl bg-slate-50 border-none font-black text-slate-600"
                    value={formState.startDate}
                    onChange={(e) => setFormState(prev => ({ ...prev, startDate: e.target.value }))}
                    disabled={isPending}
                  />
                </div>

                {/* DATA FINAL */}
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Remover de exibição após (Opcional)
                  </Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    min={formState.startDate || toLocalDatetimeString(new Date())}
                    className="h-12 md:h-14 rounded-2xl bg-slate-50 border-none font-black text-slate-600"
                    value={formState.endDate}
                    onChange={(e) => setFormState(prev => ({ ...prev, endDate: e.target.value }))}
                    disabled={isPending}
                  />
                </div>

                {/* EMOJI DE ÍCONE */}
                <div className="md:col-span-2 space-y-2 text-left">
                  <Label htmlFor="iconEmoji" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Emoji do Aviso (Opcional - Ícone Visual)
                  </Label>
                  <div className="flex flex-col gap-3">
                    <Input
                      id="iconEmoji"
                      maxLength={16}
                      className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all w-full sm:w-40"
                      placeholder="Ex: 📢"
                      value={formState.iconEmoji}
                      onChange={(e) => setFormState(prev => ({ ...prev, iconEmoji: e.target.value }))}
                      disabled={isPending}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-1">Sugestões rápidas:</span>
                      {[
                        { emoji: "📢", label: "Comunicado" },
                        { emoji: "🎂", label: "Aniversário" },
                        { emoji: "🎁", label: "Promoção" },
                        { emoji: "🚚", label: "Entrega" },
                        { emoji: "⚠️", label: "Importante" },
                        { emoji: "🥗", label: "Cardápio" },
                        { emoji: "⭐", label: "Novidade" },
                      ].map((item) => (
                        <button
                          key={item.emoji}
                          type="button"
                          onClick={() => setFormState(prev => ({ ...prev, iconEmoji: item.emoji }))}
                          className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1"
                        >
                          <span>{item.emoji}</span>
                          <span className="text-[9px] font-semibold opacity-70">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    Opcional. Máximo de 4 caracteres unicode. Se vazio, o sistema usará o ícone padrão da categoria.
                  </p>
                </div>

                <div className="md:col-span-2 space-y-4 text-left rounded-3xl border border-slate-100 bg-slate-50/60 p-5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Publico do aviso
                    </Label>
                  </div>

                  <Select
                    value={formState.visibilityScope}
                    onValueChange={(val) =>
                      setFormState((prev) => ({
                        ...prev,
                        visibilityScope: val as VisibilityScope,
                        selectedUsers:
                          val === "specific_users" ? prev.selectedUsers : [],
                      }))
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-12 md:h-14 rounded-2xl bg-white border-none font-black uppercase text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 font-black uppercase text-[10px]">
                      <SelectItem value="all">
                        Todos os visitantes/clientes
                      </SelectItem>
                      <SelectItem value="authenticated">
                        Apenas clientes logados
                      </SelectItem>
                      <SelectItem value="specific_users">
                        Usuarios especificos
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {formState.visibilityScope === "specific_users" && (
                    <div className="space-y-3">
                      <Input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Buscar usuario por nome, email ou ID"
                        className="h-12 rounded-2xl bg-white border-none font-bold text-sm"
                        disabled={isPending}
                      />

                      {userSearch.trim().length >= 2 && (
                        <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
                          {isSearchingUsers ? (
                            <div className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Buscando usuarios...
                            </div>
                          ) : userOptions.length === 0 ? (
                            <div className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Nenhum usuario encontrado
                            </div>
                          ) : (
                            userOptions.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => handleSelectUser(user)}
                                className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-b-0"
                              >
                                <span className="block text-xs font-black text-slate-800">
                                  {user.name || user.email || user.id}
                                </span>
                                <span className="block text-[10px] font-bold text-slate-400">
                                  {user.email || user.id}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {formState.selectedUsers.map((user) => (
                          <span
                            key={user.id}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 border border-slate-100"
                          >
                            {user.name || user.email || user.id}
                            <button
                              type="button"
                              onClick={() => handleRemoveUser(user.id)}
                              className="text-slate-400 hover:text-rose-600"
                              aria-label="Remover usuario"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* AÇÕES FORMULÁRIO */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDiscard}
                  className="w-full sm:w-auto h-12 md:h-14 rounded-xl font-black uppercase text-[10px] text-slate-400 border-none hover:bg-slate-50"
                  disabled={isPending}
                >
                  Descartar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto h-12 md:h-14 px-10 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all border-none"
                >
                  {isPending ? (
                    <Loader2 className="animate-spin mr-2" size={18} />
                  ) : (
                    formState.id ? "Salvar Alterações" : "Salvar Aviso"
                  )}
                </Button>
              </div>

            </form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* LISTA DE AVISOS */}
      <section className="space-y-6 md:space-y-8">
        <div className="flex items-center gap-4">
           <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 whitespace-nowrap italic">
             Avisos Cadastrados
           </h2>
           <div className="w-full border-t border-slate-100" />
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
             <Loader2 className="animate-spin text-emerald-500" size={32} />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscando avisos...</p>
          </div>
        ) : !announcements || announcements.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-4xl border border-slate-100 p-8 shadow-sm">
             <Megaphone className="h-10 w-10 text-slate-200 mx-auto mb-4" />
             <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Nenhum aviso cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((ann) => {
              const config = typeConfig[ann.type as AnnouncementType] || typeConfig.INFO;
              const Icon = config.icon;
              const realStatus = getRealStatus(ann);

              const statusBadgeColors = {
                Inativo: "bg-slate-100 text-slate-600 border-slate-200",
                Programado: "bg-blue-50 text-blue-700 border-blue-100",
                Expirado: "bg-rose-50 text-rose-700 border-rose-100",
                Ativo: "bg-emerald-50 text-emerald-700 border-emerald-100",
              };

              return (
                <Card
                  key={ann.id}
                  className="bg-white rounded-4xl p-6 shadow-sm border border-slate-50 group hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Badge e Ações */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                          config.badgeClass
                        )}>
                          {config.label}
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            realStatus === "Ativo" ? "bg-emerald-500" :
                            realStatus === "Programado" ? "bg-blue-500" :
                            realStatus === "Expirado" ? "bg-rose-500" : "bg-slate-300"
                          )} />
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border",
                            statusBadgeColors[realStatus]
                          )}>
                            {realStatus}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border bg-slate-50 text-slate-500 border-slate-100">
                            {visibilityLabels[(ann.visibilityScope || "all") as VisibilityScope]}
                            {(ann.selectedUserCount || 0) > 0
                              ? ` (${ann.selectedUserCount})`
                              : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl bg-slate-50 text-slate-500 hover:text-white hover:bg-slate-900 transition-all border-none"
                          onClick={() => handleEdit(ann)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl bg-red-50 text-red-500 hover:text-white hover:bg-red-600 transition-all border-none"
                          onClick={() => handleDelete(ann.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    {/* Título e Conteúdo */}
                    <div className="space-y-2 text-left">
                      <h3 className="font-black text-lg md:text-xl uppercase italic tracking-tighter text-slate-900 leading-snug line-clamp-1 flex items-center gap-2">
                        {ann.iconEmoji && <span className="not-italic mr-1 text-2xl">{ann.iconEmoji}</span>}
                        {ann.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">
                        {ann.content}
                      </p>
                    </div>
                  </div>

                  {/* Datas e Botão Rápido de Ativação */}
                  <div className="border-t border-slate-50 pt-4 mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                        <Calendar size={11} />
                        <span>Início: {formatDate(ann.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                        <Calendar size={11} />
                        <span>Fim: {formatDate(ann.endDate)}</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className={cn(
                        "h-8 rounded-xl px-4 text-[9px] font-black uppercase tracking-widest text-white transition-all shadow-sm border-none",
                        ann.isActive ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                      )}
                      onClick={() => handleToggleActive(ann)}
                    >
                      {ann.isActive ? "Desativar" : "Ativar"}
                    </Button>
                  </div>

                </Card>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={announcementToDeleteId !== null}
        title="Excluir Aviso"
        description="Deseja realmente excluir este aviso?"
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        destructive={true}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (announcementToDeleteId) {
            deleteMutation.mutate({ id: announcementToDeleteId });
            setAnnouncementToDeleteId(null);
          }
        }}
        onCancel={() => setAnnouncementToDeleteId(null)}
      />
    </div>
  );
}
