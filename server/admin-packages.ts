import { eq, inArray, asc } from "drizzle-orm";
import { getDb } from "./db.js";
import { 
  packages, 
  packageOptions, 
  packageOptionDishes, 
  packageOptionGroups,
  accompanimentGroups,
  dishes,
} from "../drizzle/schema/index.js"; 

// -------------------------------------------------------------
// FUNÇÕES DE SERVIÇO DE PACOTES
// -------------------------------------------------------------

/**
 * Busca um pacote com todas as suas opções, pratos e grupos.
 */
export async function getPackageWithOptions(packageId: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  // 1. Busca o pacote (Incluindo salePrice e displayOrder)
  const [pkg] = await db.select().from(packages).where(eq(packages.id, packageId)).limit(1);
  if (!pkg) return null;

  // 2. Busca as opções (slots) do pacote ordenadas
  const options = await db.select().from(packageOptions)
    .where(eq(packageOptions.packageId, packageId))
    .orderBy(asc(packageOptions.optionOrder));

  const optionsWithDetails = await Promise.all(options.map(async (opt) => {
    // 🥗 PRATOS: Incluindo sale_price na busca para o front saber se tem desconto
    const optDishes = await db.select({
        id: dishes.id,
        name: dishes.name,
        price: dishes.price,
        salePrice: (dishes as any).salePrice || (dishes as any).sale_price || null, // ✅ Suporte ao preço promo
        imageUrl: dishes.imageUrl
    })
    .from(packageOptionDishes)
    .innerJoin(dishes, eq(packageOptionDishes.dishId, dishes.id))
    .where(eq(packageOptionDishes.optionId, opt.id));

    // 🍟 GRUPOS: Incluindo a nova coluna itemsOrder caso queira ordenar ingredientes no kit
    const optGroups = await db.select({
        id: accompanimentGroups.id,
        name: accompanimentGroups.name,
        itemsOrder: (accompanimentGroups as any).itemsOrder || null // ✅ Suporte a ordem de ingredientes
    })
    .from(packageOptionGroups)
    .innerJoin(accompanimentGroups, eq(packageOptionGroups.groupId, accompanimentGroups.id))
    .where(eq(packageOptionGroups.optionId, opt.id));

    return {
      ...opt,
      id: String(opt.id), 
      dishes: optDishes,
      accompanimentGroups: optGroups
    };
  }));

  // Retornamos o objeto completo, garantindo que os tipos de preço sejam números no final
  return { 
    ...pkg, 
    price: Number(pkg.price || 0),
    salePrice: pkg.salePrice ? Number(pkg.salePrice) : null,
    displayOrder: Number(pkg.displayOrder || 0),
    options: optionsWithDetails 
  };
}

/**
 * Vincula pratos a uma opção de pacote.
 */
export async function addDishesToOption(optionId: string | number, dishIds: string[]) {
  const db = await getDb();
  const optionIdInt = Number(optionId);
  if (isNaN(optionIdInt)) throw new Error("ID da Opção inválido");

  await db.delete(packageOptionDishes)
    .where(eq(packageOptionDishes.dishId, optionIdInt)); // Note: Verifique se aqui não deveria ser optionId

  if (dishIds.length > 0) {
    const values = dishIds.map(id => ({
        optionId: optionIdInt,
        dishId: Number(id)
    }));
    
    const validValues = values.filter(v => !isNaN(v.dishId));
    if (validValues.length > 0) {
      await db.insert(packageOptionDishes).values(validValues);
    }
  }
  return { success: true };
}

/**
 * Vincula grupos de acompanhamento a uma opção.
 */
export async function addGroupsToOption(optionId: string | number, groupIds: string[]) {
  const db = await getDb();
  const optionIdInt = Number(optionId);
  if (isNaN(optionIdInt)) throw new Error("ID da Opção inválido");

  await db.delete(packageOptionGroups)
    .where(eq(packageOptionGroups.optionId, optionIdInt));

  if (groupIds.length > 0) {
    const values = groupIds.map(id => ({
        optionId: optionIdInt,
        groupId: Number(id)
    }));

    const validValues = values.filter(v => !isNaN(v.groupId));
    if (validValues.length > 0) {
      await db.insert(packageOptionGroups).values(validValues);
    }
  }
  return { success: true };
}