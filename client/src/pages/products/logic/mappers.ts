/**
 * ✅ MAP DISH FROM DB (Versão Padronizada)
 * Converte o registro bruto do banco para o formato da UI.
 * Garante que todos os 13 campos nutricionais estejam presentes e tipados.
 */

interface NutritionResult {
  energyKcal: number;
  energyKj: number;
  proteins: number;
  carbs: number;
  fatTotal: number;
  fatSaturated: number;
  fatTrans: number;
  fiber: number;
  sodium: number;
  addedSugars: number;
  calcium: number;
  iron: number;
  yieldWeight: number;
  ingredients: string;
}

// ✅ Tipagem genérica para objetos do banco de dados (evita o erro 'any')
type DbRow = Record<string, unknown>;

export function mapDishFromDb(dish: DbRow | null | undefined) {
  if (!dish) return null;

  const showNutrition = Boolean(dish.showNutrition ?? dish.show_nutrition);

  // Helper para extrair número com fallback seguro
  const num = (val: unknown) => Number(val ?? 0);

  // ✅ HELPER: Extrai nutrição completa de qualquer objeto (Prato ou Opção)
  const extractNutrition = (source: DbRow): NutritionResult => {
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
      ingredients: String(source.ingredients || "")
    };
  };

  const sizesRaw = Array.isArray(dish.sizes) ? dish.sizes as DbRow[] : [];

  return {
    ...dish,
    id: Number(dish.id),
    name: String(dish.name || ""),
    description: String(dish.description || ""),
    imageUrl: String(dish.imageUrl || dish.image_url || ""), 
    price: Number(dish.price || dish.basePrice || 0),
    salePrice: (dish.salePrice || dish.sale_price) ? Number(dish.salePrice || dish.sale_price) : null,
    showNutrition,

    flags: {
      isVegetarian: Boolean(dish.isVegetarian || dish.is_vegetarian),
      isGlutenFree: Boolean(dish.isGlutenFree || dish.is_gluten_free),
      isLactoseFree: Boolean(dish.isLactoseFree || dish.is_lactose_free),
    },

    nutrition: extractNutrition(dish),

    sizes: sizesRaw
      .filter((s, idx, self) => idx === self.findIndex(t => t.id === s.id))
      .sort((a, b) => num(a.displayOrder ?? a.display_order) - num(b.displayOrder ?? b.display_order))
      .map((size) => {
        const gOrder = Array.isArray(size.groupsOrder) ? size.groupsOrder as number[] : 
                      (typeof size.groups_order === 'string' ? (JSON.parse(size.groups_order || "[]") as number[]) : (size.groups_order as number[] || []));

        const rawGroups = (size.accompanimentGroups || size.groups || []) as DbRow[];

        return {
          id: Number(size.id),
          name: String(size.name || ""),
          displayOrder: num(size.displayOrder ?? size.display_order),
          priceModifier: num(size.priceModifier || size.price_modifier),
          iconKey: String(size.iconKey || size.icon_key || "Box"),
          weight: String(size.weight || ""),
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
                  const itemsOrder = Array.isArray(group.itemsOrder) ? group.itemsOrder as number[] : 
                                    (typeof group.items_order === 'string' ? (JSON.parse(group.items_order || "[]") as number[]) : (group.items_order as number[] || []));

                  const groupOptions = (Array.isArray(group.options) ? group.options : []) as DbRow[];

                  return {
                    id: group.id,
                    groupId: group.groupId || group.id,
                    name: String(group.name || ""),
                    defaultGrammage: num(group.defaultGrammage ?? group.default_grammage ?? 100),
                    maxSelections: num(group.maxSelections || group.max_selections || 1),
                    minSelections: num(group.minSelections || group.min_selections || 0),
                    required: Boolean(group.isRequired || group.is_required || num(group.minSelections || group.min_selections) > 0),
                    
                    options: groupOptions
                      .filter((opt, idx, self) => opt && idx === self.findIndex(t => t && t.id === opt.id))
                      .map((opt) => {
                        const optNutrition = extractNutrition(opt);
                        const category = opt.category as DbRow | undefined;

                        return {
                          id: Number(opt.id),
                          name: String(opt.name || ""),
                          priceModifier: num(opt.priceModifier || opt.price_modifier),
                          iconKey: String(opt.iconKey || opt.icon_key || category?.iconKey || "Box"),
                          categoryColor: String(opt.categoryColor || category?.color || "slate"),
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
      }),
  };
}