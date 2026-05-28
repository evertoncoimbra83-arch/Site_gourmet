// pages/nutri/components/Dashboard/ClientList.tsx
import React, { useState } from "react";
import { 
  User as UserIcon, 
  Loader2, 
  ChevronDown, 
  Plus, 
  Edit3, 
  Trash2, 
  FileText,
  Users,
  Search,
  Copy,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Prescription {
  id: string;
  planName: string;
  createdAt: string | Date;
  status: string;
}

interface ClientListItem {
  id: string;
  client: Client;
  prescriptions: Prescription[];
}

interface ClientListProps {
  clients: ClientListItem[] | undefined;
  isLoading: boolean;
  onOpen: (id: string, name: string, diet: Prescription | null) => void;
  onDeletePrescription?: (id: string) => void;
}

export function ClientList({ clients, isLoading, onOpen, onDeletePrescription }: ClientListProps) {
  const utils = trpc.useUtils();
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Novo Paciente
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  // Modal Confirmação de Transferência
  const [isConfirmTransferOpen, setIsConfirmTransferOpen] = useState(false);
  const [conflictClientData, setConflictClientData] = useState<{ id: string; name: string; email: string } | null>(null);

  // Modal Duplicar Dieta
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState<string | null>(null);
  const [currentPrescriptionOwnerId, setCurrentPrescriptionOwnerId] = useState<string | null>(null);

  // tRPC Mutations
  const createOrLinkClient = trpc.nutri.createOrLinkClient.useMutation({
    onSuccess: (data) => {
      if (data.status === "REQUIRES_CONFIRMATION") {
        setConflictClientData({
          id: data.client.id,
          name: data.client.name,
          email: data.client.email
        });
        setIsConfirmTransferOpen(true);
        setIsAddModalOpen(false);
      } else if (data.status === "ALREADY_LINKED") {
        toast.info("Este paciente já está cadastrado e vinculado ao seu consultório.");
        setIsAddModalOpen(false);
        setNewClientName("");
        setNewClientPhone("");
        setNewClientEmail("");
      } else {
        toast.success(
          data.status === "CREATED" 
            ? "Novo paciente cadastrado e vinculado com sucesso!" 
            : "Paciente vinculado com sucesso!"
        );
        setIsAddModalOpen(false);
        setNewClientName("");
        setNewClientPhone("");
        setNewClientEmail("");
        utils.nutri.getMyClients.invalidate();
      }
    },
    onError: (err) => {
      toast.error(`Erro ao cadastrar paciente: ${err.message}`);
    }
  });

  const duplicatePrescription = trpc.nutri.duplicatePrescription.useMutation({
    onSuccess: (data) => {
      toast.success("Dieta duplicada com sucesso! " + data.message);
      setIsDuplicateModalOpen(false);
      setCurrentPrescriptionId(null);
      setCurrentPrescriptionOwnerId(null);
      utils.nutri.getMyClients.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao duplicar dieta: ${err.message}`);
    }
  });

  const handleAddSubmit = () => {
    if (!newClientName.trim() || !newClientPhone.trim()) {
      toast.error("Nome Completo e Telefone/WhatsApp são obrigatórios.");
      return;
    }
    createOrLinkClient.mutate({
      name: newClientName.trim(),
      phone: newClientPhone.trim(),
      email: newClientEmail.trim() || null,
      forceTransfer: false
    });
  };

  const handleConfirmTransferSubmit = () => {
    if (!conflictClientData) return;
    createOrLinkClient.mutate({
      name: newClientName.trim() || conflictClientData.name,
      phone: newClientPhone.trim(),
      email: newClientEmail.trim() || null,
      forceTransfer: true
    });
    setIsConfirmTransferOpen(false);
    setConflictClientData(null);
  };

  const handleDuplicateSubmit = (targetClientId: string) => {
    if (!currentPrescriptionId) return;
    duplicatePrescription.mutate({
      prescriptionId: currentPrescriptionId,
      targetClientId
    });
  };

  const handleOpenDuplicateDialog = (prescId: string, ownerId: string) => {
    setCurrentPrescriptionId(prescId);
    setCurrentPrescriptionOwnerId(ownerId);
    setIsDuplicateModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-20 flex justify-center w-full">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  // Filtragem local
  const filteredClients = (clients || []).filter((item) => {
    if (!item.client) return false;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const name = (item.client.name || "").toLowerCase();
    const email = (item.client.email || "").toLowerCase();
    const phone = (item.client.phone || "").toLowerCase();
    return name.includes(term) || email.includes(term) || phone.includes(term);
  });
  
  const isLinkingPending = createOrLinkClient.isPending;
  const isDuplicatingPending = duplicatePrescription.isPending;

  return (
    <div className="space-y-4 text-left">
      {/* BARRA DE PESQUISA E CADASTRO */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar paciente por nome, telefone ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 hover:border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl text-sm font-bold text-slate-700 outline-none transition-all shadow-sm"
          />
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full md:w-auto h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 shrink-0"
        >
          <Plus size={16} strokeWidth={3} />
          Novo Paciente
        </button>
      </div>

      {filteredClients.length === 0 ? (
        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-4xl bg-white/50">
          <Users className="mx-auto text-slate-300 mb-4" size={40} />
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            {searchTerm ? "Nenhum paciente corresponde à busca." : "Nenhum paciente vinculado."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClients.map((item) => {
            if (!item.client) return null;
            const isExpanded = expandedClientId === item.client.id;
            
            const prescriptionsArray = Array.isArray(item.prescriptions) ? item.prescriptions : [];
            const slots = [0, 1, 2, 3].map(i => prescriptionsArray[i] || null);

            const displayEmail = item.client.email?.endsWith("@gourmetsaudavel.temp") ? "" : item.client.email;

            return (
              <div 
                key={item.id} 
                className={cn(
                  "bg-white rounded-3xl border-2 transition-all overflow-hidden",
                  isExpanded ? "border-emerald-200 shadow-xl" : "border-slate-100 shadow-sm"
                )}
              >
                {/* HEADER */}
                <div 
                  onClick={() => setExpandedClientId(isExpanded ? null : item.client.id)}
                  className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-colors",
                      isExpanded ? "bg-emerald-500 text-white border-emerald-400" : "bg-slate-50 text-slate-400 border-slate-100"
                    )}>
                      <UserIcon size={24} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-black text-lg text-slate-800 uppercase italic leading-none">
                        {item.client.name}
                      </h4>
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mt-1.5">
                        {displayEmail && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">
                            {displayEmail}
                          </span>
                        )}
                        {item.client.phone && (
                          <span className="text-[9px] font-bold text-emerald-500 uppercase block">
                            {item.client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={cn("transition-transform duration-300", isExpanded && "rotate-180")}>
                      <ChevronDown size={20} className="text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* CONTEÚDO EXPANSÍVEL */}
                {isExpanded && (
                  <div className="p-6 pt-0 border-t-2 border-slate-50 bg-slate-50/30 space-y-4">
                    <div className="flex items-center gap-2 pt-4">
                       <FileText size={12} className="text-slate-400" />
                       <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-left">
                         Slots de Prescrição (Máximo 4)
                       </span>
                    </div>

                    {/* GRID FORÇADO: grid-cols-2 no mobile, grid-cols-4 no desktop */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                      {slots.map((p, index) => (
                        p ? (
                          <div 
                            key={p.id} 
                            className="flex flex-col justify-between p-4 bg-white rounded-2xl border-2 border-slate-100 group hover:border-emerald-300 transition-all shadow-sm h-36 text-left"
                          >
                            <div className="text-left">
                              <div className={cn(
                                "h-1.5 w-6 rounded-full mb-2",
                                p.status === 'active' ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-slate-300"
                              )} />
                              <p className="font-black uppercase italic text-[10px] text-slate-700 leading-tight line-clamp-2">
                                {p.planName}
                              </p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                                {new Date(p.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button 
                                onClick={() => onOpen(item.client.id, item.client.name, p)} 
                                title="Editar"
                                className="flex-1 h-8 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg text-slate-600 flex items-center justify-center transition-all"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                onClick={() => handleOpenDuplicateDialog(p.id, item.client.id)}
                                title="Duplicar Dieta"
                                className="h-8 w-8 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg text-slate-600 flex items-center justify-center transition-all"
                              >
                                <Copy size={14} />
                              </button>
                              <button 
                                onClick={() => onDeletePrescription?.(p.id)} 
                                title="Excluir"
                                className="h-8 w-8 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg text-red-500 flex items-center justify-center transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            key={`empty-${index}`}
                            onClick={() => onOpen(item.client.id, item.client.name, null)}
                            className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 text-slate-300 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all h-36 group"
                          >
                            <div className="h-8 w-8 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                              <Plus size={16} strokeWidth={3} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-tighter">Vazio</span>
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CADASTRAR PACIENTE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-8 max-w-md w-full shadow-2xl space-y-6 text-left animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">
                  Cadastrar Novo Paciente
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Preencha os dados do consultório
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Completo *</label>
                <input 
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none transition-all"
                  placeholder="Nome do Paciente"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telefone/WhatsApp *</label>
                <input 
                  value={newClientPhone}
                  onChange={e => setNewClientPhone(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail (Opcional)</label>
                <input 
                  value={newClientEmail}
                  onChange={e => setNewClientEmail(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none transition-all"
                  placeholder="paciente@exemplo.com"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="h-12 px-6 rounded-xl font-black uppercase text-[10px] text-slate-400 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddSubmit}
                disabled={isLinkingPending}
                className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
              >
                {isLinkingPending && <Loader2 className="animate-spin" size={14} />}
                Cadastrar Paciente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO DE TRANSFERÊNCIA DE VÍNCULO */}
      {isConfirmTransferOpen && conflictClientData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-red-100 p-8 max-w-md w-full shadow-2xl space-y-6 text-left animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-red-600">
                Atenção: Vínculo Ativo
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Paciente já associado a outro profissional
              </p>
            </div>
            <div className="p-5 bg-red-50/50 rounded-2xl border border-red-100">
              <p className="text-xs text-red-800 font-medium leading-relaxed">
                Este paciente já possui vínculo ativo com outro nutricionista no sistema.
                Deseja assumir o vínculo deste paciente e migrar o acompanhamento dele para o seu consultório?
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => {
                  setIsConfirmTransferOpen(false);
                  setConflictClientData(null);
                }}
                className="h-12 px-6 rounded-xl font-black uppercase text-[10px] text-slate-400 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmTransferSubmit}
                disabled={isLinkingPending}
                className="h-12 px-8 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
              >
                {isLinkingPending && <Loader2 className="animate-spin" size={14} />}
                Assumir Vínculo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELEÇÃO DE DESTINO PARA DUPLICAR DIETA */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-8 max-w-md w-full shadow-2xl space-y-6 text-left animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">
                  Duplicar Dieta
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Selecione o paciente de destino
                </p>
              </div>
              <button onClick={() => setIsDuplicateModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-2xl divide-y divide-slate-100 custom-scrollbar">
              {clients?.filter(c => c.client.id !== currentPrescriptionOwnerId).map(c => {
                const cleanEmail = c.client.email?.endsWith("@gourmetsaudavel.temp") ? "" : c.client.email;
                return (
                  <button
                    key={c.client.id}
                    onClick={() => handleDuplicateSubmit(c.client.id)}
                    disabled={isDuplicatingPending}
                    className="w-full text-left p-4 hover:bg-emerald-50 transition-colors flex items-center justify-between group"
                  >
                    <span className="font-bold text-sm text-slate-700 group-hover:text-emerald-800 transition-colors">{c.client.name}</span>
                    {cleanEmail && (
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{cleanEmail}</span>
                    )}
                  </button>
                );
              })}
              {clients?.filter(c => c.client.id !== currentPrescriptionOwnerId).length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase">
                  Nenhum outro paciente disponível.
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setIsDuplicateModalOpen(false)}
                className="h-12 px-6 rounded-xl font-black uppercase text-[10px] text-slate-400 hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}