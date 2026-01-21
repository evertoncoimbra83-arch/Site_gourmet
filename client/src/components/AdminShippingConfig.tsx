import React, { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/_core/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; 
import { Loader2, Plus, Trash2, Settings, Store, MapPin, Save } from 'lucide-react'; 
import { toast } from 'sonner';

interface ShippingRule {
    id?: number;
    startZipCode: string;
    endZipCode: string;
    price: number;
    description: string; 
}

interface GeneralSettings {
    pickupEnabled: boolean;
    pickupLabel: string;
    pickupInstruction: string;
}

export default function AdminShippingConfig() {
    // --- ESTADOS ---
    const [newRule, setNewRule] = useState<Omit<ShippingRule, 'id'>>({
        startZipCode: '',
        endZipCode: '',
        price: 0,
        description: '', 
    });

    const [isFreeShipping, setIsFreeShipping] = useState(false);

    const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
        pickupEnabled: false,
        pickupLabel: 'Retirada no Local',
        pickupInstruction: 'Pronto em 30-50 minutos após a confirmação.',
    });

    // --- TRPC ---
    const utils = trpc.useUtils();
    
    // ✅ CORREÇÃO 1: Removido onSuccess (Incompatível com v5). Usamos useEffect abaixo.
    const { data: fetchedSettings, isLoading: loadingSettings } = trpc.admin.shipping.getSettings.useQuery();

    const { data: fetchedRules, isLoading: loadingRules, refetch: refetchRules } = trpc.admin.shipping.getRules.useQuery();

    // Sincroniza estado local quando os dados chegam do servidor
    useEffect(() => {
        if (fetchedSettings) {
            setGeneralSettings({
                pickupEnabled: !!fetchedSettings.pickupEnabled,
                pickupLabel: fetchedSettings.pickupLabel || 'Retirada no Local',
                pickupInstruction: fetchedSettings.pickupInstruction || '',
            });
        }
    }, [fetchedSettings]);

    const updateSettingsMutation = trpc.admin.shipping.updateSettings.useMutation({
        onSuccess: () => {
            toast.success("Configurações salvas!");
            utils.admin.shipping.getSettings.invalidate();
        },
        onError: () => toast.error("Erro ao salvar."),
    });

    // ✅ CORREÇÃO 2: Verifique se no backend o nome é 'upsertRule' ou 'addRule'. 
    // Ajustado para 'upsertRule' que é o padrão mais comum em roteadores admin.
    const upsertRuleMutation = trpc.admin.shipping.upsertRule.useMutation({
        onSuccess: () => {
            toast.success("Regra processada com sucesso!");
            setNewRule({ startZipCode: '', endZipCode: '', price: 0, description: '' });
            setIsFreeShipping(false);
            utils.admin.shipping.getRules.invalidate();
        },
        onError: (err) => toast.error("Erro: " + err.message),
    });
    
    const deleteRuleMutation = trpc.admin.shipping.deleteRule.useMutation({
        onSuccess: () => { 
            toast.success("Regra removida."); 
            utils.admin.shipping.getRules.invalidate(); 
        },
        onError: () => toast.error("Erro ao remover regra."),
    });

    const rules = useMemo(() => fetchedRules || [], [fetchedRules]);

    // --- HANDLERS ---
    const handleSaveGeneralSettings = async () => {
        await updateSettingsMutation.mutateAsync(generalSettings);
    };

    const handleAddRule = async () => {
        if (newRule.startZipCode.length < 8) return toast.warning("CEP Inicial incompleto.");
        if (newRule.endZipCode.length < 8) return toast.warning("CEP Final incompleto.");
        
        if (parseInt(newRule.startZipCode) > parseInt(newRule.endZipCode)) {
             return toast.error("O CEP Inicial deve ser menor que o Final.");
        }

        const ruleToSend = {
            ...newRule,
            price: isFreeShipping ? 0 : Number(newRule.price)
        };

        await upsertRuleMutation.mutateAsync(ruleToSend as any);
    };
    
    const handleDeleteRule = async (id: number) => {
        if (!confirm("Remover esta regra?")) return;
        await deleteRuleMutation.mutateAsync({ id });
    };

    const formatZipCode = (value: string) => value.replace(/\D/g, '').slice(0, 8);

    useEffect(() => {
        if (isFreeShipping) setNewRule(prev => ({ ...prev, price: 0 }));
    }, [isFreeShipping]);

    const isSavingSettings = updateSettingsMutation.isPending;
    const isAddingRule = upsertRuleMutation.isPending;
    const isDeletingRule = deleteRuleMutation.isPending;

    if (loadingSettings || loadingRules) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40}/></div>;
    }

    return (
        <div className="space-y-8 container mx-auto px-4 py-8 max-w-5xl">
            <h1 className="text-3xl font-black uppercase italic text-slate-900 tracking-tighter">
                Logística <span className="text-emerald-600">& Entrega</span>
            </h1>

            {/* CONFIGURAÇÕES GERAIS */}
            <Card className="rounded-[2rem] border-slate-100 shadow-xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Settings className="w-4 h-4 text-emerald-600"/> Operação de Retirada
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="space-y-1">
                            <Label className="text-xs font-black uppercase flex items-center gap-2"><Store className="w-4 h-4"/> Take-away (Retirada)</Label>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Habilitar opção de busca no local para o cliente.</p>
                        </div>
                        <Switch 
                            checked={generalSettings.pickupEnabled}
                            onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, pickupEnabled: checked })}
                            disabled={isSavingSettings}
                        />
                    </div>

                    {generalSettings.pickupEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase ml-1">Título da Opção</Label>
                                <Input 
                                    className="rounded-xl bg-slate-50 border-none font-bold"
                                    value={generalSettings.pickupLabel}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, pickupLabel: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase ml-1">Instruções para o Checkout</Label>
                                <Input 
                                    className="rounded-xl bg-slate-50 border-none font-bold"
                                    value={generalSettings.pickupInstruction}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, pickupInstruction: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSaveGeneralSettings} disabled={isSavingSettings} className="rounded-xl bg-slate-900 hover:bg-emerald-600 gap-2 h-12 px-8 font-black uppercase text-[10px] tracking-widest transition-all">
                            {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Salvar Logística
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* REGRAS DE CEP */}
            <Card className="rounded-[2rem] border-slate-100 shadow-xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600"/> Tabela de Fretes por Faixa de CEP
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    
                    <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">CEP Inicial</Label>
                                <Input 
                                    className="bg-slate-800 border-none rounded-xl font-mono text-emerald-400"
                                    value={newRule.startZipCode}
                                    onChange={(e) => setNewRule({...newRule, startZipCode: formatZipCode(e.target.value)})}
                                    maxLength={8}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">CEP Final</Label>
                                <Input 
                                    className="bg-slate-800 border-none rounded-xl font-mono text-emerald-400"
                                    value={newRule.endZipCode}
                                    onChange={(e) => setNewRule({...newRule, endZipCode: formatZipCode(e.target.value)})}
                                    maxLength={8}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-1">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Valor Frete</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-black uppercase text-emerald-500">Grátis</span>
                                        <Switch checked={isFreeShipping} onCheckedChange={setIsFreeShipping} className="scale-75 origin-right"/>
                                    </div>
                                </div>
                                <Input 
                                    type="number" 
                                    className="bg-slate-800 border-none rounded-xl font-bold"
                                    value={newRule.price}
                                    onChange={(e) => setNewRule({...newRule, price: parseFloat(e.target.value) || 0})}
                                    disabled={isFreeShipping}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Identificação Região</Label>
                                <Input 
                                    className="bg-slate-800 border-none rounded-xl font-bold"
                                    value={newRule.description}
                                    onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end pt-2">
                            <Button 
                                onClick={handleAddRule} 
                                disabled={isAddingRule} 
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl gap-2 h-12 px-8 font-black uppercase text-[10px] tracking-widest"
                            >
                                {isAddingRule ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>} Adicionar Regra
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-2">Regras Ativas</h3>
                        <div className="grid gap-3">
                            {rules.map((rule: any) => (
                                <div key={rule.id} className="group flex items-center justify-between border border-slate-100 p-4 rounded-2xl bg-white hover:border-emerald-200 hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                            <MapPin size={18}/>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black uppercase text-xs text-slate-700">{rule.description || 'Entrega'}</span>
                                                {parseFloat(rule.price) === 0 && <span className="bg-emerald-100 text-emerald-700 text-[8px] px-2 py-0.5 rounded-full font-black uppercase">Grátis</span>}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter italic">Faixa: {rule.startZipCode} - {rule.endZipCode}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="font-black text-slate-900 text-sm italic">R$ {parseFloat(rule.price).toFixed(2)}</span>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)} disabled={isDeletingRule} className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}