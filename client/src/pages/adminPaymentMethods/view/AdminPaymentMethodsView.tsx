import { useAdminPaymentMethods } from "../logic/useAdminPaymentMethods";
import { PaymentMethodDrawer } from "../components/PaymentMethodDrawer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Edit2, Trash2, Loader2, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminPaymentMethodsView() {
  const { state, actions, data, mutations } = useAdminPaymentMethods();

  /**
   * ✅ HELPER DE IMAGEM CORRIGIDO
   * Aponta explicitamente para a porta do Backend (3001)
   */
  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return "";
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    
    // Remove barras duplicadas e força a porta 3001
    const cleanUrl = url.replace(/^\/+/, '').replace('uploads/', '');
    return `http://localhost:3001/uploads/${cleanUrl}`;
  };

  const handleSave = (formData: any) => {
    const payload = { 
      ...formData, 
      discount_percentage: Number(formData.discount_percentage || 0) 
    };
    
    if (state.editingMethod) {
      mutations.updateMutation.mutate({ 
        id: state.editingMethod.id, 
        ...payload 
      });
    } else {
      mutations.createMutation.mutate({ 
        ...payload, 
        isActive: true 
      });
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <Landmark size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Financeiro & Checkout</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Canais de <span className="text-emerald-600">Recebimento</span><span className="text-emerald-600">.</span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-medium italic">
            Gerencie métodos de pagamento e identidades visuais.
          </p>
        </div>
        
        <Button 
          onClick={() => { actions.setEditingMethod(null); actions.setIsOpen(true); }} 
          className="h-16 px-10 rounded-[2rem] bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all active:scale-95 group"
        >
          <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" /> 
          Novo Método
        </Button>
      </header>

      {/* LISTAGEM */}
      <section className="space-y-6">
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-start">
            <span className="bg-[#F8FAFC] pr-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
              Métodos Habilitados
            </span>
          </div>
        </div>

        {state.isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
             <Loader2 className="animate-spin text-emerald-600" size={32} />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando Canais...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.methods.map((method: any) => {
              const activeStatus = method.is_active ?? method.active ?? method.isActive;
              const discount = parseFloat(method.discount_percentage || method.discountPercentage || 0);
              const logoUrl = method.brand_logo_url || method.brandLogoUrl;

              return (
                <div key={method.id} className="group bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 flex flex-col justify-between hover:shadow-md transition-all duration-500 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-5">
                      
                      {/* ✅ MINIATURA DO CARD */}
                      <div className="h-20 w-20 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner group-hover:border-emerald-100 transition-all">
                        {logoUrl ? (
                          <img 
                            src={getImageUrl(logoUrl)} 
                            alt={method.name}
                            className="h-full w-full object-contain p-3 transition-transform group-hover:scale-110"
                            onError={(e) => {
                              // Se falhar, volta para o ícone padrão
                              e.currentTarget.style.display = 'none';
                              const icon = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                              if (icon) (icon as HTMLElement).style.display = 'block';
                            }}
                          />
                        ) : null}
                        <CreditCard 
                          size={28} 
                          className={cn(
                            "text-slate-300 group-hover:text-emerald-500 transition-colors fallback-icon",
                            logoUrl ? "hidden" : "block"
                          )} 
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="font-black text-xl uppercase italic tracking-tighter text-slate-900 leading-none">
                          {method.name}
                        </h3>
                        <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-md">
                          {method.brand_name || method.brandName || 'BANDEIRA GERAL'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-600" onClick={() => actions.handleEdit(method)}>
                        <Edit2 size={18}/>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-slate-50 text-slate-200 hover:text-red-500" onClick={() => window.confirm("Remover?") && mutations.deleteMutation.mutate({id: method.id})}>
                        <Trash2 size={18}/>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={Boolean(activeStatus)} 
                        onCheckedChange={() => actions.handleToggleActive(method.id, Boolean(activeStatus))} 
                      />
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", activeStatus ? "text-emerald-600" : "text-slate-300")}>
                        {activeStatus ? 'Ativo' : 'Pausado'}
                      </span>
                    </div>
                    {discount > 0 && (
                      <Badge className="bg-emerald-50 text-emerald-600 font-black px-4 py-1.5 rounded-xl border-none text-[11px] italic">
                        {discount}% OFF
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <PaymentMethodDrawer 
        open={state.isOpen}
        onClose={() => actions.setIsOpen(false)}
        method={state.editingMethod}
        onSubmit={handleSave}
        isPending={mutations.createMutation.isPending || mutations.updateMutation.isPending}
      />
    </div>
  );
}