import { eq, and } from "drizzle-orm";
import {
  accompanimentGroups,
  accompanimentOptions,
  dishes,
  dishesToSizes,
  groupToOptions,
  packages,
} from "../drizzle/schema/index.js";
import { safeJsonParse, safeNumber } from "./lib/safe-parse.js";
import {
  findPackagesUsingDish,
  validatePackageConfig,
  type PackageConfigCatalog,
  type PackageConfigInput,
} from "@shared/domain/packages/config-validator.js";

interface PackageRow {
  id: string | number;
  name: string;
  config?: PackageConfigInput | string | null;
  sizeId?: string | number | null;
  isActive?: boolean | null;
}

export function parsePackageConfig(config: unknown): PackageConfigInput {
  if (!config) return { slots: [] };
  return safeJsonParse<PackageConfigInput>(config, { slots: [] });
}

export async function buildPackageValidationCatalog(
  db: Awaited<ReturnType<typeof import("./db.js").getDb>>,
): Promise<PackageConfigCatalog> {
  const [dishRows, sizeLinks, groupRows, optionRows, groupOptionRows] =
    await Promise.all([
      db.select({
        id: dishes.id,
        name: dishes.name,
        isActive: dishes.isActive,
      }).from(dishes),
      db.select({
        dishId: dishesToSizes.dishId,
        sizeId: dishesToSizes.sizeId,
      }).from(dishesToSizes),
      db.select({
        id: accompanimentGroups.id,
        name: accompanimentGroups.name,
        isActive: accompanimentGroups.isActive,
        minSelections: accompanimentGroups.minSelections,
        maxSelections: accompanimentGroups.maxSelections,
      }).from(accompanimentGroups),
      db.select({
        id: accompanimentOptions.id,
        name: accompanimentOptions.name,
        isActive: accompanimentOptions.isActive,
        priceModifier: accompanimentOptions.priceModifier,
      }).from(accompanimentOptions),
      db.select({
        groupId: groupToOptions.groupId,
        optionId: groupToOptions.optionId,
      }).from(groupToOptions),
    ]);

  const sizeMap = new Map<string, string[]>();
  sizeLinks.forEach((link) => {
    const key = String(link.dishId);
    const current = sizeMap.get(key) || [];
    current.push(String(link.sizeId));
    sizeMap.set(key, current);
  });

  const optionMap = new Map<string, string[]>();
  groupOptionRows.forEach((link) => {
    const key = String(link.groupId);
    const current = optionMap.get(key) || [];
    current.push(String(link.optionId));
    optionMap.set(key, current);
  });

  return {
    dishes: dishRows.map((dish) => ({
      id: dish.id,
      name: dish.name,
      isActive: Boolean(dish.isActive),
      sizeIds: sizeMap.get(String(dish.id)) || [],
    })),
    groups: groupRows.map((group) => ({
      id: group.id,
      name: group.name,
      isActive: Boolean(group.isActive),
      minSelections: Number(group.minSelections ?? 0),
      maxSelections: Number(group.maxSelections ?? 1),
      optionIds: optionMap.get(String(group.id)) || [],
    })),
    options: optionRows.map((option) => ({
      id: option.id,
      name: option.name,
      isActive: Boolean(option.isActive),
      priceModifier: safeNumber(option.priceModifier),
    })),
  };
}

export async function validateAdminPackageConfig(
  db: Awaited<ReturnType<typeof import("./db.js").getDb>>,
  input: {
    config: PackageConfigInput;
    sizeId: string | number;
    isActive?: boolean;
  },
) {
  const catalog = await buildPackageValidationCatalog(db);
  return validatePackageConfig(input.config, input.sizeId, catalog, {
    isPackageActive: input.isActive,
  });
}

export async function getPackageIntegrityReport(
  db: Awaited<ReturnType<typeof import("./db.js").getDb>>,
) {
  const catalog = await buildPackageValidationCatalog(db);
  const packageRows = await db.select().from(packages);

  const results = packageRows.map((pkg) => {
    const validation = validatePackageConfig(
      parsePackageConfig(pkg.config),
      pkg.sizeId,
      catalog,
      { isPackageActive: Boolean(pkg.isActive) },
    );

    return {
      packageId: String(pkg.id),
      packageName: pkg.name,
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  });

  return {
    totalPackages: results.length,
    validPackages: results.filter((result) => result.isValid).length,
    packagesWithErrors: results.filter((result) => !result.isValid).length,
    packages: results,
  };
}

export async function getActivePackagesUsingDish(
  db: Awaited<ReturnType<typeof import("./db.js").getDb>>,
  dishId: string | number,
) {
  const activePackages = await db
    .select({
      id: packages.id,
      name: packages.name,
      config: packages.config,
    })
    .from(packages)
    .where(and(eq(packages.isActive, true), eq(packages.status, "active")));

  return findPackagesUsingDish(activePackages as PackageRow[], dishId).map(
    (pkg) => ({
      id: String(pkg.id),
      name: pkg.name,
    }),
  );
}
