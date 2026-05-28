// e:/IA/projects/Site_React/client/src/pages/adminLoyalty/logic/useAdminLoyalty.ts

import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast"; 
import { getAdminMutationErrorMessage } from "@/lib/admin-mutation-error";
import { keepPreviousData } from "@tanstack/react-query";
import { requestStrongConfirmation } from "@/lib/strong-confirmation";

// --- INTERFACES ---
export interface RedemptionRule {
  minOrderValue: number;
  maxDiscount: number;
}

export interface LoyaltyCustomer {
  id: string; 
  name: string;
  email: string;
  points: number;
}

export interface LoyaltyTransaction {
  id: string;
  points?: number; // Compatibilidade com nomes do banco
  points_change?: number;
  pointsChange?: number;
  type: string;
  reason: string | null;
  description: string | null;
  createdAt?: string | Date | null;
  created_at?: string | Date | null;
}

export interface LoyaltySettings {
  enabled: boolean;
  conversionRatePoints: number;
  pointsPerSignup: number;
  redemptionRatePoints: number;
  redemptionRateMoney: number;
  redemptionRules: RedemptionRule[];
  pointsExpirationDays: number;
  [key: string]: unknown;
}

export function useAdminLoyalty() {
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyCustomer | null>(null);
  
  const [manualPoints, setManualPoints] = useState<number>(0);
  const [manualReason, setManualReason] = useState("");

  const [formData, setFormData] = useState<Partial<LoyaltySettings>>({
    redemptionRules: [],
    enabled: false,
    conversionRatePoints: 1,
    redemptionRatePoints: 100,
    redemptionRateMoney: 1
  });

  const { data: settings } = trpc.admin.loyaltySettings.get.useQuery();
  
  const customersQuery = trpc.admin.loyaltySettings.getCustomers.useQuery(
    { page, limit: 10, search: debouncedSearch || undefined },
    { placeholderData: keepPreviousData }
  );

  const historyQuery = trpc.admin.loyaltySettings.getCustomerHistory.useQuery(
    { userId: String(selectedCustomer?.id || "") }, 
    { enabled: !!selectedCustomer }
  );

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (settings) {
      const s = settings as Record<string, unknown>;
      setFormData({
        ...s,
        redemptionRules: typeof s.redemptionRules === 'string' 
          ? JSON.parse(s.redemptionRules) 
          : (Array.isArray(s.redemptionRules) ? s.redemptionRules : [])
      });
    }
  }, [settings]);

  const updateSettings = trpc.admin.loyaltySettings.update.useMutation({
    onSuccess: () => {
      utils.admin.loyaltySettings.get.invalidate();
      toast.success("Configurações salvas!");
    },
    onError: (err) => toast.error(getAdminMutationErrorMessage(err, "Erro ao salvar fidelidade.")),
  });

  const adjustMutation = trpc.admin.loyaltySettings.addManualPoints.useMutation({
    onSuccess: (res) => {
      utils.admin.loyaltySettings.getCustomerHistory.invalidate();
      utils.admin.loyaltySettings.getCustomers.invalidate();
      setManualPoints(0);
      setManualReason("");
      toast.success(res?.message || "Saldo atualizado com sucesso!");
    },
    onError: (err) => toast.error(getAdminMutationErrorMessage(err, "Erro ao ajustar pontos."))
  });

  // ✅ NOVA MUTATION: Deletar Transação
  const deleteMutation = trpc.admin.loyaltySettings.deleteTransactions.useMutation({
    onSuccess: () => {
      utils.admin.loyaltySettings.getCustomerHistory.invalidate();
      utils.admin.loyaltySettings.getCustomers.invalidate();
      toast.success("Entrada removida com sucesso!");
    },
    onError: (err) => toast.error(getAdminMutationErrorMessage(err, "Erro ao deletar movimentacao."))
  });

  const handleSaveSettings = () => {
    const confirmation = requestStrongConfirmation(
      "Alterar regras do clube de fidelidade afeta pontos, cashback e resgates.",
    );
    if (!confirmation) return toast.warning("Confirmacao forte cancelada.");
    updateSettings.mutate({
      ...(formData as Record<string, unknown>),
      ...confirmation,
    });
  };

  const handleManualAdjustment = () => {
    if (!selectedCustomer) return;
    const confirmation =
      Math.abs(manualPoints) >= 1000
        ? requestStrongConfirmation(
            `Ajuste manual de ${manualPoints} pontos para ${selectedCustomer.name}.`,
          )
        : null;
    if (Math.abs(manualPoints) >= 1000 && !confirmation) {
      return toast.warning("Confirmacao forte cancelada.");
    }
    adjustMutation.mutate({
      userId: String(selectedCustomer.id),
      points: manualPoints,
      reason: manualReason || "Ajuste manual",
      customerName: selectedCustomer.name,
      ...confirmation,
    });
  };

  // ✅ NOVA AÇÃO: Handle para deletar
  const handleDeleteTransaction = (transactionId: string | number) => {
    if (!selectedCustomer) {
      toast.error("Nenhum cliente selecionado.");
      return;
    }

    if (!window.confirm("Tem certeza que deseja excluir esta movimentação? Isso não estornará os pontos do cliente automaticamente.")) {
      return;
    }

    // ✅ CORREÇÃO: Enviando no formato que o seu backend espera
    const confirmation = requestStrongConfirmation(
      "Excluir movimentacao de fidelidade e uma acao irreversivel.",
    );
    if (!confirmation) return toast.warning("Confirmacao forte cancelada.");

    deleteMutation.mutate({ 
      userId: String(selectedCustomer.id), 
      transactionIds: [String(transactionId)],
      ...confirmation,
    });
  };

  return {
    state: { 
      page, search, selectedCustomer, formData, 
      manualPoints, manualReason,
      isPending: adjustMutation.isPending || deleteMutation.isPending // ✅ Agora considera o delete também
    },
    actions: { 
      setPage, setSearch, setSelectedCustomer, setFormData, 
      setManualPoints, setManualReason,
      handleSaveSettings, handleManualAdjustment,
      handleDeleteTransaction // ✅ Adicionado às ações
    },
    data: { 
      customers: (customersQuery.data?.items as unknown as LoyaltyCustomer[]) || [],
      history: (historyQuery.data as unknown as LoyaltyTransaction[]) || [],
      totalCount: customersQuery.data?.total || 0,
      totalPages: customersQuery.data?.totalPages || 1
    },
    mutations: { updateSettings, deleteMutation }
  };
}
