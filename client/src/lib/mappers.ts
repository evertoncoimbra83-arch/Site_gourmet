export function mapDishFromDb(dish: any) {
  if (!dish) return null;

  const showNutrition = Boolean(dish.showNutrition ?? dish.show_nutrition);

  return {
    id: dish.id,
    name: dish.name,
    description: dish.description,
    imageUrl: dish.imageUrl || dish.image_url, 
    
    price: Number(dish.price || dish.basePrice || 0),
    showNutrition,

    nutrition: showNutrition ? {
      kcal: Number(dish.energyKcal || dish.energy_kcal || 0),
      proteins: Number(dish.proteins || 0),
      carbs: Number(dish.carbs || 0),
      fats: Number(dish.fatTotal || dish.fat_total || 0),
      sodium: Number(dish.sodium || 0),
    } : null,

    flags: {
      isVegetarian: Boolean(dish.isVegetarian || dish.is_vegetarian),
      isGlutenFree: Boolean(dish.isGlutenFree || dish.is_gluten_free),
      isLactoseFree: Boolean(dish.isLactoseFree || dish.is_lactose_free),
    },

    sizes: Array.isArray(dish.sizes) 
      ? [...dish.sizes]
          // ✅ Ordena os botões de tamanho pelo displayOrder do Admin
          .sort((a, b) => (a.displayOrder ?? a.display_order ?? 0) - (b.displayOrder ?? b.display_order ?? 0))
          .map((size: any) => {
            let icon = size.iconKey || size.icon_key || "Cube";
            if (icon === "box") icon = "Cube";

            // ✅ Captura o mapa de ordem dos grupos deste tamanho
            const groupsOrder = Array.isArray(size.groupsOrder) ? size.groupsOrder : 
                               (typeof size.groups_order === 'string' ? JSON.parse(size.groups_order || "[]") : (size.groups_order || []));

            return {
              id: size.id,
              name: size.name,
              priceModifier: Number(size.priceModifier || size.price_modifier || 0),
              iconKey: icon,
              weight: size.weight || "",
              description: size.description || "",
              groupsOrder, // Passamos para o frontend usar se necessário

              accompanimentGroups: Array.isArray(size.accompanimentGroups) 
                ? [...size.accompanimentGroups]
                    // ✅ ORDENAÇÃO POR DRAG & DROP (groupsOrder)
                    .sort((a, b) => {
                      const indexA = groupsOrder.indexOf(Number(a.id));
                      const indexB = groupsOrder.indexOf(Number(b.id));
                      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                    })
                    .map((group: any) => {
                      // ✅ Captura o mapa de ordem das opções deste grupo
                      const itemsOrder = Array.isArray(group.itemsOrder) ? group.itemsOrder : 
                                        (typeof group.items_order === 'string' ? JSON.parse(group.items_order || "[]") : (group.items_order || []));

                      return {
                        id: group.id,
                        name: group.name,
                        description: group.description,
                        maxSelections: Number(group.maxSelections || group.max_selections || 1),
                        minSelections: Number(group.minSelections || group.min_selections || 0),
                        required: Boolean(group.isRequired || group.is_required),
                        itemsOrder,

                        options: Array.isArray(group.options) 
                          ? [...group.options]
                              // ✅ ORDENAÇÃO POR DRAG & DROP (itemsOrder)
                              .sort((a, b) => {
                                const indexA = itemsOrder.indexOf(Number(a.id));
                                const indexB = itemsOrder.indexOf(Number(b.id));
                                return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                              })
                              .map((opt: any) => ({
                                id: opt.id,
                                name: opt.name,
                                price: Number(opt.priceModifier || opt.price_modifier || 0),
                                priceModifier: Number(opt.priceModifier || opt.price_modifier || 0),
                                category: opt.category, 
                                showNutrition: Boolean(opt.showNutrition || opt.show_nutrition),
                                nutritionalInfo: opt.nutritionalInfo || opt.nutritional_info,
                              }))
                          : []
                      };
                    })
                : [] 
            };
          })
      : [],
  };
}