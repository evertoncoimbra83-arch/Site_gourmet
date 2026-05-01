import { eq, asc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  packages,
  packageOptions,
  packageOptionDishes,
  packageOptionGroups,
  accompanimentGroups,
  dishes,
} from "../drizzle/schema/index";
import { safeInteger, safeNumber } from "./lib/safe-parse";

export async function getPackageWithOptions(packageId: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponivel");

  const [pkg] = await db.select().from(packages).where(eq(packages.id, packageId)).limit(1);
  if (!pkg) return null;

  const options = await db.select().from(packageOptions)
    .where(eq(packageOptions.packageId, packageId))
    .orderBy(asc(packageOptions.optionOrder));

  const optionsWithDetails = await Promise.all(options.map(async (opt) => {
    const optDishes = await db.select({
      id: dishes.id,
      name: dishes.name,
      price: dishes.basePrice,
      salePrice: sql<number | null>`${dishes.salePrice}`,
      imageUrl: dishes.imageUrl,
    })
      .from(packageOptionDishes)
      .innerJoin(dishes, eq(packageOptionDishes.dishId, dishes.id))
      .where(eq(packageOptionDishes.optionId, opt.id));

    const optGroups = await db.select({
      id: accompanimentGroups.id,
      name: accompanimentGroups.name,
      itemsOrder: sql<string | null>`${accompanimentGroups.itemsOrder}`,
    })
      .from(packageOptionGroups)
      .innerJoin(accompanimentGroups, eq(packageOptionGroups.groupId, accompanimentGroups.id))
      .where(eq(packageOptionGroups.optionId, opt.id));

    return {
      ...opt,
      id: String(opt.id),
      dishes: optDishes,
      accompanimentGroups: optGroups,
    };
  }));

  return {
    ...pkg,
    price: safeNumber(pkg.price),
    salePrice: pkg.salePrice ? safeNumber(pkg.salePrice) : null,
    displayOrder: safeInteger(pkg.displayOrder),
    options: optionsWithDetails,
  };
}

export async function addDishesToOption(optionId: string | number, dishIds: string[]) {
  const db = await getDb();
  const optionIdInt = safeInteger(optionId, Number.NaN);
  if (!Number.isFinite(optionIdInt)) throw new Error("ID da opcao invalido");

  await db.delete(packageOptionDishes)
    .where(eq(packageOptionDishes.optionId, optionIdInt));

  if (dishIds.length > 0) {
    const values = dishIds.map((id) => ({
      optionId: optionIdInt,
      dishId: safeInteger(id, Number.NaN),
    }));

    const validValues = values.filter((v) => Number.isFinite(v.dishId));
    if (validValues.length > 0) {
      await db.insert(packageOptionDishes).values(validValues);
    }
  }
  return { success: true };
}

export async function addGroupsToOption(optionId: string | number, groupIds: string[]) {
  const db = await getDb();
  const optionIdInt = safeInteger(optionId, Number.NaN);
  if (!Number.isFinite(optionIdInt)) throw new Error("ID da opcao invalido");

  await db.delete(packageOptionGroups)
    .where(eq(packageOptionGroups.optionId, optionIdInt));

  if (groupIds.length > 0) {
    const values = groupIds.map((id) => ({
      optionId: optionIdInt,
      groupId: safeInteger(id, Number.NaN),
    }));

    const validValues = values.filter((v) => Number.isFinite(v.groupId));
    if (validValues.length > 0) {
      await db.insert(packageOptionGroups).values(validValues);
    }
  }
  return { success: true };
}
