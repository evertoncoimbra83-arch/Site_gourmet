import { useState, useMemo } from "react";
import { trpc } from "@/_core/trpc"; 
import { keepPreviousData } from "@tanstack/react-query";

export function useProducts() {
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // 1. Rota pública para categorias
  const { data: categoriesData } = trpc.products.categories.useQuery();
  
  // 2. Rota pública para listagem
  const { data: productData, isLoading, error } = trpc.products.list.useQuery(
    {
      page: 1,
      perPage: 100, 
      search: search || undefined,
      category: selectedCategory ? selectedCategory : undefined,
    },
    { 
      placeholderData: keepPreviousData,
      retry: false 
    }
  );

  // 3. ✅ REVISÃO: Ordenação de Engenharia (Tamanhos e DisplayOrder)
  const products = useMemo(() => {
    if (!productData?.data) return [];
    
    // Mapeamos os produtos garantindo que os tamanhos internos 
    // venham na ordem correta para o Drawer não bugar
    return productData.data.map((dish: any) => {
      if (!dish.sizes) return dish;

      return {
        ...dish,
        // ✅ Ordena os tamanhos pelo displayOrder (P antes de G, etc)
        sizes: [...dish.sizes].sort((a: any, b: any) => 
          (a.displayOrder || 0) - (b.displayOrder || 0)
        )
      };
    });
  }, [productData]);

  // 4. ✅ REVISÃO: Ordenação das Categorias
  const catList = useMemo(() => {
    if (!Array.isArray(categoriesData)) return [];
    
    // Ordena as categorias pelo displayOrder configurado no Admin
    return [...categoriesData].sort((a: any, b: any) => 
      (a.displayOrder || 0) - (b.displayOrder || 0)
    );
  }, [categoriesData]);

  return {
    state: {
      selectedDishId,
      search,
      selectedCategory,
      products,
      catList,
      isLoading,
      error
    },
    actions: {
      setSelectedDishId,
      setSearch,
      setSelectedCategory,
    }
  };
}