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
  
  // ✅ NOVA MUTATION: Alternar Visibilidade (Status)
  const toggleStatusMutation = trpc.admin.packages.updateStatus.useMutation({
    onSuccess: () => {
      utils.admin.packages.list.invalidate();
      toast.success("Visibilidade atualizada!");
    },
    onError: (err) => toast.error(`Falha ao alterar status: ${err.message}`)
  });

  const createMutation = trpc.admin.packages.create.useMutation({
    onSuccess: () => {
      toast.success("Pacote criado com sucesso!");
      utils.admin.packages.list.invalidate();
      closeDialog();
    }
  });

  const updateMutation = trpc.admin.packages.update.useMutation({
    onSuccess: () => {
      toast.success("Pacote atualizado!");
      utils.admin.packages.list.invalidate();
      closeDialog();
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
        customLabel: g.customLabel
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

  // ✅ HANDLER PARA O SWITCH DO CARD
  const handleToggleStatus = (id: string | number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "hidden" : "active";
    toggleStatusMutation.mutate({ id, status: newStatus });
  };

  const handleSave = (formData: any) => {
    const payload = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/ /g, '-'),
      description: formData.description || null,
      image_url: formData.image_url || null,
      isActive: formData.status === "active",
      number_of_options: Number(formData.number_of_options || 0),
      base_price: String(formData.base_price || "0").replace(',', '.'), 
      config: {
        slots: config.slots.map(s => ({
          name: s.name,
          dishIds: s.dishIds.map(id => Number(id)).filter(n => !isNaN(n)),
          groups: s.groups.map(g => ({
            id: Number(g.id),
            customLabel: g.customLabel || null
          })).filter(g => !isNaN(g.id))
        }))
      },
    };

    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, ...payload });
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
      handleEdit, 
      handleToggleStatus, // ✅ Exportado para o Card
      handleDelete: (id: number | string) => {
        if (confirm("Deseja realmente excluir este pacote?")) deleteMutation.mutate({ id });
      },
      closeDialog, 
      handleSave, 
      addSlot, 
      removeSlot, 
      updateSlotName, 
      updateSlotDishes, 
      updateSlotGroups,
      loadSlots 
    },
    data: { packages: packagesQuery.data ?? [], allDishes, allGroups },
    mutations: { createMutation, updateMutation, toggleStatusMutation }
  };
}