import { useState, useMemo } from "react";
import { trpc } from "@/_core/trpc"; 
import { keepPreviousData } from "@tanstack/react-query";

export function useProducts() {
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // 1. ✅ Rota pública para categorias (resolve o erro 403 Forbidden)
  const { data: categoriesData } = trpc.products.categories.useQuery();
  
  // 2. ✅ Rota pública para listagem
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

  // 3. ✅ CORREÇÃO DO VS CODE: 
  // O seu servidor retorna 'data', não 'dishes'. Ajustamos aqui:
  const products = useMemo(() => {
    if (!productData) return [];
    // O erro do VS Code confirmou que a propriedade correta é 'data'
    return productData.data || []; 
  }, [productData]);

  const catList = useMemo(() => {
    return Array.isArray(categoriesData) ? categoriesData : [];
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