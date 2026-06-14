    // server/workers/helpers/buildNutriAiCatalog.ts

import { safeNumber } from "../../lib/safe-parse.js";

type DbDish = {
  id: string | number;
  name: string;
  description?: string | null;
  energyKcal?: number | null;
  proteins?: number | null;
  carbs?: number | null;
  fatTotal?: number | null;
};

type DbSizeRow = {
  dishId: string | number;
  sizeId: string | number;
  sizeName: string;
  weight?: number | null;
  mainDishWeight?: number | null;
  price?: number | null;
  isDefault?: boolean | null;
  groupId?: string | number | null;
  groupName?: string | null;
  minSelections?: number | null;
  maxSelections?: number | null;
  isRequired?: boolean | null;
};

type DbAcc = {
  id: string | number;
  groupId?: string | number | null;
  name: string;
  energyKcal?: number | null;
  proteins?: number | null;
  carbs?: number | null;
  fatTotal?: number | null;
  priceModifier?: number | null;
  isNoAccompaniment?: boolean | null;
  is_no_accompaniment?: boolean | null;
};

export function buildNutriAiCatalog(
  dbDishes: DbDish[],
  dishSizesRaw: DbSizeRow[],
  allOptions: DbAcc[]
) {
  return {
    dishes: dbDishes.map((dish) => {
      const rows = dishSizesRaw.filter((s) => String(s.dishId) === String(dish.id));

      const uniqueSizeIds = [...new Set(rows.map((r) => String(r.sizeId)))];

      const availableSizes = uniqueSizeIds.map((sizeId) => {
        const sizeRows = rows.filter((r) => String(r.sizeId) === sizeId);
        const sizeInfo = sizeRows[0];

        const uniqueGroupIds = [
          ...new Set(
            sizeRows
              .filter((r) => r.groupId != null)
              .map((r) => String(r.groupId))
          ),
        ];

        const accompanimentGroups = uniqueGroupIds.map((groupId) => {
          const groupRow = sizeRows.find((r) => String(r.groupId) === groupId);

          return {
            id: groupRow?.groupId,
            name: groupRow?.groupName || "Acompanhamentos",
            minSelections: safeNumber(groupRow?.minSelections),
            maxSelections: safeNumber(groupRow?.maxSelections, 1),
            isRequired: Boolean(groupRow?.isRequired || false),
            options: allOptions
              .filter((opt) => String(opt.groupId) === groupId)
              .map((opt) => ({
                id: opt.id,
                name: opt.name,
                energyKcal: safeNumber(opt.energyKcal),
                proteins: safeNumber(opt.proteins),
                carbs: safeNumber(opt.carbs),
                fatTotal: safeNumber(opt.fatTotal),
                priceModifier: safeNumber(opt.priceModifier),
                isNoAccompaniment: Boolean(opt.isNoAccompaniment ?? opt.is_no_accompaniment),
                is_no_accompaniment: Boolean(opt.isNoAccompaniment ?? opt.is_no_accompaniment),
              })),
          };
        });

        return {
          id: sizeInfo.sizeId,
          name: sizeInfo.sizeName,
          weight: safeNumber(sizeInfo.weight),
          mainDishWeight: safeNumber(sizeInfo.mainDishWeight || sizeInfo.weight),
          price: safeNumber(sizeInfo.price),
          isDefault: Boolean(sizeInfo.isDefault || false),
          accompanimentGroups,
        };
      });

      return {
        id: dish.id,
        name: dish.name,
        description: dish.description || "",
        energyKcal: safeNumber(dish.energyKcal),
        proteins: safeNumber(dish.proteins),
        carbs: safeNumber(dish.carbs),
        fatTotal: safeNumber(dish.fatTotal),
        availableSizes,
      };
    }),
  };
}
