import { eq, inArray } from "drizzle-orm";
import { getDb } from "./db.js";
import { 
  packages, 
  packageOptions, 
  packageOptionDishes, 
  packageOptionGroups,
  accompanimentGroups,
  dishes,
} from "../drizzle/schema/"; 

// -------------------------------------------------------------
// FUNÇÕES DE SERVIÇO DE PACOTES
// -------------------------------------------------------------

/**
 * Busca um pacote com todas as suas opções, pratos e grupos.
 */
export async function getPackageWithOptions(packageId: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  // Busca o pacote (packageId é String/UUID)
  const [pkg] = await db.select().from(packages).where(eq(packages.id, packageId)).limit(1);
  if (!pkg) return null;

  // Busca as opções do pacote
  const options = await db.select().from(packageOptions)
    .where(eq(packageOptions.packageId, packageId))
    .orderBy(packageOptions.optionOrder);

  const optionsWithDetails = await Promise.all(options.map(async (opt) => {
    // 🥗 PRATOS: Pratos vinculados a esta opção
    // opt.id é number (banco), então funciona direto com optionId (int)
    const optDishes = await db.select({
        id: dishes.id,
        name: dishes.name,
        // Garante que pegamos o preço, seja qual for o nome da coluna no seu schema de pratos
        price: (dishes as any).basePrice || (dishes as any).price || "0.00"
    })
    .from(packageOptionDishes)
    .innerJoin(dishes, eq(packageOptionDishes.dishId, dishes.id))
    .where(eq(packageOptionDishes.optionId, opt.id));

    // 🍟 GRUPOS
    const optGroups = await db.select({
        id: accompanimentGroups.id,
        name: accompanimentGroups.name
    })
    .from(packageOptionGroups)
    .innerJoin(accompanimentGroups, eq(packageOptionGroups.groupId, accompanimentGroups.id))
    .where(eq(packageOptionGroups.optionId, opt.id));

    return {
      ...opt,
      id: String(opt.id), // Envia como string para o front para padronizar
      dishes: optDishes,
      accompanimentGroups: optGroups
    };
  }));

  return { ...pkg, options: optionsWithDetails };
}

/**
 * Vincula pratos a uma opção de pacote.
 * ✅ CORREÇÃO: Converte IDs para NUMBER, pois são Inteiros no banco.
 */
export async function addDishesToOption(optionId: string | number, dishIds: string[]) {
  const db = await getDb();
  
  // 1. Converter ID da opção para número (pois package_options.id é int)
  const optionIdInt = Number(optionId);
  if (isNaN(optionIdInt)) throw new Error("ID da Opção inválido");

  // 2. Limpa vínculos antigos
  await db.delete(packageOptionDishes)
    .where(eq(packageOptionDishes.optionId, optionIdInt));

  // 3. Insere os novos pratos
  if (dishIds.length > 0) {
    const values = dishIds.map(id => ({
        optionId: optionIdInt,     // Inteiro
        dishId: Number(id)         // ✅ Inteiro (Correção do erro de tipagem)
    }));
    
    // Filtra caso algum ID não seja número válido
    const validValues = values.filter(v => !isNaN(v.dishId));

    if (validValues.length > 0) {
      await db.insert(packageOptionDishes).values(validValues);
    }
  }
  return { success: true };
}

/**
 * Vincula grupos de acompanhamento a uma opção.
 * ✅ CORREÇÃO: Converte IDs para NUMBER.
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
        groupId: Number(id) // ✅ Inteiro
    }));

    const validValues = values.filter(v => !isNaN(v.groupId));

    if (validValues.length > 0) {
      await db.insert(packageOptionGroups).values(validValues);
    }
  }
  return { success: true };
}