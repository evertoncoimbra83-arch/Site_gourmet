// client/src/pages/adminPackages/logic/hooks/useAdminPackages.ts
import { useState, useCallback, useMemo } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import { Slot, SlotGroup } from "../generator/smartGenerator";
import { mapAdminDishesToCandidates, AdminDishForGenerator } from "../generator/package-adapter";

export interface AdminDish {
  id: string | number;
  name: string;
  price?: string | number;
  basePrice?: string | number;
  categoryId?: number | string | null;
  category?: { id: number; name: string } | string | null;
  categoryName?: string;
}

export interface DbCategory {
  id: number | string;
  name: string;
}

interface AccompanimentGroupCatalog {
  id: string | number;
  name: string;
  itemsOrder?: unknown;
}

export interface AdminPackage {
  id: string | number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  status: string;
  isActive: boolean;
  number_of_options: number;
  display_order: number;
  size_id: number;
  base_price: string | number;
  sale_price?: string | number | null;
  config: string | { slots: Slot[] };
  highlights?: string;
  category?: string;
  isPopular?: boolean | number;
}

export interface PackageFormData {
  name: string;
  slug?: string;
  description?: string;
  highlights?: string;
  category?: string;
  is_popular?: boolean;
  image_url?: string;
  isActive?: boolean;
  status?: string;
  number_of_options?: string | number;
  display_order?: string | number;
  size_id?: string | number;
  base_price?: string | number;
  sale_price?: string | number;
}

interface RawPackageSlotGroup {
  id: string | number;
  customLabel?: string;
  optionIds?: (string | number)[];
}

interface RawPackageSlot {
  name?: string;
  dishIds?: (string | number)[];
  sizeId?: string | number;
  groups?: RawPackageSlotGroup[];
}

interface TRPCErrorPayload {
  message: string;
}

function parseGroupOptionIds(itemsOrder: unknown): string[] {
  try {
    const parsed =
      typeof itemsOrder === "string" ? JSON.parse(itemsOrder) : itemsOrder;

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const typedItem = item as { id?: string | number; group_id?: string | number };
        const optionId = typedItem.group_id ?? typedItem.id;
        return optionId != null ? String(optionId) : null;
      })
      .filter((optionId): optionId is string => Boolean(optionId));
  } catch {
    return [];
  }
}

function normalizeSlotGroups(
  groups: RawPackageSlotGroup[] | undefined,
  accompanimentGroups: AccompanimentGroupCatalog[]
): SlotGroup[] {
  const groupCatalog = accompanimentGroups.map((group) => ({
    id: String(group.id),
    name: String(group.name || "Acompanhamento"),
    optionIds: parseGroupOptionIds(group.itemsOrder),
  }));

  // Mapa: optionId → DB group ID (para grupos manuais do banco)
  const optionToGroupId = new Map<string, string>();
  groupCatalog.forEach((group) => {
    group.optionIds.forEach((optionId) => {
      if (!optionToGroupId.has(optionId)) {
        optionToGroupId.set(optionId, group.id);
      }
    });
  });

  const grouped = new Map<string, SlotGroup>();

  for (const group of groups || []) {
    const rawId = String(group.id);
    const hasExplicitOptions =
      Array.isArray(group.optionIds) && group.optionIds.length > 0;
    const rawOptionIds = hasExplicitOptions
      ? group.optionIds!.map((id) => String(id))
      : [rawId];

    // ✅ FIX 1: Detecta se é um grupo do banco (ID numérico) ou do Smart Generator (UUID)
    const isCatalogGroup = groupCatalog.some((c) => c.id === rawId);

    const resolvedGroupId = isCatalogGroup
      ? rawId // Grupo do banco — usa o ID direto
      : hasExplicitOptions
      ? rawId // ✅ Grupo do Smart Generator com optionIds — mantém o UUID, NÃO divide por grupo do banco
      : rawOptionIds.map((id) => optionToGroupId.get(id)).find(Boolean) || rawId;

    const catalogEntry = groupCatalog.find((c) => c.id === resolvedGroupId);
    const existing = grouped.get(resolvedGroupId);

    // ✅ FIX 2: Preserva o label do usuário — só usa o nome do catálogo como fallback
    const label = group.customLabel || catalogEntry?.name || "Acompanhamento";

    if (!existing) {
      grouped.set(resolvedGroupId, {
        id: resolvedGroupId,
        customLabel: label,
        optionIds: [...new Set(rawOptionIds)],
      });
    } else {
      existing.optionIds = [
        ...new Set([...(existing.optionIds || []), ...rawOptionIds]),
      ];
      if (!existing.customLabel) {
        existing.customLabel = label;
      }
    }
  }

  return Array.from(grouped.values());
}

export function useAdminPackages() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<AdminPackage | null>(null);
  const [expandedPackageId, setExpandedPackageId] = useState<number | string | null>(null);
  const [config, setConfig] = useState<{ slots: Slot[] }>({ slots: [] });

  const utils = trpc.useUtils();

  const packagesQuery = trpc.admin.packages.list.useQuery();
  const dishesQuery = trpc.admin.packages.getDishes.useQuery();
  const rawDishes = (dishesQuery.data as AdminDish[]) ?? [];

  const optionsQuery = trpc.admin.packages.getAllAccompanimentOptions.useQuery();
  const allOptions = optionsQuery.data ?? [];

  const groupsQuery = trpc.admin.accompaniments.groups.list.useQuery();
  const allAccompanimentGroups =
    (groupsQuery.data as AccompanimentGroupCatalog[]) ?? [];

  const sizesQuery = trpc.admin.packages.getAvailableSizes.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });
  const allSizes = sizesQuery.data ?? [];

  const categoriesQuery = trpc.admin.categories.list.useQuery();
  const allCategories = (categoriesQuery.data as DbCategory[]) ?? [];

  const allDishes = useMemo(() => {
    const catMap = new Map<string, string>();
    const safeCategories = Array.isArray(allCategories) ? allCategories : [];

    safeCategories.forEach((category) => {
      if (category.id && category.name) {
        catMap.set(String(category.id), String(category.name));
      }
    });

    // Usamos o adapter oficial para garantir que todos os campos de CandidateDish 
    // (nutrição, sizeIds, etc) sejam preenchidos corretamente.
const candidates = mapAdminDishesToCandidates(rawDishes as AdminDishForGenerator[]);

    return candidates.map(candidate => {
      const idStr = String(candidate.categoryId);
      const mappedCategoryName = candidate.categoryId && catMap.has(idStr) 
        ? catMap.get(idStr)! 
        : (candidate.categoryName || "Sem Categoria");

      return { 
        ...candidate, 
        categoryName: mappedCategoryName,
        category: mappedCategoryName 
      };
    });
  }, [rawDishes, allCategories]);

  const totalDishesPrice = useMemo(() => {
    if (!config.slots.length) return 0;

    return config.slots.reduce((acc, slot) => {
      const firstDishId = slot.dishIds[0];
      if (!firstDishId) return acc;
      const dish = allDishes.find((item) => String(item.id) === String(firstDishId));
      return acc + (Number(dish?.price) || 0);
    }, 0);
  }, [config.slots, allDishes]);

  const toggleStatusMutation = trpc.admin.packages.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      utils.admin.packages.list.invalidate();
    },
    onError: (err: TRPCErrorPayload) => toast.error("Erro: " + err.message),
  });

  const createMutation = trpc.admin.packages.create.useMutation({
    onSuccess: () => {
      toast.success("Pacote criado!");
      utils.admin.packages.list.invalidate();
      setIsDialogOpen(false);
    },
    onError: (err: TRPCErrorPayload) => toast.error("Erro ao criar: " + err.message),
  });

  const updateMutation = trpc.admin.packages.update.useMutation({
    onSuccess: () => {
      toast.success("Pacote atualizado!");
      utils.admin.packages.list.invalidate();
      setIsDialogOpen(false);
    },
    onError: (err: TRPCErrorPayload) =>
      toast.error("Erro ao atualizar: " + err.message),
  });

  const deleteMutation = trpc.admin.packages.delete.useMutation({
    onSuccess: () => {
      toast.success("Pacote excluido!");
      utils.admin.packages.list.invalidate();
    },
    onError: (err: TRPCErrorPayload) => toast.error("Erro ao excluir: " + err.message),
  });

  const loadSlots = useCallback(
    (configData: unknown) => {
      let loadedConfig: { slots?: RawPackageSlot[] } | null = null;

      if (configData) {
        try {
          loadedConfig =
            typeof configData === "string"
              ? (JSON.parse(configData) as { slots?: RawPackageSlot[] })
              : (configData as { slots?: RawPackageSlot[] });
        } catch {
          loadedConfig = null;
        }
      }

      const sanitizedSlots: Slot[] = (loadedConfig?.slots || []).map((slot) => ({
        name: String(slot.name || "Marmita"),
        sizeId: slot.sizeId ? String(slot.sizeId) : "",
        dishIds: Array.isArray(slot.dishIds)
          ? slot.dishIds.map((id) => String(id))
          : [],
        reasons: [],
        groups: normalizeSlotGroups(slot.groups, allAccompanimentGroups),
      }));

      setConfig({ slots: sanitizedSlots });
    },
    [allAccompanimentGroups]
  );

  // ✅ NOVO: Carrega slots gerados pelo Smart Generator sem normalizar contra o banco
  // Os grupos do gerador usam UUIDs e labels do usuário — normalizeSlotGroups preserva isso agora,
  // mas esta action garante que o config é setado diretamente sem parsing de JSON
  const loadGeneratedSlots = useCallback(
    (generatedSlots: Slot[]) => {
      const sanitizedSlots: Slot[] = generatedSlots.map((slot) => ({
        name: String(slot.name || "Marmita"),
        sizeId: slot.sizeId ? String(slot.sizeId) : "",
        dishIds: (slot.dishIds || []).map(String),
        reasons: slot.reasons || [],
        // ✅ normalizeSlotGroups agora preserva UUIDs e labels do usuário
        groups: normalizeSlotGroups(
          (slot.groups || []).map((g) => ({
            id: g.id,
            customLabel: g.customLabel,
            optionIds: g.optionIds,
          })),
          allAccompanimentGroups
        ),
      }));

      setConfig({ slots: sanitizedSlots });
    },
    [allAccompanimentGroups]
  );

  const handleEdit = useCallback(
    (pkg: AdminPackage) => {
      setEditingPackage(pkg);
      loadSlots(pkg?.config);
      setIsDialogOpen(true);
    },
    [loadSlots]
  );

  const handleCreate = useCallback(() => {
    setEditingPackage(null);
    setConfig({ slots: [] });
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingPackage(null);
    setConfig({ slots: [] });
  }, []);

  const handleSave = async (formData: PackageFormData) => {
    if (!formData.name) return toast.warning("Nome obrigatorio.");

    const finalSizeId = parseInt(String(formData.size_id), 10);
    if (isNaN(finalSizeId) || finalSizeId <= 0) {
      return toast.warning("Selecione um tamanho.");
    }

    try {
      const payload = {
        name: String(formData.name).trim(),
        slug: String(formData.slug || formData.name)
          .toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-"),
        description: formData.description || "",
        highlights: formData.highlights || "",
        category: formData.category || "Todos",
        is_popular: Boolean(formData.is_popular),
        image_url: formData.image_url || "",
        isActive: Boolean(formData.isActive ?? (formData.status === "active")),
        number_of_options: Number(formData.number_of_options || config.slots.length),
        display_order: Number(formData.display_order || 0),
        size_id: finalSizeId,
        base_price: String(formData.base_price || "0").replace(",", "."),
        sale_price:
          formData.sale_price &&
          formData.sale_price !== "0.00" &&
          formData.sale_price !== ""
            ? String(formData.sale_price).replace(",", ".")
            : null,
        config: {
          slots: (config.slots || []).map((slot) => ({
            name: String(slot.name || "Marmita"),
            sizeId: slot.sizeId ? parseInt(String(slot.sizeId), 10) : finalSizeId,
            dishIds: (slot.dishIds || []).map((id) => String(id)),
            groups: normalizeSlotGroups(
              (slot.groups || []).map((group) => ({
                id: group.id,
                customLabel: group.customLabel,
                optionIds: group.optionIds,
              })),
              allAccompanimentGroups
            ).map((group) => ({
              id: String(group.id),
              customLabel: group.customLabel,
              optionIds: group.optionIds || [],
            })),
          })),
        },
      };

      if (editingPackage?.id) {
        updateMutation.mutate({ id: String(editingPackage.id), ...payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch {
      toast.error("Erro ao salvar.");
    }
  };

  return {
    state: {
      isDialogOpen,
      editingPackage,
      config,
      expandedPackageId,
      isLoading:
        packagesQuery.isLoading ||
        categoriesQuery.isLoading ||
        optionsQuery.isLoading ||
        groupsQuery.isLoading,
      totalDishesPrice,
    },
    actions: {
      setIsDialogOpen,
      setEditingPackage,
      setExpandedPackageId,
      handleCreate,
      handleEdit,
      closeDialog,
      handleSave,
      loadGeneratedSlots, // ✅ Novo — use este no onGenerated do PackageAutoGenerator
      handleToggleStatus: (id: string | number, currentStatus: string) => {
        const newStatus = currentStatus === "active" ? "hidden" : "active";
        toggleStatusMutation.mutate({ id: String(id), status: newStatus });
      },
      handleDelete: (id: number | string) => {
        if (confirm("Excluir pacote?")) {
          deleteMutation.mutate({ id: String(id) });
        }
      },
      addSlot: () =>
        setConfig((prev) => ({
          slots: [
            ...prev.slots,
            { 
              name: `Marmita ${prev.slots.length + 1}`, 
              dishIds: [], 
              groups: [], 
              sizeId: "",
              reasons: [] 
            },
          ],
        })),
      removeSlot: (index: number) =>
        setConfig((prev) => ({
          slots: prev.slots.filter((_, currentIndex) => currentIndex !== index),
        })),
      duplicateSlot: (index: number) =>
        setConfig((prev) => {
          const res = [...prev.slots];
          const src = res[index];
          if (!src) return prev;
          res.splice(index + 1, 0, {
            ...src,
            name: `${src.name} (Copia)`,
            dishIds: [...src.dishIds],
            groups: src.groups.map((group) => ({ ...group })),
          });
          return { slots: res };
        }),
      reorderSlots: (start: number, end: number) =>
        setConfig((prev) => {
          const res = [...prev.slots];
          const [rem] = res.splice(start, 1);
          res.splice(end, 0, rem);
          return { slots: res };
        }),
      updateSlotName: (index: number, name: string) =>
        setConfig((prev) => {
          const res = [...prev.slots];
          if (res[index]) res[index] = { ...res[index], name };
          return { slots: res };
        }),
      updateSlotDishes: (index: number, ids: string[]) =>
        setConfig((prev) => {
          const res = [...prev.slots];
          if (res[index]) res[index] = { ...res[index], dishIds: ids };
          return { slots: res };
        }),
      updateSlotGroups: (index: number, groups: SlotGroup[]) =>
        setConfig((prev) => {
          const res = [...prev.slots];
          if (res[index]) {
            res[index] = {
              ...res[index],
              groups: normalizeSlotGroups(
                groups.map((group) => ({
                  id: group.id,
                  customLabel: group.customLabel,
                  optionIds: group.optionIds,
                })),
                allAccompanimentGroups
              ),
            };
          }
          return { slots: res };
        }),
      updateSlotSize: (index: number, sizeId: string | number | undefined) =>
        setConfig((prev) => {
          const res = [...prev.slots];
          if (res[index]) {
            res[index] = { ...res[index], sizeId: sizeId ? String(sizeId) : "" };
          }
          return { slots: res };
        }),
      loadSlots,
    },
    data: {
      packages: packagesQuery.data ?? [],
      allDishes,
      allOptions,
      allAccompanimentGroups,
      allSizes,
      allCategories: Array.isArray(allCategories) ? allCategories : [],
    },
    mutations: {
      createMutation,
      updateMutation,
      toggleStatusMutation,
      deleteMutation,
    },
  };
}