// client/src/components/AdminShippingConfig.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/_core/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; 
import { Loader2, Trash2 } from 'lucide-react'; 
import { appToast as toast } from "@/lib/app-toast";
import { getAdminMutationErrorMessage } from "@/lib/admin-mutation-error";
import { safeNumber } from "@/lib/safe-parse";
import { requestStrongConfirmation } from "@/lib/strong-confirmation";

// Interfaces
interface ShippingRule {
    id: number;
    name: string;
    description: string | null;
    type: string | null;
    shippingCost: string;
    isActive: boolean | null;
    zipCodeStart: string;
    zipCodeEnd: string;
    polygonCoords: string | null;
    estimatedDays: number | null;
    storeSlug: string | null;
}

interface GeneralSettings {
    pickupEnabled: boolean;
    pickupLabel: string;
    pickupInstruction: string;
}

export default function AdminShippingConfig() {
    const [newRule, setNewRule] = useState({
        zipCodeStart: '',
        zipCodeEnd: '',
        shippingCost: 0,
        name: '', 
    });

    const [isFreeShipping, setIsFreeShipping] = useState(false);

    const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
        pickupEnabled: false,
        pickupLabel: 'Retirada no Local',
        pickupInstruction: 'Pronto em 30-50 minutos após a confirmação.',
    });

    const utils = trpc.useUtils();
    
    // ✅ A SOLUÇÃO FINAL TS2345: Passar explicitamente "undefined" para rotas sem .input()
    const { data: fetchedSettings, isLoading: loadingSettings } = trpc.admin.shippingRules.getSettings.useQuery();
    const { data: fetchedRules, isLoading: loadingRules } = trpc.admin.shippingRules.getRules.useQuery({ storeSlug: "default" });

    useEffect(() => {
        if (fetchedSettings) {
            setGeneralSettings({
                pickupEnabled: !!fetchedSettings.pickupEnabled,
                pickupLabel: fetchedSettings.pickupLabel || 'Retirada no Local',
                pickupInstruction: fetchedSettings.pickupInstruction || '',
            });
        }
    }, [fetchedSettings]);

    const updateSettingsMutation = trpc.admin.shippingRules.updateSettings.useMutation({
        onSuccess: () => {
            toast.success("Configurações salvas!");
            utils.admin.shippingRules.getSettings.invalidate();
        },
        onError: (err) => toast.error(getAdminMutationErrorMessage(err, "Erro ao salvar frete.")),
    });

    const createRuleMutation = trpc.admin.shippingRules.createRule.useMutation({
        onSuccess: () => {
            toast.success("Regra processada!");
            setNewRule({ zipCodeStart: '', zipCodeEnd: '', shippingCost: 0, name: '' });
            setIsFreeShipping(false);
            utils.admin.shippingRules.getRules.invalidate();
        },
        onError: (err) => toast.error(getAdminMutationErrorMessage(err, "Erro ao salvar regra de frete.")),
    });
    
    const deleteRuleMutation = trpc.admin.shippingRules.deleteRule.useMutation({
        onSuccess: () => { 
            toast.success("Regra removida."); 
            utils.admin.shippingRules.getRules.invalidate(); 
        },
        onError: (err) => toast.error(getAdminMutationErrorMessage(err, "Erro ao remover regra de frete.")),
    });

    const rules = useMemo<ShippingRule[]>(() => fetchedRules ?? [], [fetchedRules]);

    const handleSaveGeneralSettings = async () => {
        const confirmation = requestStrongConfirmation(
            "Alterar configuracoes de retirada/frete afeta o checkout.",
        );
        if (!confirmation) return toast.warning("Confirmacao forte cancelada.");
        await updateSettingsMutation.mutateAsync({ ...generalSettings, ...confirmation });
    };

    const handleAddRule = async () => {
        if (newRule.zipCodeStart.length < 8) return toast.warning("CEP Inicial incompleto.");
        if (newRule.zipCodeEnd.length < 8) return toast.warning("CEP Final incompleto.");
        
        const needsConfirmation = Number(newRule.shippingCost) > 100;
        const confirmation = needsConfirmation
            ? requestStrongConfirmation("Regra de frete de alto valor.")
            : null;
        if (needsConfirmation && !confirmation) {
            return toast.warning("Confirmacao forte cancelada.");
        }

        const ruleToSend = {
            name: newRule.name,
            type: "zipcode" as const, 
            price: isFreeShipping ? 0 : Number(newRule.shippingCost), 
            cepStart: newRule.zipCodeStart, 
            cepEnd: newRule.zipCodeEnd,
            ...confirmation,
        };

        await createRuleMutation.mutateAsync(ruleToSend);
    };
    
    const handleDeleteRule = async (id: number) => {
        const confirmation = requestStrongConfirmation("Excluir regra de frete.");
        if (!confirmation) return toast.warning("Confirmacao forte cancelada.");
        await deleteRuleMutation.mutateAsync({ id, ...confirmation }); 
    };

    const formatZipCode = (value: string) => value.replace(/\D/g, '').slice(0, 8);

    if (loadingSettings || loadingRules) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40}/></div>;
    }

    return (
        <div className="space-y-8 container mx-auto px-4 py-8 max-w-5xl text-left">
            <h1 className="text-3xl font-black uppercase italic text-slate-900 tracking-tighter">
                Logística <span className="text-emerald-600">& Entrega</span>
            </h1>

            <Card className="rounded-[2rem] border-slate-100 shadow-xl">
                <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <Label className="text-xs font-black uppercase">Habilitar Retirada</Label>
                        <Switch 
                            checked={generalSettings.pickupEnabled}
                            onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, pickupEnabled: checked })}
                        />
                    </div>
                    <Button onClick={handleSaveGeneralSettings} disabled={updateSettingsMutation.isPending} className="w-full rounded-xl bg-slate-900 font-black">
                        SALVAR CONFIGURAÇÕES
                    </Button>
                </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-slate-100 shadow-xl">
                <CardContent className="p-8 space-y-8">
                    <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Input placeholder="CEP Inicial" value={newRule.zipCodeStart} onChange={(e) => setNewRule({...newRule, zipCodeStart: formatZipCode(e.target.value)})} className="bg-slate-800 border-none"/>
                            <Input placeholder="CEP Final" value={newRule.zipCodeEnd} onChange={(e) => setNewRule({...newRule, zipCodeEnd: formatZipCode(e.target.value)})} className="bg-slate-800 border-none"/>
                            <Input placeholder="Custo" type="number" value={newRule.shippingCost} onChange={(e) => setNewRule({...newRule, shippingCost: safeNumber(e.target.value)})} className="bg-slate-800 border-none"/>
                            <Input placeholder="Nome Região" value={newRule.name} onChange={(e) => setNewRule({...newRule, name: e.target.value})} className="bg-slate-800 border-none"/>
                        </div>
                        <Button onClick={handleAddRule} disabled={createRuleMutation.isPending} className="w-full bg-emerald-500 text-slate-900 font-black">
                            ADICIONAR REGRA
                        </Button>
                    </div>

                    <div className="grid gap-3">
                        {rules.map((rule) => (
                            <div key={rule.id} className="flex items-center justify-between border p-4 rounded-2xl">
                                <div>
                                    <p className="font-black uppercase text-xs">{rule.name}</p>
                                    <p className="text-[10px] text-slate-400">{rule.zipCodeStart} - {rule.zipCodeEnd}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-black">R$ {Number(rule.shippingCost).toFixed(2)}</span>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)} className="text-red-500">
                                        <Trash2 size={16}/>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
