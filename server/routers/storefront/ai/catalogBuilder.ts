import { getDb } from "../../../db.js";
import { 
  dishes, dishSizes, accompanimentGroups, accompanimentOptions, 
  dishesToSizes, sizeAccompanimentGroups, groupToOptions 
} from "../../../../drizzle/schema/index.js";
import { eq } from "drizzle-orm";

export async function buildNutriAiCatalog() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // 1. Busca todos os itens ativos (Tabelas Base)
  const activeDishes = await db.select().from(dishes).where(eq(dishes.isActive, true));
  const activeSizes = await db.select().from(dishSizes).where(eq(dishSizes.isActive, true));
  const activeGroups = await db.select().from(accompanimentGroups).where(eq(accompanimentGroups.isActive, true));
  const activeOptions = await db.select().from(accompanimentOptions).where(eq(accompanimentOptions.isActive, true));

  // 2. Busca os vínculos (Tabelas Pivot)
  const d2s = await db.select().from(dishesToSizes);
  const s2g = await db.select().from(sizeAccompanimentGroups);
  const g2o = await db.select().from(groupToOptions);

  // 3. Monta a Árvore Relacional
  const catalogTree = activeDishes.map(dish => {
    // Acha os IDs dos tamanhos permitidos para este prato
    const dishSizeIds = d2s.filter(link => link.dishId === dish.id).map(link => link.sizeId);
    
    // Filtra e monta os Tamanhos
    const availableSizes = activeSizes.filter(s => dishSizeIds.includes(s.id)).map(size => {
      // Acha os Grupos permitidos para este Tamanho
      const sizeGroupIds = s2g.filter(link => link.sizeId === size.id).map(link => link.accompanimentGroupId);
      
      // Filtra e monta os Grupos
      const groups = activeGroups.filter(g => sizeGroupIds.includes(g.id)).map(group => {
        // Acha as Opções permitidas para este Grupo
        const optionIds = g2o.filter(link => link.groupId === group.id).map(link => link.optionId);
        
        // Monta as Opções
        const options = activeOptions.filter(o => optionIds.includes(o.id)).map(opt => ({
          id: opt.id,
          name: opt.name,
          priceModifier: opt.priceModifier,
          macros: { kcal: opt.energyKcal, proteina: opt.proteins, carbos: opt.carbs }
        }));

        return {
          id: group.id,
          name: group.name,
          minSelections: group.minSelections,
          maxSelections: group.maxSelections,
          options
        };
      });

      return {
        id: size.id,
        name: size.name,
        weight: size.mainDishWeight,
        accompanimentGroups: groups
      };
    });

    return {
      id: dish.id,
      name: dish.name,
      description: dish.description,
      macros: { kcal: dish.energyKcal, proteina: dish.proteins, carbos: dish.carbs, gorduras: dish.fatTotal },
      restricoes: { sem_gluten: dish.isGlutenFree, sem_lactose: dish.isLactoseFree, vegetariano: dish.isVegetarian },
      availableSizes
    };
  });

  // Retorna o catálogo limpo removendo pratos que não têm tamanhos configurados
  return catalogTree.filter(d => d.availableSizes.length > 0);
}