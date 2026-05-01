import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";

export type AdminTab = 'sizes' | 'groups' | 'items';

export function useAdminSizes() {
  const [activeTab, setActiveTab] = useState<AdminTab>('sizes');
  const [expandedSize, setExpandedSize] = useState<number | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [linkedGroups, setLinkedGroups] = useState<Record<number, number[]>>({});

  const utils = trpc.useUtils();

  // ============================================================================
  // 1. QUERIES
  // ============================================================================
  
  const sizesQuery = trpc.admin.accompaniments.dishSizes.list.useQuery(); 
  
  const groupsQuery = trpc.admin.accompaniments.groups.list.useQuery(undefined, {
    retry: false
  });

  const categoriesQuery = trpc.admin.accompaniments.categories.list.useQuery();
  
  const linksQuery = trpc.admin.accompaniments.dishSizes.getAccompanimentGroups.useQuery();

  const refreshAll = () => {
    utils.admin.accompaniments.invalidate();
  };

  // ============================================================================
  // 2. MUTATIONS
  // ============================================================================
  
  const createSize = trpc.admin.accompaniments.dishSizes.create.useMutation({ 
    onSuccess: () => {
      toast.success("Tamanho criado!");
      refreshAll();
    }
  });

  const updateSize = trpc.admin.accompaniments.dishSizes.update.useMutation({
    onSuccess: () => {
      // Invalida a lista para refletir mudanças no groupsOrder ou displayOrder
      utils.admin.accompaniments.dishSizes.list.invalidate();
    },
    onError: (err: any) => toast.error("Erro ao atualizar: " + err.message)
  });

  const deleteSize = trpc.admin.accompaniments.dishSizes.delete.useMutation({ 
    onSuccess: () => {
      toast.success("Tamanho removido.");
      refreshAll();
    }
  });

  const upsertGroup = trpc.admin.accompaniments.groups.upsert.useMutation({ 
    onSuccess: () => {
      toast.success("Grupo processado!");
      refreshAll();
    },
    onError: (err: any) => toast.error("Erro no grupo: " + err.message)
  });

  const deleteGroup = trpc.admin.accompaniments.groups.delete.useMutation({ 
    onSuccess: () => {
      toast.success("Grupo removido!");
      refreshAll();
    }
  });

  const upsertCategory = trpc.admin.accompaniments.categories.upsert.useMutation({
    onSuccess: () => {
      toast.success("Categoria salva!");
      refreshAll();
    }
  });

  const addLinkMutation = trpc.admin.accompaniments.dishSizes.linkAccompanimentToSize.useMutation();
  const removeLinkMutation = trpc.admin.accompaniments.dishSizes.unlinkAccompanimentFromSize.useMutation();

  // ============================================================================
  // 3. EFEITOS E AÇÕES
  // ============================================================================
  
  // Mapeia a tabela pivot para um objeto { sizeId: [groupIds] }
  useEffect(() => {
    if (linksQuery.data) {
      const mapping: Record<number, number[]> = {};
      const links = linksQuery.data as any[]; 
      
      links.forEach((link) => {
        const sId = Number(link.sizeId || link.size_id);
        const gId = Number(link.groupId || link.group_id); 
        
        if (!mapping[sId]) mapping[sId] = [];
        if (!mapping[sId].includes(gId)) mapping[sId].push(gId);
      });
      setLinkedGroups(mapping);
    }
  }, [linksQuery.data]);

  const toggleLink = async (sizeId: number, groupId: number) => {
    const currentLinks = linkedGroups[Number(sizeId)] || [];
    const isLinked = currentLinks.includes(Number(groupId));

    // UI Optimística: Atualiza o mapeamento de vínculos imediatamente
    setLinkedGroups(prev => {
      const sId = Number(sizeId);
      const gId = Number(groupId);
      const list = prev[sId] || [];
      const newList = isLinked ? list.filter(id => id !== gId) : [...list, gId];
      return { ...prev, [sId]: newList };
    });

    try {
      if (isLinked) {
        // 1. Remove da tabela pivot
        await removeLinkMutation.mutateAsync({ sizeId, groupId });
        
        // 2. Remove do array de ordem JSON do tamanho
        const size = (sizesQuery.data as any[])?.find(s => s.id === sizeId);
        if (size && Array.isArray(size.groupsOrder)) {
            const newOrder = size.groupsOrder.filter((id: number) => id !== groupId);
            await updateSize.mutateAsync({ id: sizeId, groupsOrder: newOrder });
        }
      } else {
        // 1. Adiciona na tabela pivot
        await addLinkMutation.mutateAsync({ sizeId, groupId });
        
        // 2. Adiciona ao final do array de ordem JSON do tamanho
        const size = (sizesQuery.data as any[])?.find(s => s.id === sizeId);
        const currentOrder = Array.isArray(size?.groupsOrder) ? size.groupsOrder : [];
        if (!currentOrder.includes(groupId)) {
            await updateSize.mutateAsync({ id: sizeId, groupsOrder: [...currentOrder, groupId] });
        }
      }
      
      // Sincroniza tudo com o servidor
      refreshAll(); 
      toast.success(isLinked ? "Vínculo removido" : "Grupo vinculado!");
    } catch (error) {
      toast.error("Erro ao processar vínculo.");
      linksQuery.refetch(); // Reverte para o estado real em caso de falha
    }
  };

  return {
    state: { 
      activeTab, 
      expandedSize, 
      expandedGroup, 
      linkedGroups, 
      isLoading: sizesQuery.isLoading || groupsQuery.isLoading || linksQuery.isLoading 
    },
    actions: { 
      setActiveTab, 
      setExpandedSize, 
      setExpandedGroup, 
      toggleLink,
      // Facilitador para salvar a nova ordem vinda do Drag and Drop da View
      updateSize: (id: number, data: any) => updateSize.mutate({ id, ...data })
    },
    data: { 
        sizes: (sizesQuery.data as any) || [], 
        groups: (groupsQuery.data as any) || [],
        categories: (categoriesQuery.data as any) || []
    },
    mutations: { 
        createSize, 
        updateSize, 
        deleteSize, 
        upsertGroup, 
        deleteGroup,
        upsertCategory
    }
  };
}