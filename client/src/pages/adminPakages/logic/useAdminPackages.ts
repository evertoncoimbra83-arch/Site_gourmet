import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";

export interface PackageSlot {
  name: string;
  dishIds: string[];
  groups: {
    id: string;
    customLabel?: string;
  }[];
}

export function useAdminPackages() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [expandedPackageId, setExpandedPackageId] = useState<number | string | null>(null);
  const [config, setConfig] = useState<{ slots: PackageSlot[] }>({ slots: [] });

  const utils = trpc.useUtils();

  // --- QUERIES ---
  const packagesQuery = trpc.admin.packages.list.useQuery();
  const { data: allDishes = [] } = trpc.admin.packages.getDishes.useQuery();
  const { data: allGroups = [] } = trpc.admin.packages.getAccompanimentGroups.useQuery();

  // --- MUTATIONS ---
  const toggleStatusMutation = trpc.admin.packages.updateStatus.useMutation({
    onSuccess: () => {
      utils.admin.packages.list.invalidate();
      toast.success("Visibilidade atualizada!");
    },
    onError: (err: any) => toast.error(`Falha ao alterar status: ${err.message}`)
  });

  const createMutation = trpc.admin.packages.create.useMutation({
    onSuccess: () => {
      toast.success("Pacote criado com sucesso!");
      utils.admin.packages.list.invalidate();
      closeDialog();
    },
    onError: (err: any) => toast.error(`Erro ao criar: ${err.message}`)
  });

  const updateMutation = trpc.admin.packages.update.useMutation({
    onSuccess: () => {
      toast.success("Pacote atualizado!");
      utils.admin.packages.list.invalidate();
      closeDialog();
    },
    onError: (err: any) => {
        console.error("Erro de validação tRPC:", err.data?.zodError?.fieldErrors || err.message);
        toast.error(`Erro ao atualizar: ${err.message}`);
    }
  });

  const deleteMutation = trpc.admin.packages.delete.useMutation({
    onSuccess: () => {
      toast.success("Pacote removido.");
      utils.admin.packages.list.invalidate();
    }
  });

  // --- AÇÕES DE ESTRUTURA ---

  const loadSlots = (configData: any) => {
    let loadedConfig = { slots: [] };
    if (configData) {
      try {
        loadedConfig = typeof configData === 'string' ? JSON.parse(configData) : configData;
      } catch (e) { /* silent */ }
    }

    const sanitizedSlots = (loadedConfig?.slots || []).map((s: any) => ({
      name: s.name || "Sem nome",
      dishIds: Array.isArray(s.dishIds) ? s.dishIds.map((id: any) => String(id)) : [],
      groups: Array.isArray(s.groups) ? s.groups.map((g: any) => ({
        id: String(g.id),
        customLabel: g.customLabel || ""
      })) : []
    }));

    setConfig({ slots: sanitizedSlots });
  };

  const addSlot = () => {
    setConfig(prev => ({
      slots: [...(prev?.slots ?? []), { name: `Marmita ${(prev?.slots?.length || 0) + 1}`, dishIds: [], groups: [] }]
    }));
  };

  const removeSlot = (index: number) => {
    setConfig(prev => ({ slots: (prev?.slots ?? []).filter((_, i) => i !== index) }));
  };

  const reorderSlots = (startIndex: number, endIndex: number) => {
    setConfig(prev => {
      const result = Array.from(prev.slots);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { slots: result };
    });
  };

  const updateSlotName = (index: number, name: string) => {
    setConfig(prev => {
      const newSlots = [...(prev.slots || [])];
      if (newSlots[index]) newSlots[index].name = name;
      return { slots: newSlots };
    });
  };

  const updateSlotDishes = (slotIndex: number, dishIds: string[]) => {
    setConfig(prev => {
      const newSlots = [...(prev.slots || [])];
      if (newSlots[slotIndex]) newSlots[slotIndex] = { ...newSlots[slotIndex], dishIds: dishIds.map(String) };
      return { slots: newSlots };
    });
  };

  const updateSlotGroups = (slotIndex: number, groups: { id: string; customLabel?: string }[]) => {
    setConfig(prev => {
      const newSlots = [...(prev.slots || [])];
      if (newSlots[slotIndex]) newSlots[slotIndex] = { ...newSlots[slotIndex], groups };
      return { slots: newSlots };
    });
  };

  // --- HANDLERS ---

  const handleCreate = () => {
    setEditingPackage(null);
    setConfig({ slots: [] });
    setIsDialogOpen(true);
  };

  const handleEdit = (pkg: any) => {
    setEditingPackage(pkg);
    loadSlots(pkg?.config);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPackage(null);
    setConfig({ slots: [] });
  };

  const handleToggleStatus = (id: string | number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "hidden" : "active";
    toggleStatusMutation.mutate({ id, status: newStatus });
  };

  const handleSave = (formData: any) => {
    // ✅ Validação de segurança reforçada
    if (!formData.name) {
        return toast.error("O nome do pacote é obrigatório.");
    }

    const payload = {
      name: String(formData.name).trim(),
      slug: String(formData.slug || formData.name).toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
      description: formData.description || "",
      image_url: formData.image_url || "",
      isActive: Boolean(formData.isActive ?? (formData.status === "active")),
      number_of_options: Number(formData.number_of_options || 0),
      display_order: Number(formData.display_order || 0),
      
      base_price: String(formData.base_price || "0").replace(',', '.'), 
      sale_price: (formData.sale_price && formData.sale_price !== "" && formData.sale_price !== "0.00") 
        ? String(formData.sale_price).replace(',', '.') 
        : null,

      config: {
        slots: (config.slots || []).map(s => ({
          name: String(s.name || "Marmita"),
          dishIds: (s.dishIds || []).map(id => Number(id)).filter(n => !isNaN(n)),
          groups: (s.groups || []).map(g => ({
            id: Number(g.id),
            customLabel: g.customLabel || null
          })).filter(g => !isNaN(g.id))
        }))
      },
    };

    if (editingPackage && editingPackage.id) {
      updateMutation.mutate({ id: String(editingPackage.id), ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return {
    state: { isDialogOpen, editingPackage, config, expandedPackageId, isLoading: packagesQuery.isLoading },
    actions: { 
      setIsDialogOpen, 
      setEditingPackage, 
      setExpandedPackageId, 
      handleCreate, 
      handleEdit, 
      handleToggleStatus,
      handleDelete: (id: number | string) => {
        if (confirm("Deseja realmente excluir este pacote?")) deleteMutation.mutate({ id });
      },
      closeDialog, 
      handleSave, 
      addSlot, 
      removeSlot, 
      reorderSlots, 
      updateSlotName, 
      updateSlotDishes, 
      updateSlotGroups,
      loadSlots 
    },
    data: { packages: packagesQuery.data ?? [], allDishes, allGroups },
    mutations: { createMutation, updateMutation, toggleStatusMutation }
  };
}