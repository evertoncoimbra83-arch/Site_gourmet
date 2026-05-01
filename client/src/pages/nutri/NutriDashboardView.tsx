// client/src/pages/nutri/NutriDashboardView.tsx

import React, { useState, useMemo, ComponentProps } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import { Loader2, UserCircle } from "lucide-react";

import { DashboardHeader } from "./components/Dashboard/DashboardHeader";
import { ReferralCard } from "./components/Dashboard/ReferralCard";
import { TemplateList } from "./components/Dashboard/TemplateList";
import { ClientList } from "./components/Dashboard/ClientList";
import NutriProfilePage from "./NutriProfile";
import PrescriptionDrawer from "./components/PrescriptionDrawer";

// --- TIPAGENS E INTERFACES ---

type PrescriptionType = ComponentProps<typeof PrescriptionDrawer>["currentPrescription"];

// ✅ Interface para Bypass de Tipagem (Sync com o router nutri)
interface NutriRouterApi {
  deletePrescription: { 
    useMutation: (opts: Record<string, unknown>) => { mutate: (data: { id: string | number }) => void } 
  };
  deleteTemplate: { 
    useMutation: (opts: Record<string, unknown>) => { mutate: (data: { templateId: string | number }) => void } 
  };
}

export default function NutriDashboardView() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  
  const [activeTab, setActiveTab] = useState<"clients" | "templates" | "history" | "profile">("clients");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isPrescriptionDrawerOpen, setIsPrescriptionDrawerOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedClientName, setSelectedClientName] = useState<string>("");
  const [currentDiet, setCurrentDiet] = useState<PrescriptionType>(null);
  
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<PrescriptionType>(null);
  
  // ✅ Cast seguro para evitar o uso de 'any' conforme regra do ESLint
  const nutriApi = (trpc.nutri as unknown as NutriRouterApi);

  // Queries
  const { data: profile, isLoading: lp } = trpc.nutri.getPublicProfile.useQuery(undefined, { enabled: !!user?.id });
  const { data: clients, isLoading: lc } = trpc.nutri.getMyClients.useQuery(undefined, { enabled: !!user?.id, staleTime: 0 });
  const { data: templates, isLoading: lt } = trpc.nutri.getMyTemplates.useQuery(undefined, { enabled: !!user?.id });

  const referralLink = useMemo(() => {
    if (!profile?.referralCode) return "";
    return `${window.location.origin}/convite/${profile.referralCode}`;
  }, [profile]);

  // Mutations
  const updateNutriCode = trpc.nutri.updateProfile.useMutation({ 
    onSuccess: () => { 
      toast.success("Código atualizado!"); 
      utils.nutri.getPublicProfile.invalidate(); 
    },
    onError: (err) => toast.error(err.message)
  });

  const deletePrescription = nutriApi.deletePrescription.useMutation({
    onSuccess: () => {
      toast.success("Prescrição removida");
      utils.nutri.getMyClients.invalidate();
    }
  });

  const deleteTemplate = nutriApi.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Modelo removido");
      utils.nutri.getMyTemplates.invalidate();
    }
  });

  if (loading || lp) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-emerald-600" size={40} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-6 animate-in fade-in duration-700 text-left">
      <DashboardHeader 
        activeTab={activeTab === "profile" ? "clients" : activeTab as "clients" | "templates" | "history"} 
        setActiveTab={(tab) => setActiveTab(tab as "clients" | "templates" | "history" | "profile")} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onCreateTemplate={() => { 
            if (activeTab === "clients") {
                toast.info("Para criar uma dieta, clique no botão de lápis ao lado do paciente na lista abaixo.");
            }
            if (activeTab === "templates") {
                setCurrentTemplate(null);
                setIsTemplateDrawerOpen(true);
            }
        }} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-6">
            <ReferralCard 
              activeCode={profile?.referralCode || ""} 
              referralLink={referralLink} 
              onUpdateCode={(code: string) => {
                if (!profile) return toast.error("Perfil não carregado");
                
                updateNutriCode.mutate({
                  name: profile.user?.name || "Nutricionista",
                  crn: profile.crn || "00000",
                  specialty: profile.specialty || "",
                  bio: profile.bio || "",
                  offices: (profile.offices || []).map(o => ({
                    label: o.label || "",
                    zipCode: o.zipCode || "",
                    street: o.street || "",
                    number: o.number || "",
                    city: o.city || ""
                  })),
                  referralCode: code, 
                });
              }} 
            />
            
            {activeTab !== "profile" && (
                <button 
                    onClick={() => setActiveTab("profile")}
                    className="w-full p-4 bg-white border border-slate-200 rounded-3xl flex items-center gap-3 hover:border-emerald-500 transition-all group"
                >
                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 transition-colors">
                        <UserCircle size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Configurar Perfil</span>
                </button>
            )}
        </div>
        
        <main className="lg:col-span-3">
          {activeTab === "clients" && (
            <ClientList 
              clients={(clients || []) as unknown as ComponentProps<typeof ClientList>['clients']} 
              isLoading={lc} 
              onOpen={(id, name, diet) => {
                setSelectedClientId(id);
                setSelectedClientName(name);
                setCurrentDiet((diet as unknown) as PrescriptionType);
                setIsPrescriptionDrawerOpen(true);
              }}
              onDeletePrescription={(id) => {
                if(confirm("Deseja apagar esta prescrição?")) {
                    deletePrescription.mutate({ id });
                }
              }}
            />
          )}

          {activeTab === "templates" && (
            <TemplateList 
              templates={(templates || []) as unknown as ComponentProps<typeof TemplateList>['templates']} 
              isLoading={lt} 
              onEdit={(template) => {
                setCurrentTemplate((template as unknown) as PrescriptionType);
                setIsTemplateDrawerOpen(true);
              }} 
              onDelete={(id: string) => {
                if(confirm("Excluir modelo?")) {
                    deleteTemplate.mutate({ templateId: id });
                }
              }} 
              onCreate={() => {
                setCurrentTemplate(null);
                setIsTemplateDrawerOpen(true);
              }} 
            />
          )}

          {activeTab === "history" && (
            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-4xl bg-white/50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
              Em breve: Histórico de evoluções
            </div>
          )}

          {activeTab === "profile" && (
            <div className="animate-in slide-in-from-right-4 duration-500">
               <NutriProfilePage />
            </div>
          )}
        </main>
      </div>

      <PrescriptionDrawer 
        isOpen={isPrescriptionDrawerOpen} 
        onClose={() => {
          setIsPrescriptionDrawerOpen(false);
          setCurrentDiet(null);
        }} 
        clientId={selectedClientId}
        clientName={selectedClientName}
        currentPrescription={currentDiet}
        isTemplateMode={false}
      />

      <PrescriptionDrawer 
        isOpen={isTemplateDrawerOpen} 
        onClose={() => {
          setIsTemplateDrawerOpen(false);
          setCurrentTemplate(null);
        }} 
        clientId=""
        clientName="Modelo da Biblioteca"
        currentPrescription={currentTemplate}
        isTemplateMode={true}
      />

    </div>
  );
}