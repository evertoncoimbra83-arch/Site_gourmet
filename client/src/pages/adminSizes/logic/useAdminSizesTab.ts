import { useMemo } from "react";
import { trpc } from "@/_core/trpc";

// --- INTERFACES ---

interface DishSize {
  id?: number;
  name: string;
  isActive: boolean;
  priceModifier: string | number;
  mainDishWeight: string | number;
  iconKey: string;
  order: number;
  // ✅ Tornado opcional para permitir o uso de 'delete' na duplicação sem erro TS2790
  groupsOrder?: number[]; 
  
  // Campos opcionais do banco (snake_case)
  is_active?: boolean | number;
  price_modifier?: string | number;
  main_dish_weight?: string | number;
  icon_key?: string;
  groups_order?: string | number[];
  created_at?: string | Date;
  updated_at?: string | Date;
  [key: string]: unknown;
}

interface SizeLink {
  sizeId: number | string;
  accompanimentGroupId?: number | string;
  groupId?: number | string;
}

export function useAdminSizesTab() {
  const utils = trpc.useUtils();

  // --- QUERIES ---
  const query = trpc.admin.accompaniments.dishSizes.list.useQuery();
  const linksQuery = trpc.admin.accompaniments.dishSizes.getAccompanimentGroups.useQuery();

  // --- MUTATIONS ---
  const upsertMutation = trpc.admin.accompaniments.dishSizes.upsert.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.dishSizes.list.invalidate();
    }
  });

  const deleteMutation = trpc.admin.accompaniments.dishSizes.delete.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.dishSizes.list.invalidate();
    }
  });

  const reorderMutation = trpc.admin.accompaniments.dishSizes.reorder.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.dishSizes.list.invalidate();
    }
  });

  const toggleLinkMutation = trpc.admin.accompaniments.dishSizes.toggleLink.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.dishSizes.getAccompanimentGroups.invalidate();
      utils.admin.accompaniments.dishSizes.list.invalidate();
    }
  });

  // --- DATA MAPPING ---
  const sizes = useMemo(() => {
    if (!query.data) return [];
    const rawData = (query.data as unknown) as DishSize[];
    
    return rawData.map((s) => {
      let parsedOrder: number[] = [];
      try {
        const rawOrder = s.groupsOrder ?? s.groups_order;
        if (Array.isArray(rawOrder)) {
          parsedOrder = rawOrder.map(Number);
        } else if (typeof rawOrder === 'string') {
          const parsed = JSON.parse(rawOrder);
          parsedOrder = Array.isArray(parsed) ? parsed.map(Number) : [];
        }
      } catch { 
        parsedOrder = []; 
      }

      return {
        ...s,
        id: Number(s.id),
        isActive: Boolean(s.isActive ?? s.is_active ?? true),
        priceModifier: String(s.priceModifier ?? s.price_modifier ?? "0.00"),
        mainDishWeight: String(s.mainDishWeight ?? s.main_dish_weight ?? "200.00"),
        iconKey: s.iconKey ?? s.icon_key ?? "Box",
        order: Number(s.order ?? 999),
        groupsOrder: parsedOrder
      };
    }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [query.data]);

  const linkedGroups = useMemo(() => {
    const map: Record<number, number[]> = {};
    const rawLinks = (linksQuery.data as unknown) as SizeLink[];
    
    (rawLinks || []).forEach((link) => {
      const sId = Number(link.sizeId);
      const gId = Number(link.accompanimentGroupId || link.groupId);
      if (!map[sId]) map[sId] = [];
      if (!map[sId].includes(gId)) map[sId].push(gId);
    });
    return map;
  }, [linksQuery.data]);

  // Tipo utilitário para Mutation
  type UpsertInput = Parameters<typeof upsertMutation.mutate>[0];

  // --- ACTIONS ---
  return {
    sizes,
    linkedGroups,
    isLoading: query.isLoading || linksQuery.isLoading,
    
    actions: {
      create: (data: DishSize) => {
        const payload = { 
          ...data, 
          mainDishWeight: Number(data.mainDishWeight) 
        };
        upsertMutation.mutate(payload as unknown as UpsertInput);
      },
      
      update: (id: number, data: Partial<DishSize>) => {
        const payload = { 
          ...data,
          id: Number(id),
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
          mainDishWeight: data.mainDishWeight ? Number(data.mainDishWeight) : undefined,
        };
        upsertMutation.mutate(payload as unknown as UpsertInput);
      },
      
      remove: (id: number) => deleteMutation.mutate({ id }),
      
      reorder: (ids: number[]) => reorderMutation.mutate({ ids }),
      
      toggleLink: (sizeId: number, groupId: number) => 
        toggleLinkMutation.mutateAsync({ 
          sizeId: Number(sizeId), 
          accompanimentGroupId: Number(groupId) 
        }),
        
      duplicate: (size: DishSize) => {
        // ✅ Cópia limpa usando delete (permitido pois os campos são opcionais na interface)
        const payload = { ...size };
        
        delete payload.id;
        delete payload.created_at;
        delete payload.updated_at;
        delete payload.groupsOrder;
        delete payload.groups_order;

        const sanitizedPayload = {
          ...payload,
          name: `${size.name} (Cópia)`,
          isActive: true,
          mainDishWeight: Number(size.mainDishWeight)
        };

        upsertMutation.mutate(sanitizedPayload as unknown as UpsertInput);
      }
    }
  };
}