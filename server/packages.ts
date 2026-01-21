import { eq, inArray, asc } from "drizzle-orm";
import { getDb } from "./db.js";
import { 
  packages, 
  packageOptions, 
  packageOptionGroups 
} from "drizzle/schema/packages.js"; 
import { 
  dishes, 
  accompanimentGroups, 
  accompanimentOptions, 
  // ✅ IMPORTANTE: Importamos a tabela correta (que tem iconKey) e apelidamos de 'categories'
  accompanimentCategories as categories 
} from "drizzle/schema/catalog.js"; 

// --- HELPERS ---
const toNum = (val: any): number => {
  if (val === null || val === undefined) return 0;
  const n = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  return isNaN(n) ? 0 : n;
};

// --- FUNÇÃO PRINCIPAL ---
export async function getPackageById(idInput: string | number) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados não disponível");

  const id = String(idInput); 

  try {
    // 1. Busca Pacote
    const [pkg]: any = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
    if (!pkg) return null;

    // 2. Busca TODAS as categorias de acompanhamento ativas (onde estão os ícones)
    const allCategories = await db.select().from(categories).where(eq(categories.isActive, true));

    // 3. Parse Config
    let config: any = { slots: [] };
    try {
      if (typeof pkg.config === 'string') {
        config = JSON.parse(pkg.config);
      } else if (pkg.config && typeof pkg.config === 'object') {
        config = pkg.config;
      }
    } catch (e) { console.error("Erro parse JSON"); }
    
    const slots = Array.isArray(config?.slots) ? config.slots : [];

    // 4. Coleta de IDs Limpos
    const allDishIds: number[] = [];
    const allGroupIds: number[] = [];

    slots.forEach((slot: any) => {
        if (slot?.dishIds) allDishIds.push(...slot.dishIds.map(Number));
        if (slot?.groups) allGroupIds.push(...slot.groups.map((g: any) => Number(g.id)));
    });

    const uniqueDishIds = [...new Set(allDishIds)].filter(n => !isNaN(n) && n > 0);
    const uniqueGroupIds = [...new Set(allGroupIds)].filter(n => !isNaN(n) && n > 0);

    // 5. Busca Pratos
    let allFetchedDishes: any[] = [];
    if (uniqueDishIds.length > 0) {
      allFetchedDishes = await db.select({
          id: dishes.id,
          name: dishes.name,
          price: (dishes as any).price || (dishes as any).basePrice || "0.00", 
          nutritionalInfo: dishes.nutritionalInfo 
        }).from(dishes).where(inArray(dishes.id, uniqueDishIds));
    }

    // 6. Busca Grupos e Opções (COM ÍCONES)
    let allFetchedGroups: any[] = [];
    if (uniqueGroupIds.length > 0) {
        const groupsRaw = await db.select().from(accompanimentGroups)
            .where(inArray(accompanimentGroups.id, uniqueGroupIds));
        
        const allActiveOptions = await db.select().from(accompanimentOptions)
            .where(eq(accompanimentOptions.isActive, true));

        allFetchedGroups = groupsRaw.map(group => {
            const groupOptions = allActiveOptions.map((opt: any) => {
                const groupsConfig = typeof opt.groupsConfig === 'string' 
                    ? JSON.parse(opt.groupsConfig) 
                    : (opt.groupsConfig || []);
                
                const configLink = groupsConfig.find((gc: any) => Number(gc.group_id) === group.id);
                
                if (!configLink) return null;

                // Encontra a categoria correspondente para pegar o ícone
                const categoryData = allCategories.find(c => c.id === opt.accompanimentCategoryId);

                return {
                    id: Number(opt.id),
                    name: opt.name,
                    priceModifier: toNum(configLink.price_modifier || opt.priceModifier),
                    nutritional_info: opt.nutritionalInfo,
                    // ✅ AQUI OS ÍCONES SÃO INJETADOS
                    category: categoryData ? {
                        id: categoryData.id,
                        name: categoryData.name,
                        iconKey: (categoryData as any).iconKey, 
                        color: (categoryData as any).color
                    } : null
                };
            }).filter(Boolean); 

            return {
                id: Number(group.id),
                name: group.name,
                maxSelections: Number(group.maxSelections || 1),
                options: groupOptions
            };
        });
    }

    // 7. Montagem Final
    const formattedOptions = slots.map((slot: any, index: number) => {
      const slotDishIds = Array.isArray(slot?.dishIds) ? slot.dishIds.map(Number) : [];
      const slotConfigs = Array.isArray(slot?.groups) ? slot.groups : [];
      const slotGroupIds = slotConfigs.map((g: any) => Number(g?.id));

      return {
        mealIndex: index,
        label: slot?.name || `Refeição ${index + 1}`,
        dishes: allFetchedDishes
          .filter(d => d && slotDishIds.includes(Number(d.id)))
          .map(d => ({
            id: Number(d.id),
            name: d.name,
            price: toNum(d.price),
            nutritional_info: d.nutritionalInfo || {}
          })),
        accompanimentGroups: allFetchedGroups
          .filter(g => g && slotGroupIds.includes(Number(g.id)))
          .map(g => {
            const custom = slotConfigs.find((sg: any) => Number(sg?.id) === Number(g?.id));
            return { 
                ...g, 
                name: custom?.customLabel || g.name 
            };
          }),
        selectedAccompaniments: [] 
      };
    });

    return {
      id: String(pkg.id),
      name: pkg.name,
      price: toNum(pkg.price),
      imageUrl: pkg.imageUrl,
      options: formattedOptions 
    };

  } catch (error: any) {
    console.error("❌ ERRO NO GET PACKAGE:", error.message);
    throw error;
  }
}

export async function getAllPackages() {
    const db = await getDb();
    if (!db) return [];
    try {
      const result = await db.select().from(packages).where(eq(packages.isActive, true)).orderBy(asc(packages.name));
      return result.map(p => ({ ...p, id: String(p.id), price: toNum(p.price) }));
    } catch (e) { return []; }
  }
  
export async function getAllActiveDishes() {
  const db = await getDb();
  if (!db) return [];
  return await db.select({ 
    id: dishes.id, 
    name: dishes.name, 
    price: (dishes as any).price || (dishes as any).basePrice 
  }).from(dishes).where(eq(dishes.isActive, true));
}
  
export async function updatePackageConfig(packageId: string | number, configData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");
  
  // ✅ Atualizado para 'updatedAt' conforme o schema novo
  await db.update(packages)
    .set({ 
      config: configData, 
      updatedAt: new Date() 
    })
    .where(eq(packages.id, String(packageId)));
    
  return { success: true };
}