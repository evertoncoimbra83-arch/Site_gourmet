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
      ? dish.sizes.map((size: any) => {
          // ✅ NORMALIZAÇÃO DE ÍCONES: 
          // Se vier "box" do banco ou estiver vazio, vira "Cube".
          let icon = size.iconKey || size.icon_key || "Cube";
          if (icon === "box") icon = "Cube";

          return {
            id: size.id,
            name: size.name,
            priceModifier: Number(size.priceModifier || size.price_modifier || 0),
            
            // ✅ CAMPOS CORRIGIDOS PARA SNAKE_CASE DO BANCO
            iconKey: icon,
            weight: size.weight || "",
            description: size.description || "",
            
            accompanimentGroups: Array.isArray(size.accompanimentGroups) 
              ? [...size.accompanimentGroups]
                  .sort((a, b) => (a.displayOrder ?? a.display_order ?? 0) - (b.displayOrder ?? b.display_order ?? 0) || a.name.localeCompare(b.name, 'pt-BR', { numeric: true }))
                  .map((group: any) => ({
                    id: group.id,
                    name: group.name,
                    description: group.description,
                    maxSelections: Number(group.maxSelections || group.max_selections || 1),
                    minSelections: Number(group.minSelections || group.min_selections || 0),
                    required: Boolean(group.isRequired || group.is_required),
                    
                    options: Array.isArray(group.options) 
                      ? [...group.options]
                          .sort((a, b) => (a.displayOrder ?? a.display_order ?? 0) - (b.displayOrder ?? b.display_order ?? 0) || a.name.localeCompare(b.name, 'pt-BR', { numeric: true }))
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
                  }))
              : [] 
          };
        })
      : [],
  };
}