/**
 * --- INTERFACES DE DADOS BRUTOS (DB) ---
 */
interface RawNutrition {
  energyKcal?: string | number;
  energy_kcal?: string | number;
  kcal?: string | number;
  energyKj?: string | number;
  energy_kj?: string | number;
  kj?: string | number;
  proteins?: string | number;
  protein?: string | number;
  carbs?: string | number;
  carbohydrates?: string | number;
  fatTotal?: string | number;
  fat_total?: string | number;
  fats?: string | number;
  fatSaturated?: string | number;
  fat_saturated?: string | number;
  fatTrans?: string | number;
  fat_trans?: string | number;
  fiber?: string | number;
  sodium?: string | number;
  addedSugars?: string | number;
  added_sugars?: string | number;
  calcium?: string | number;
  iron?: string | number;
  yieldWeight?: string | number;
  yield_weight?: string | number;
  mainDishWeight?: string | number;
  main_dish_weight?: string | number;
  ingredients?: string;
}

interface RawOption extends RawNutrition {
  id: string | number;
  name: string;
  priceModifier?: string | number;
  price_modifier?: string | number;
  iconKey?: string;
  icon_key?: string;
  category?: { iconKey?: string; color?: string };
  categoryColor?: string;
  show_nutrition?: boolean;
  showNutrition?: boolean;
}

interface RawGroup {
  id: string | number;
  groupId?: string | number;
  name: string;
  defaultGrammage?: number;
  default_grammage?: number;
  maxSelections?: number;
  max_selections?: number;
  minSelections?: number;
  min_selections?: number;
  isRequired?: boolean;
  is_required?: boolean;
  itemsOrder?: string | number[];
  items_order?: string | number[];
  options?: RawOption[];
}

interface RawSize {
  id: string | number;
  name: string;
  displayOrder?: number;
  display_order?: number;
  priceModifier?: number;
  price_modifier?: number;
  iconKey?: string;
  icon_key?: string;
  weight?: string;
  mainDishWeight?: number;
  main_dish_weight?: number;
  groupsOrder?: string | number[];
  groups_order?: string | number[];
  accompanimentGroups?: RawGroup[];
  groups?: RawGroup[];
}

interface RawDish extends RawNutrition {
  id: string | number;
  name: string;
  description?: string;
  imageUrl?: string;
  image_url?: string;
  price?: number;
  basePrice?: number;
  salePrice?: number;
  sale_price?: number;
  showNutrition?: boolean;
  show_nutrition?: boolean;
  isVegetarian?: boolean;
  is_vegetarian?: boolean;
  isGlutenFree?: boolean;
  is_gluten_free?: boolean;
  isLactoseFree?: boolean;
  is_lactose_free?: boolean;
  sizes?: RawSize[];
}

/**
 * ✅ MAP DISH FROM DB (Versão Padronizada)
 */
export function mapDishFromDb(dish: RawDish | null | undefined) {
  if (!dish) return null;

  const showNutrition = Boolean(dish.showNutrition ?? dish.show_nutrition);

  // Helper para extrair número com fallback seguro
  const num = (val: string | number | undefined | null): number => {
    if (val === undefined || val === null || val === "") return 0;
    const n = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
    return isNaN(n) ? 0 : n;
  };

  const extractNutrition = (source: RawNutrition) => {
    const kcal = num(source.energyKcal ?? source.energy_kcal ?? source.kcal);
    const kj = num(source.energyKj ?? source.energy_kj ?? source.kj);

    return {
      energyKcal: kcal,
      energyKj: kj || (kcal * 4.184), 
      proteins: num(source.proteins ?? source.protein),
      carbs: num(source.carbs ?? source.carbohydrates),
      fatTotal: num(source.fatTotal ?? source.fat_total ?? source.fats),
      fatSaturated: num(source.fatSaturated ?? source.fat_saturated),
      fatTrans: num(source.fatTrans ?? source.fat_trans),
      fiber: num(source.fiber),
      sodium: num(source.sodium),
      addedSugars: num(source.addedSugars ?? source.added_sugars),
      calcium: num(source.calcium),
      iron: num(source.iron),
      yieldWeight: num(source.yieldWeight ?? source.yield_weight ?? source.mainDishWeight ?? source.main_dish_weight ?? 0),
      ingredients: source.ingredients || ""
    };
  };

  return {
    ...dish,
    id: Number(dish.id),
    name: dish.name,
    description: dish.description,
    imageUrl: dish.imageUrl || dish.image_url, 
    price: Number(dish.price || dish.basePrice || 0),
    salePrice: (dish.salePrice || dish.sale_price) ? Number(dish.salePrice || dish.sale_price) : null,
    showNutrition,

    flags: {
      isVegetarian: Boolean(dish.isVegetarian || dish.is_vegetarian),
      isGlutenFree: Boolean(dish.isGlutenFree || dish.is_gluten_free),
      isLactoseFree: Boolean(dish.isLactoseFree || dish.is_lactose_free),
    },

    nutrition: extractNutrition(dish),

    sizes: Array.isArray(dish.sizes) 
      ? dish.sizes
          .filter((s, idx, self) => idx === self.findIndex(t => t.id === s.id))
          .sort((a, b) => num(a.displayOrder ?? a.display_order) - num(b.displayOrder ?? b.display_order))
          .map((size) => {
            const gOrder: number[] = Array.isArray(size.groupsOrder) ? (size.groupsOrder as number[]) : 
                                   (typeof size.groups_order === 'string' ? JSON.parse(size.groups_order || "[]") : (size.groups_order || []));

            const rawGroups = size.accompanimentGroups || size.groups || [];

            return {
              id: Number(size.id),
              name: size.name,
              displayOrder: num(size.displayOrder ?? size.display_order),
              priceModifier: num(size.priceModifier || size.price_modifier),
              iconKey: size.iconKey || size.icon_key || "Box",
              weight: size.weight || "",
              main_dish_weight: num(size.mainDishWeight ?? size.main_dish_weight ?? 200),
              groupsOrder: gOrder, 

              accompanimentGroups: Array.isArray(rawGroups) 
                ? rawGroups
                    .filter((g, idx, self) => {
                      const currentId = g.groupId || g.id;
                      return idx === self.findIndex(t => (t.groupId || t.id) === currentId);
                    })
                    .sort((a, b) => {
                      const idA = num(a.groupId || a.id);
                      const idB = num(b.groupId || b.id);
                      const indexA = gOrder.indexOf(idA);
                      const indexB = gOrder.indexOf(idB);
                      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                    })
                    .map((group) => {
                      const itemsOrder: number[] = Array.isArray(group.itemsOrder) ? (group.itemsOrder as number[]) : 
                                                (typeof group.items_order === 'string' ? JSON.parse(group.items_order || "[]") : (group.items_order || []));

                      return {
                        id: group.id,
                        groupId: group.groupId || group.id,
                        name: group.name,
                        defaultGrammage: num(group.defaultGrammage ?? group.default_grammage ?? 100),
                        maxSelections: num(group.maxSelections || group.max_selections || 1),
                        minSelections: num(group.minSelections || group.min_selections || 0),
                        required: Boolean(group.isRequired || group.is_required || num(group.minSelections || group.min_selections) > 0),
                        
                        options: (Array.isArray(group.options) ? group.options : [])
                          .filter((opt, idx, self) => opt && idx === self.findIndex(t => t && t.id === opt.id))
                          .map((opt) => {
                            const optNutrition = extractNutrition(opt);

                            return {
                              id: Number(opt.id),
                              name: opt.name,
                              priceModifier: num(opt.priceModifier || opt.price_modifier),
                              iconKey: opt.iconKey || opt.icon_key || opt.category?.iconKey || "Box",
                              categoryColor: opt.categoryColor || opt.category?.color || "slate",
                              show_nutrition: Boolean(opt.show_nutrition || opt.showNutrition),
                              ...optNutrition,
                              kcal: optNutrition.energyKcal,
                              fats: optNutrition.fatTotal,
                              defaultGrammage: num(group.defaultGrammage ?? group.default_grammage ?? 100)
                            };
                          })
                          .sort((a, b) => {
                            const indexA = itemsOrder.indexOf(Number(a.id));
                            const indexB = itemsOrder.indexOf(Number(b.id));
                            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                          })
                      };
                    })
                : [] 
            };
          })
      : [],
  };
}