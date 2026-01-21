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
  // 1. QUERIES (Caminho fixo para dishSizes)
  // ============================================================================
  
  // ✅ Agora apontamos diretamente para o caminho correto
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
      refreshAll();
      toast.success("Dados atualizados!");
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

  const toggleGroupLink = async (sizeId: number, groupId: number) => {
    const currentLinks = linkedGroups[Number(sizeId)] || [];
    const isLinked = currentLinks.includes(Number(groupId));

    setLinkedGroups(prev => {
      const sId = Number(sizeId);
      const gId = Number(groupId);
      const list = prev[sId] || [];
      const newList = isLinked ? list.filter(id => id !== gId) : [...list, gId];
      return { ...prev, [sId]: newList };
    });

    try {
      if (isLinked) {
        await removeLinkMutation.mutateAsync({ sizeId, groupId });
      } else {
        await addLinkMutation.mutateAsync({ sizeId, groupId });
      }
      refreshAll(); 
    } catch (error) {
      toast.error("Erro ao processar vínculo.");
      linksQuery.refetch(); 
    }
  };

  return {
    state: { activeTab, expandedSize, expandedGroup, linkedGroups, isLoading: sizesQuery.isLoading || groupsQuery.isLoading || linksQuery.isLoading },
    actions: { setActiveTab, setExpandedSize, setExpandedGroup, toggleGroupLink },
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