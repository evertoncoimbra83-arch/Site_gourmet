// e:/IA/projects/Site_React/client/src/pages/adminNutri/view/adminNutriDrawer.tsx

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@/_core/trpc';
import { appToast as toast } from "@/lib/app-toast";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from "@/components/ui/sheet";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Loader2, Mail, Save, MapPin } from 'lucide-react'; 
import { cn } from '@/lib/utils';

// --- INTERFACES ---

interface NutriData {
  id: string;
  userId: string;
  crn: string;
  specialty: string | null;
  referralCode: string | null;
  isActive: boolean | null;
  name: string;
  email: string | null;
}

// ✅ Interface adicionada para resolver o erro 'any'
interface PatientData {
  id: string;
  name: string;
  email: string | null;
}

interface AddressData {
  id: string;
  label: string | null;
  street: string | null;
  number: string | null;
  complement?: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  isDefault: number | boolean | null;
}

const updateSchema = z.object({
  crn: z.string().min(2, "CRN é obrigatório"),
  specialty: z.string().min(2, "Especialidade é obrigatória"),
});

type UpdateForm = z.infer<typeof updateSchema>;

interface Props {
  nutri: NutriData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminNutriDrawer({ nutri, isOpen, onClose }: Props) {
  const utils = trpc.useUtils(); // ✅ Atualizado para useUtils (padrão v10+)

  const { data: patients, isLoading: isLoadingPatients } = trpc.admin.nutris.getLinkedUsers.useQuery(
    { referralCode: nutri?.referralCode ?? "" },
    { enabled: isOpen && !!nutri?.referralCode }
  );

  const { data: addresses, isLoading: isLoadingAddr } = trpc.admin.nutris.getDetails.useQuery(
    { nutriId: nutri?.id ?? "" }, 
    { enabled: isOpen && !!nutri?.id }
  );

  const updateMutation = trpc.admin.nutris.update.useMutation({
    onSuccess: () => {
      toast.success("Dados atualizados!");
      utils.admin.nutris.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema)
  });

  useEffect(() => {
    if (nutri) {
      reset({ crn: nutri.crn || "", specialty: nutri.specialty || "" });
    }
  }, [nutri, reset]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md flex flex-col h-full border-l border-slate-100 p-0">
        <div className="p-6 pb-2">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-2xl font-black uppercase italic">
              Painel do <span className="text-emerald-500">Nutri</span>
            </SheetTitle>
            <SheetDescription>
              Gestão de credenciais e rede de atendimento.
            </SheetDescription>
          </SheetHeader>
        </div>

        <Tabs defaultValue="perfil" className="flex-1 flex flex-col">
          <div className="px-6 border-b border-slate-100">
            <TabsList className="w-full justify-start bg-transparent h-12 p-0 gap-6">
              <TabsTrigger value="perfil" className="data-[state=active]:border-emerald-500 border-b-2 border-transparent rounded-none bg-transparent px-0 pb-2 text-[10px] font-black uppercase tracking-widest">
                Perfil
              </TabsTrigger>
              <TabsTrigger value="pacientes" className="data-[state=active]:border-emerald-500 border-b-2 border-transparent rounded-none bg-transparent px-0 pb-2 text-[10px] font-black uppercase tracking-widest">
                Rede
              </TabsTrigger>
              <TabsTrigger value="enderecos" className="data-[state=active]:border-emerald-500 border-b-2 border-transparent rounded-none bg-transparent px-0 pb-2 text-[10px] font-black uppercase tracking-widest">
                Endereços
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="perfil" className="mt-0 space-y-6">
              <form onSubmit={handleSubmit((data) => updateMutation.mutate({ id: nutri!.id, ...data }))} className="space-y-4">
                <div className="grid gap-4 bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Nome (Usuário)</label>
                    <div className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-slate-400 border border-slate-100 italic">
                      {nutri?.name || "Carregando..."}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase ml-1 text-slate-400">CRN</label>
                    <input {...register("crn")} className="w-full bg-white px-4 py-2 rounded-xl text-sm font-mono font-bold text-emerald-600 border border-slate-100 outline-none focus:ring-2 focus:ring-emerald-100" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Especialidade</label>
                    <input {...register("specialty")} className="w-full bg-white px-4 py-2 rounded-xl text-sm font-bold text-slate-600 border border-slate-100 outline-none focus:ring-2 focus:ring-emerald-100" />
                  </div>
                  <button type="submit" disabled={!isDirty || updateMutation.isPending} className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                    {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="pacientes" className="mt-0 space-y-4">
              {isLoadingPatients ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" /></div>
              ) : !patients || patients.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                  <p className="text-xs font-bold text-slate-300 uppercase">Nenhum vínculo encontrado</p>
                </div>
              ) : (
                // ✅ Tipagem PatientData aplicada aqui para remover o 'any'
                (patients as PatientData[]).map((p) => (
                  <div key={p.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-700">{p.name}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1"><Mail size={10} /> {p.email}</p>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="enderecos" className="mt-0 space-y-4">
              {isLoadingAddr ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" /></div>
              ) : !addresses || addresses.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                  <p className="text-xs font-bold text-slate-300 uppercase">Nenhum endereço cadastrado</p>
                </div>
              ) : (
                addresses.map((addr: AddressData) => ( 
                  <div key={addr.id} className={cn(
                    "p-4 rounded-2xl border transition-all",
                    addr.isDefault ? "bg-emerald-50/30 border-emerald-100" : "bg-white border-slate-100"
                  )}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                        {addr.label ?? "Endereço"}
                      </span>
                      {Number(addr.isDefault) === 1 && (
                        <span className="text-[9px] font-black text-emerald-600 uppercase italic">Principal</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-700 leading-tight">
                      {addr.street ?? "Rua não informada"}, {addr.number ?? "S/N"}
                    </p>
                    {addr.complement && (
                      <p className="text-[11px] text-slate-400 italic">{addr.complement}</p>
                    )}
                    <p className="text-[11px] text-slate-500 mt-1">
                      {addr.neighborhood ?? ""} — {addr.city ?? ""}/{addr.state ?? ""}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase">
                      <MapPin size={10} /> {addr.zipCode ?? "Sem CEP"}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}