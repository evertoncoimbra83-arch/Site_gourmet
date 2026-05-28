// logic/generator/package-adpter.ts
import { CandidateDish } from "./package-generator-types";
import { normalizeDishNutrition } from "../../../../../../shared/utils/dishNutritionNormalizer";
import { safeInteger } from "@/lib/safe-parse";

// ✅ Tipo local — sem importar schema Drizzle no bundle do cliente
export interface AdminDishForGenerator {
  id: string | number;
  name: string;
  basePrice?: string | number | null;
  price?: string | number | null;
  categoryId?: number | string | null;
  categoryName?: string | null;
  category?: { id: number; name: string } | string | null;
  sizeIds?: (string | number)[];
  isVegetarian?: boolean | number | null;
  isGlutenFree?: boolean | number | null;
  isLactoseFree?: boolean | number | null;
  proteins?: string | number | null;
  carbs?: string | number | null;
  energyKcal?: string | number | null;
  fatTotal?: string | number | null;
  fiber?: string | number | null;
  sodium?: string | number | null;
}

function identifyProteinKey(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("frango") || n.includes("sobrecoxa") || n.includes("filezinho") || n.includes("peito")) return "frango";
  if (n.includes("carne") || n.includes("patinho") || n.includes("mignon") || n.includes("costela") || n.includes("alcatra")) return "carne_vermelha";
  if (n.includes("peixe") || n.includes("tilápia") || n.includes("salmão") || n.includes("atum") || n.includes("bacalhau")) return "peixe";
  if (n.includes("porco") || n.includes("lombo") || n.includes("suíno")) return "suíno";
  if (n.includes("ovo") || n.includes("omelete") || n.includes("vegetariano") || n.includes("vegano")) return "veggie";
  if (n.includes("camarão") || n.includes("frutos do mar")) return "frutos_do_mar";
  return "outros";
}

export function mapAdminDishesToCandidates(allDishes: AdminDishForGenerator[]): CandidateDish[] {
  return allDishes.map((dish) => {
    const name = dish.name || "";
    
    // ✅ CORREÇÃO SEM ANY: Criamos um objeto compatível com o que o normalizador espera
    // Fazemos o parse do ID para número para evitar o erro 2345
    const nutritionInput = {
      ...dish,
      id: typeof dish.id === 'string' ? safeInteger(dish.id) : dish.id
    } as Parameters<typeof normalizeDishNutrition>[0];

    const nutrition = normalizeDishNutrition(nutritionInput);

    const categoryId = dish.categoryId ? String(dish.categoryId) : null;

    const categoryName =
      dish.categoryName ||
      (typeof dish.category === "object" && dish.category !== null
        ? (dish.category as { name: string }).name
        : typeof dish.category === "string"
        ? dish.category
        : "Geral");

    const sizeIds = (dish.sizeIds || []).map(String);

    return {
      id: String(dish.id),
      name,
      categoryId,
      categoryName,
      category: categoryName, 
      sizeId: sizeIds[0] || "", 
      sizeIds,
      protein: nutrition.proteins,
      carbs: nutrition.carbs,
      calories: nutrition.energyKcal,
      price: Number(dish.basePrice ?? dish.price ?? 0),
      popularityScore: 5,
      proteinKey: identifyProteinKey(name),
      allowedGroupIds: [],
      isVegetarian: Boolean(dish.isVegetarian),
      isGlutenFree: Boolean(dish.isGlutenFree),
      isLactoseFree: Boolean(dish.isLactoseFree),
    };
  });
}
