// client/src/pages/adminUsers/view/AdminUsersView.tsx

import React, { ComponentProps } from "react";
import { useAdminUsers } from "../logic/useAdminUsers";
import { UserDetailsDrawer } from "../components/UserDetailsDrawer";
import { CreateUserDrawer } from "../components/CreateUserDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Plus, Trash2, Loader2,
  Users as UsersIcon, User as UserIcon, Mail, RefreshCw,
  ChevronLeft, ChevronRight 
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- INTERFACES ---

type UserRole = "user" | "admin";

interface User {
  id: string; 
  name?: string;
  email?: string;
  role?: UserRole;
}

interface UpdateUserData {
  id: string | number;
  name?: string;
  phone?: string;
  customerDocument?: string;
  role?: string;
}

// ✅ A MÁGICA ACONTECE AQUI: 
// Estendemos as propriedades do componente original de forma segura, sem 'any'.
const TypedUserDetailsDrawer = UserDetailsDrawer as React.FC<
  ComponentProps<typeof UserDetailsDrawer> & {
    onUpdate?: (updateData: UpdateUserData) => void;
    isUpdating?: boolean;
  }
>;

export function AdminUsersView() {
  const { state, actions, data, mutations } = useAdminUsers();

  const usersList = (data.users || []) as unknown as User[];
  const { deleteUser, updateUser, createUser, reindexDatabase } = mutations;

  const totalPages = Math.ceil((data.totalCount || 0) / (data.limit || 20));
  const isLastPage = state.page >= totalPages;

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-0">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 text-center md:text-left pt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-600">
            <UsersIcon size={16} />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Base CRM & Acessos</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Gestão de <span className="text-emerald-600">Clientes</span><span className="text-emerald-600">.</span>
          </h1>
          <p className="text-xs md:text-base text-slate-500 font-medium italic max-w-md">
            Visualize o comportamento de compra e gerencie perfis.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <Button 
            variant="outline"
            onClick={() => confirm("Deseja sincronizar a ordem alfabética e índices de busca?") && reindexDatabase.mutate()}
            disabled={reindexDatabase.isPending}
            className="h-14 md:h-16 px-6 rounded-[1.5rem] border-slate-100 bg-white text-slate-400 hover:text-emerald-600 font-black uppercase text-[10px] tracking-widest shadow-sm group"
          >
            {reindexDatabase.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />}
          </Button>

          <Button 
            onClick={() => actions.setIsCreateDialogOpen(true)} 
            className="h-14 md:h-16 w-full md:w-auto px-10 rounded-[1.5rem] bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 group border-none"
          >
            <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" /> 
            Novo Cliente
          </Button>
        </div>
      </header>

      {/* BUSCA */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
        <Input 
          placeholder="NOME, E-MAIL OU CPF..." 
          className="h-14 md:h-16 pl-12 rounded-[1.5rem] bg-white border-none shadow-sm font-bold text-[10px] md:text-xs tracking-widest uppercase focus-visible:ring-4 focus-visible:ring-emerald-500/5 transition-all outline-none" 
          value={state.searchTerm}
          onChange={e => actions.setSearchTerm(e.target.value)}
        />
      </div>

      {/* LISTAGEM */}
      <div className="bg-white rounded-[2rem] border border-slate-50 shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Identificação</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Nível</th>
                <th className="p-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {usersList.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 group">
                  <td className="p-6 text-left">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100"><UserIcon size={20} /></div>
                      <div>
                        <div className="font-black text-slate-800 uppercase italic text-base leading-tight">{user.name || 'Membro sem Nome'}</div>
                        <div className="flex items-center gap-1.5 mt-0.5"><Mail size={10} className="text-slate-300" /><span className="text-[11px] font-bold text-slate-400">{user.email}</span></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-left">
                    <Badge className={cn("rounded-xl font-black text-[9px] uppercase px-4 py-1.5 border-none shadow-none", user.role === 'admin' ? 'bg-slate-900 text-emerald-400' : 'bg-slate-100 text-slate-500')}>
                      {user.role || 'user'}
                    </Badge>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" className="h-12 px-6 rounded-2xl font-black text-[10px] bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white border-none transition-all" onClick={() => actions.setSelectedUserId(user.id)}>Gerenciar</Button>
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-200 hover:text-red-500 border-none transition-all" onClick={() => confirm(`Remover ${user.name}?`) && deleteUser.mutate({ id: user.id })} disabled={deleteUser.isPending}><Trash2 size={20}/></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWERS */}
      <CreateUserDrawer 
        open={state.isCreateDialogOpen}
        onClose={() => actions.setIsCreateDialogOpen(false)}
        onSubmit={(formData) => {
          createUser.mutate({
            ...formData,
            role: formData.role as UserRole
          });
        }}
        isPending={createUser.isPending}
      />

      {/* ✅ Renderizamos o nosso componente "anabolizado" com as novas tipagens permitidas */}
      <TypedUserDetailsDrawer 
        open={!!state.selectedUserId}
        userId={state.selectedUserId ? String(state.selectedUserId) : ""} 
        onClose={() => actions.setSelectedUserId(null)}
        details={(data.userDetails as unknown) as ComponentProps<typeof UserDetailsDrawer>["details"]}
        isLoading={state.isLoadingDetails}
        onUpdate={(updateData: UpdateUserData) => {
          updateUser.mutate({
            id: String(updateData.id),
            name: updateData.name,
            phone: updateData.phone,
            role: updateData.role as UserRole | undefined
          });
        }}
        isUpdating={updateUser.isPending}
      />

      {/* PAGINAÇÃO */}
      <div className="flex justify-between items-center py-4 bg-white/50 p-4 rounded-3xl border border-slate-100">
        <Button 
          variant="ghost" 
          className="gap-2 font-black text-[10px] uppercase tracking-widest text-slate-400"
          disabled={state.page === 1} 
          onClick={() => actions.setPage(state.page - 1)}
        >
          <ChevronLeft size={16} /> Anterior
        </Button>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-slate-100 px-4 py-2 rounded-full">
          Página {state.page} de {totalPages || 1}
        </span>
        <Button 
          variant="ghost" 
          className="gap-2 font-black text-[10px] uppercase tracking-widest text-slate-400"
          disabled={isLastPage} 
          onClick={() => actions.setPage(state.page + 1)}
        >
          Próxima <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}