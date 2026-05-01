import React, { useState, useMemo, useEffect } from "react";
import { trpc } from "@/_core/trpc"; 
import { 
  Plus, 
  Search, 
  UserCheck, 
  UserMinus, 
  Edit2, 
  TrendingUp, 
  X,
  ShieldCheck,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";

// --- INTERFACES DE TIPAGEM ---
interface ReferralPartner {
  id: string;
  code: string;
  name: string;
  type?: string;
  commissionRate: string | number;
  isActive: boolean;
  notes?: string | null;
  totalSales?: number;
  revenue?: number;
  commissionToPay?: number;
}

interface ReferralDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  partner: ReferralPartner | null;
  onSuccess: () => void;
}

// --- COMPONENTE: DRAWER LATERAL ---
const ReferralDrawer = ({ isOpen, onClose, partner, onSuccess }: ReferralDrawerProps) => {
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    id: null as string | null,
    code: "",
    name: "",
    type: "nutri",
    commissionRate: "0.00",
    isActive: true,
    notes: ""
  });

  useEffect(() => {
    if (isOpen) {
      if (partner) {
        setFormData({
          id: partner.id,
          code: partner.code,
          name: partner.name,
          type: partner.type || "nutri",
          commissionRate: String(partner.commissionRate || "0.00"),
          isActive: partner.isActive ?? true,
          notes: partner.notes || ""
        });
      } else {
        setFormData({ id: null, code: "", name: "", type: "nutri", commissionRate: "0.00", isActive: true, notes: "" });
      }
    }
    setCopied(false);
  }, [isOpen, partner]);

  const upsert = trpc.admin.referral.upsertPartner.useMutation({
    onSuccess: () => {
      toast.success("Registro salvo com sucesso!");
      onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error("Erro ao salvar: " + err.message);
    }
  });

  const copyReferralLink = () => {
    if (!formData.code) return;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}?ref=${formData.code}`;
    
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-150 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <div 
        className={cn(
          "fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-160 transition-transform duration-500 ease-in-out transform flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <ShieldCheck size={20} />
            </div>
            <div className="leading-none text-left">
              <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">
                {partner ? 'Editar Parceiro' : 'Novo Registro'}
              </p>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Configuração de Ref</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar text-left">
          <div className="space-y-6">
            
            {formData.code.length >= 3 && (
              <div className="p-5 bg-emerald-50 rounded-[2rem] border border-emerald-100 space-y-3 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-emerald-700 uppercase italic">Link de Divulgação</span>
                  <ExternalLink size={12} className="text-emerald-400" />
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-emerald-100 shadow-sm">
                  <code className="flex-1 text-[10px] font-bold text-emerald-800 truncate pl-2 lowercase">
                    ?ref={formData.code}
                  </code>
                  <button 
                    onClick={copyReferralLink}
                    className={cn(
                      "p-2.5 rounded-xl transition-all",
                      copied ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                    )}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Código Identificador</label>
              <input 
                placeholder="EX: NUTRI10"
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 uppercase focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s/g, '')})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nome / Razão Social</label>
              <input 
                placeholder="Nome completo do parceiro"
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Comissão %</label>
                <input 
                  type="number"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none"
                  value={formData.commissionRate}
                  onChange={e => setFormData({...formData, commissionRate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Categoria</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none appearance-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="nutri">Nutricionista</option>
                  <option value="influencer">Influenciador</option>
                  <option value="academy">Academia</option>
                  <option value="partner">Parceiro Comercial</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <MessageSquare size={12} /> Notas Internas
              </label>
              <textarea 
                placeholder="Detalhes da parceria..."
                rows={3}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all resize-none outline-none"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="p-5 bg-slate-50 rounded-[2rem] flex items-center justify-between border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter italic">Status da Parceria</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Permitir uso do código</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    formData.isActive ? "bg-emerald-500" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    formData.isActive ? "left-7" : "left-1"
                  )} />
                </button>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 bg-white">
          <button 
            type="button"
            disabled={upsert.isPending}
            onClick={() => {
              // ✅ FIX: Usando Parameters para capturar a tipagem correta da mutação sem 'any'
              type UpsertParams = Parameters<typeof upsert.mutate>[0];
              upsert.mutate(formData as unknown as UpsertParams);
            }}
            className="w-full bg-slate-900 text-white p-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 disabled:opacity-50"
          >
            {upsert.isPending ? <Loader2 className="animate-spin" size={16} /> : <TrendingUp size={16} />} 
            {partner ? 'Atualizar Parceiro' : 'Salvar Novo Parceiro'}
          </button>
        </div>
      </div>
    </>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function AdminReferral() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<ReferralPartner | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const utils = trpc.useUtils();
  const { data: partners, isLoading } = trpc.admin.referral.listPartners.useQuery();
  const { data: performance } = trpc.admin.referral.getPerformance.useQuery();

  const partnersWithStats = useMemo(() => {
    if (!partners) return [];
    
    // ✅ FIX: Cast para unknown primeiro para garantir compatibilidade estrutural
    const rawPartners = partners as unknown as ReferralPartner[];
    
    return rawPartners.map(partner => {
      const stats = performance?.find(p => p.referralCode === partner.code);
      const revenue = Number(stats?.revenue || 0);
      const commission = (revenue * Number(partner.commissionRate)) / 100;
      return { 
        ...partner, 
        totalSales: stats?.totalSales || 0, 
        revenue, 
        commissionToPay: commission 
      };
    });
  }, [partners, performance]);

  const filteredPartners = partnersWithStats.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">Parcerias & Ref</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Gestão de indicações e performance financeira.</p>
        </div>
        <button 
          type="button"
          onClick={() => { setSelectedPartner(null); setIsDrawerOpen(true); }}
          className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] flex items-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 shadow-2xl transition-all active:scale-95"
        >
          <Plus size={18} /> Novo Parceiro
        </button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
          <Search size={18} className="text-slate-300" />
          <input 
            placeholder="BUSCAR PARCEIRO OU CÓDIGO..." 
            className="flex-1 bg-transparent outline-none font-bold text-slate-600 uppercase text-[10px] tracking-widest"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">
              <tr>
                <th className="px-10 py-6 italic text-left">Parceiro</th>
                <th className="px-10 py-6 text-left">Status</th>
                <th className="px-10 py-6 text-left">Vendas</th>
                <th className="px-10 py-6 text-emerald-600 text-left">Total Gerado</th>
                <th className="px-10 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                   <td colSpan={5} className="p-20 text-center">
                      <Loader2 className="animate-spin mx-auto text-slate-200" size={40} />
                   </td>
                </tr>
              ) : filteredPartners.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-10 py-6 text-left">
                    <div className="font-black text-slate-900 uppercase italic text-sm">{p.name}</div>
                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">{p.code}</div>
                  </td>
                  <td className="px-10 py-6 text-left">
                    <span className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase italic tracking-tighter",
                      p.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-400"
                    )}>
                      {p.isActive ? <UserCheck size={12}/> : <UserMinus size={12}/>}
                      {p.isActive ? 'Ativo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="px-10 py-6 font-bold text-slate-400 text-xs text-left">
                    {p.totalSales} Pedidos
                  </td>
                  <td className="px-10 py-6 font-black text-slate-900 text-sm italic text-left">
                    {(p.revenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      type="button"
                      onClick={() => { setSelectedPartner(p); setIsDrawerOpen(true); }}
                      className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ReferralDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        partner={selectedPartner}
        onSuccess={() => utils.admin.referral.listPartners.invalidate()}
      />
    </div>
  );
}