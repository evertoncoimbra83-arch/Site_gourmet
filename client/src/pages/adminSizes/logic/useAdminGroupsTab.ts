import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";

// --- INTERFACES ---

interface LinkedItem {
  id: number;
  group_id?: number;
  price_modifier: string | number;
}

interface GroupData {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  minSelections: number;
  maxSelections: number;
  defaultGrammage: string | number | null; 
  itemsOrder?: string | LinkedItem[] | null;
}

// Extraímos o tipo que a mutation de upsert espera automaticamente
type UpsertInput = Parameters<ReturnType<typeof trpc.admin.accompaniments.groups.upsert.useMutation>["mutateAsync"]>[0];

export function useAdminGroupsTab() {
  const utils = trpc.useUtils();

  // --- QUERIES ---
  const query = trpc.admin.accompaniments.groups.list.useQuery();

  // --- MUTATIONS ---
  const upsertMutation = trpc.admin.accompaniments.groups.upsert.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.groups.list.invalidate();
      utils.admin.accompaniments.dishSizes.list.invalidate();
    }
  });

  const deleteMutation = trpc.admin.accompaniments.groups.delete.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.groups.list.invalidate();
    }
  });

  // --- HELPERS ---
  const ensureArray = (data: string | LinkedItem[] | null | undefined): LinkedItem[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string' && data.trim() !== "") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    }
    return [];
  };

  /**
   * ✅ Normaliza o payload garantindo conformidade com UpsertInput
   */
  const sanitizePayload = (group: Partial<GroupData>, overrides: Partial<GroupData> = {}): UpsertInput => {
    const combined = { ...group, ...overrides };
    const currentItems = ensureArray(combined.itemsOrder);

    return {
      id: combined.id ? Number(combined.id) : undefined,
      name: combined.name || "",
      description: combined.description || null,
      isActive: combined.isActive ?? true,
      minSelections: Number(combined.minSelections ?? 0),
      maxSelections: Number(combined.maxSelections ?? 1),
      defaultGrammage: combined.defaultGrammage ? Number(combined.defaultGrammage) : 100,
      itemsOrder: currentItems.map(i => ({
        id: Number(i.id || i.group_id),
        price_modifier: String(i.price_modifier || "0.00")
      }))
    };
  };

  // --- LOGIC: TOGGLE OPTION ---
  const toggleOptionInGroup = async (groupId: number, optionId: number) => {
    const groupsList = (query.data as unknown) as GroupData[];
    const group = (groupsList || []).find(g => g.id === groupId);
    if (!group) return;

    const currentOptions = ensureArray(group.itemsOrder);
    const exists = currentOptions.find(
      (o) => Number(o.id || o.group_id) === Number(optionId)
    );

    let nextOptions: LinkedItem[];
    if (exists) {
      nextOptions = currentOptions.filter(
        (o) => Number(o.id || o.group_id) !== Number(optionId)
      );
    } else {
      nextOptions = [
        ...currentOptions, 
        { id: Number(optionId), price_modifier: "0.00" }
      ];
    }

    const payload = sanitizePayload(group, { itemsOrder: nextOptions });
    
    toast.promise(upsertMutation.mutateAsync(payload), {
      loading: "Atualizando vínculo...",
      success: "Vínculo atualizado!",
      error: (err: unknown) =>
        `Não foi possível atualizar: ${err instanceof Error ? err.message : "tente novamente."}`
    });
  };

  return {
    groups: (query.data as unknown as GroupData[]) || [],
    isLoading: query.isLoading,
    isMutating: upsertMutation.isPending || deleteMutation.isPending,

    actions: {
      upsert: (data: Partial<GroupData>) => {
        const groupsList = (query.data as unknown) as GroupData[];
        const originalGroup = data.id 
          ? (groupsList || []).find(g => g.id === Number(data.id)) 
          : undefined;

        if (!data.name?.trim() && !originalGroup?.name) {
          toast.error("O nome do grupo é obrigatório");
          return;
        }

        const payload = sanitizePayload(originalGroup || {}, data);
        
        toast.promise(upsertMutation.mutateAsync(payload), {
          loading: "Salvando grupo...",
          success: "Grupo salvo com sucesso!",
          error: (err: unknown) =>
            `Não foi possível salvar: ${err instanceof Error ? err.message : "tente novamente."}`
        });
      },

      remove: (id: number) => {
        toast.promise(deleteMutation.mutateAsync({ id }), {
          loading: "Removendo grupo...",
          success: "Grupo removido!",
          error: "Erro ao remover grupo."
        });
      },

      toggleOption: toggleOptionInGroup,

      updateItemsOrder: (groupId: number, newOrder: LinkedItem[]) => {
        const groupsList = (query.data as unknown) as GroupData[];
        const group = (groupsList || []).find(g => g.id === groupId);
        if (group) {
          const payload = sanitizePayload(group, { itemsOrder: newOrder });
          upsertMutation.mutate(payload);
        }
      }
    },
    mutation: upsertMutation
  };
}
