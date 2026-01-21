import { useAdminUsers } from "../logic/useAdminUsers";
import { UserDetailsDrawer } from "../components/UserDetailsDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Users as UsersIcon,
  ShieldCheck,
  User as UserIcon,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminUsersView() {
  const { state, actions, data, mutations } = useAdminUsers();

  // Atalhos para facilitar a leitura
  const usersList = data.users || [];
  const deleteM = mutations.deleteUser;
  const updateM = mutations.updateUser;

  // Lógica de Paginação: Calcula se é a última página baseado no total do banco
  const totalPages = Math.ceil((data.totalCount || 0) / (data.limit || 20));
  const isLastPage = state.page >= totalPages;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER PREMIUM */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <UsersIcon size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Base CRM & Acessos</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Gestão de <span className="text-emerald-600">Clientes</span><span className="text-emerald-600">.</span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-medium italic">
            Visualize o comportamento de compra, gerencie permissões e edite perfis.
          </p>
        </div>
        
        <Button 
          onClick={() => actions.setIsCreateDialogOpen(true)} 
          className="h-16 px-10 rounded-[2rem] bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all active:scale-95 group"
        >
          <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" /> 
          Novo Cliente
        </Button>
      </header>

      {/* BUSCA */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
        <Input 
          placeholder="PROCURAR POR NOME, E-MAIL OU CPF..." 
          className="h-16 pl-14 rounded-[2rem] bg-white border-none shadow-sm font-bold text-xs tracking-widest uppercase focus-visible:ring-4 focus-visible:ring-emerald-500/5 transition-all" 
          value={state.searchTerm}
          onChange={e => actions.setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABELA / LISTAGEM */}
      <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <div className="flex items-center gap-2"><UserIcon size={12}/> Identificação</div>
                </th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <div className="flex items-center gap-2"><ShieldCheck size={12}/> Nível de Acesso</div>
                </th>
                <th className="p-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {state.isLoading ? (
                <tr>
                  <td colSpan={3} className="p-32 text-center">
                    <Loader2 className="animate-spin inline text-emerald-600 mb-4" size={48} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sincronizando Base de Dados...</p>
                  </td>
                </tr>
              ) : usersList.length > 0 ? (
                usersList.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="p-6">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all border border-slate-100">
                            <UserIcon size={20} />
                          </div>
                          <div>
                            <div className="font-black text-slate-800 uppercase italic tracking-tighter text-base leading-tight">
                              {/* Exibe o nome descriptografado vindo do back-end */}
                              {user.name || 'Membro sem Nome'}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                               <Mail size={10} className="text-slate-300" />
                               <span className="text-[11px] font-bold text-slate-400 lowercase">{user.email}</span>
                            </div>
                          </div>
                       </div>
                    </td>
                    <td className="p-6">
                      <Badge 
                        className={cn(
                          "rounded-xl font-black text-[9px] uppercase px-4 py-1.5 border-none tracking-widest",
                          user.role === 'admin' 
                            ? 'bg-slate-900 text-emerald-400' 
                            : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {user.role || 'user'}
                      </Badge>
                    </td>
                    <td className="p-6 text-right">
                       <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            className="h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                            onClick={() => actions.setSelectedUserId(user.id)}
                          >
                            Gerenciar
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "h-12 w-12 rounded-2xl bg-slate-50 text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90",
                              deleteM.isPending && "animate-pulse"
                            )}
                            onClick={() => {
                              if(confirm(`Deseja realmente remover o acesso de ${user.name || user.email}?`)) {
                                // O id passado aqui é a String (CUID)
                                deleteM.mutate({ id: user.id });
                              }
                            }}
                            disabled={deleteM.isPending}
                          >
                            {deleteM.isPending ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={20}/>
                            )}
                          </Button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-32 text-center text-slate-300">
                    <UsersIcon className="mx-auto mb-4 opacity-20" size={64} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhum registro encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINAÇÃO */}
        <div className="p-8 flex justify-between items-center bg-white border-t border-slate-50">
          <Button 
            variant="ghost" 
            disabled={state.page === 1} 
            onClick={() => actions.setPage(state.page - 1)} 
            className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-100"
          >
            <ChevronLeft size={18} className="mr-2"/> Anterior
          </Button>

          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black italic text-sm">
              {state.page}
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Página Atual</span>
               <span className="text-[9px] font-bold text-emerald-600 uppercase">Total: {data.totalCount || 0}</span>
            </div>
          </div>

          <Button 
            variant="ghost" 
            disabled={isLastPage} 
            onClick={() => actions.setPage(state.page + 1)} 
            className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-100"
          >
            Próxima <ChevronRight size={18} className="ml-2"/>
          </Button>
        </div>
      </div>

      {/* DRAWER DE DETALHES (O id aqui deve ser string para bater com o roteador) */}
      <UserDetailsDrawer 
        open={!!state.selectedUserId}
        userId={state.selectedUserId}
        onClose={() => actions.setSelectedUserId(null)}
        details={data.userDetails}
        isLoading={state.isLoadingDetails}
        onUpdate={updateM.mutate}
        isUpdating={updateM.isPending}
      />
    </div>
  );
}