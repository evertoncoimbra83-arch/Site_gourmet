import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/_core/trpc"; 
import { keepPreviousData } from "@tanstack/react-query";
import { mapDishFromDb } from "./mappers"; 

type RawDbData = Record<string, unknown>;

export function useProducts() {
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(""); 
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: categoriesData } = trpc.public.dishes.categories.useQuery(
    undefined, 
    { staleTime: 1000 * 60 * 30 } 
  );
  
  const { data: productData, isLoading, error } = trpc.public.dishes.list.useQuery(
    {
      page: 1,
      perPage: 100, 
      search: debouncedSearch || undefined,
      category: selectedCategory ? selectedCategory : undefined,
    },
    { 
      placeholderData: keepPreviousData,
      retry: false 
    }
  );

  const products = useMemo(() => {
    const rawList = Array.isArray(productData) 
      ? (productData as RawDbData[])
      : (productData as unknown as { data?: RawDbData[] })?.data || [];

    if (!rawList.length) return [];
    
    return rawList
      .map((dish) => {
        const mappedDish = mapDishFromDb(dish);
        if (!mappedDish) return null;

        // ✅ CORREÇÃO: Usamos unknown em vez de any para satisfazer o ESLint
        // e incluímos o categoryId na reconstrução do objeto
        const baseMapped = mappedDish as unknown as Record<string, unknown>;
        
        return {
          ...mappedDish,
          categoryId: baseMapped.categoryId ?? dish.categoryId ?? dish.category_id ?? (dish.dish as RawDbData | undefined)?.categoryId
        };
      })
      .filter((dish): dish is NonNullable<typeof dish> => dish !== null);
  }, [productData]);

  const catList = useMemo(() => {
    if (!Array.isArray(categoriesData)) return [];
    
    return [...(categoriesData as RawDbData[])].sort((a, b) => {
      const orderA = Number(a.displayOrder ?? a.display_order ?? 0);
      const orderB = Number(b.displayOrder ?? b.display_order ?? 0);
      return orderA - orderB;
    });
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