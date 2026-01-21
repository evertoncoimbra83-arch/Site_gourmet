import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";
import { keepPreviousData } from "@tanstack/react-query";

export function useAdminLoyalty() {
  const utils = trpc.useUtils();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  
  const [manualPoints, setManualPoints] = useState<number>(0);
  const [manualReason, setManualReason] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // 1. QUERIES
  const { data: settings, isLoading: loadingSettings } = trpc.admin.loyaltySettings.get.useQuery();
  
  const { data: customersData, isLoading: loadingCustomers } = trpc.admin.loyaltySettings.getCustomers.useQuery(
    { page, limit: 10, search: debouncedSearch || undefined },
    { placeholderData: keepPreviousData }
  );

  const { data: history, isLoading: loadingHistory } = trpc.admin.loyaltySettings.getCustomerHistory.useQuery(
    { userId: selectedCustomer?.id },
    { enabled: !!selectedCustomer }
  );

  // ✅ NORMALIZAÇÃO SIMPLIFICADA
  // Como o backend agora já envia 'points' e 'totalSpent' limpos, apenas garantimos o tipo Number
  const processedCustomers = useMemo(() => {
    if (!customersData?.items) return [];
    
    return customersData.items.map((c: any) => ({
      ...c,
      name: c.name || "Cliente",
      points: Number(c.points || 0),
      totalSpent: Number(c.totalSpent || 0)
    }));
  }, [customersData]);

  // ✅ SINCRONIZAÇÃO DO CLIENTE SELECIONADO
  // Se o saldo do cliente mudar na lista, atualiza o modal/detalhe dele automaticamente
  useEffect(() => {
    if (selectedCustomer && processedCustomers.length > 0) {
      const updated = processedCustomers.find(c => c.id === selectedCustomer.id);
      if (updated && (updated.points !== selectedCustomer.points || updated.totalSpent !== selectedCustomer.totalSpent)) {
        setSelectedCustomer(updated);
      }
    }
  }, [processedCustomers, selectedCustomer]);

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  // 2. MUTATIONS
  const updateSettings = trpc.admin.loyaltySettings.update.useMutation({
    onSuccess: () => {
      toast.success("Regras de fidelidade atualizadas!");
      utils.admin.loyaltySettings.get.invalidate();
    },
    onError: (err) => toast.error("Erro ao atualizar: " + err.message)
  });

  const addManualPointsMutation = trpc.admin.loyaltySettings.addManualPoints.useMutation({
    onSuccess: () => {
      toast.success("Saldo do cliente atualizado!");
      setManualPoints(0);
      setManualReason("");
      // Invalida ambos para garantir que a lista e o histórico deem refresh
      utils.admin.loyaltySettings.getCustomerHistory.invalidate({ userId: selectedCustomer?.id });
      utils.admin.loyaltySettings.getCustomers.invalidate();
    },
    onError: (err) => toast.error("Erro no ajuste: " + err.message)
  });

  // 3. ACTIONS
  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync({
        ...formData,
        conversionRatePoints: Number(formData.conversionRatePoints),
        redemptionRatePoints: Number(formData.redemptionRatePoints),
        pointsExpirationDays: Number(formData.pointsExpirationDays),
      });
    } catch (e) {}
  };

  const handleManualAdjustment = () => {
    if (!selectedCustomer) return;
    if (manualPoints === 0) return toast.error("Informe um valor");

    addManualPointsMutation.mutate({
      userId: selectedCustomer.id,
      points: manualPoints,
      reason: manualReason || "Ajuste manual administrativo"
    });
  };

  return {
    state: { page, search, selectedCustomer, formData, manualPoints, manualReason, loadingSettings, loadingCustomers, loadingHistory },
    actions: { setPage, setSearch, setSelectedCustomer, setFormData, setManualPoints, setManualReason, handleSaveSettings, handleManualAdjustment },
    data: { 
      customers: processedCustomers, 
      totalPages: customersData?.totalPages || 1,
      history: history || [] 
    },
    mutations: { updateSettings, addManualPoints: addManualPointsMutation }
  };
}