import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  calculateMainDishNutrition,
  calculateMealNutritionCanonical,
  extractDishNutritionSource,
  inferRecipeWeightFromComposition,
  normalizeNutritionKeys,
} from "../shared/domain/nutrition/nutrition";
import { calculateSingleCardNutrition } from "../client/src/pages/nutri/components/PrescriptionDrawer/utils/nutrition-logic";
import { validateAccSelections, hasAccompaniments } from "../client/src/pages/products/logic/validation";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const readSource = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Sprint Nutri P0 motor nutricional canonico", () => {
  it("calcula prato absoluto proporcional ao peso da receita", () => {
    const result = calculateMealNutritionCanonical({
      dish: { energyKcal: 420, proteins: 28, carbs: 42, fatTotal: 12 },
      recipeWeight: 280,
      targetMainDishWeight: 300,
    });

    expect(result.nutrition.energyKcal).toBe(450);
    expect(result.metadata.recipeWeightUsed).toBe(280);
    expect(result.metadata.targetMainDishWeightUsed).toBe(300);
  });

  it("normaliza aliases reais do prato em camelCase, nomes curtos e snake_case", () => {
    expect(normalizeNutritionKeys({
      energyKcal: 420,
      proteins: 30,
      carbs: 40,
      fatTotal: 10,
    })).toMatchObject({ energyKcal: 420, proteins: 30, carbs: 40, fatTotal: 10 });

    expect(normalizeNutritionKeys({
      kcal: 420,
      protein: 30,
      carbohydrates: 40,
      fat: 10,
    })).toMatchObject({ energyKcal: 420, proteins: 30, carbs: 40, fatTotal: 10 });

    expect(normalizeNutritionKeys({
      energy_kcal: 420,
      protein_g: 30,
      carbs_g: 40,
      fat_total: 10,
      saturatedFat: 2,
      transFat: 0.1,
      fiber_g: 6,
      sodium_mg: 320,
    })).toMatchObject({
      energyKcal: 420,
      proteins: 30,
      carbs: 40,
      fatTotal: 10,
      fatSaturated: 2,
      fatTrans: 0.1,
      fiber: 6,
      sodium: 320,
    });
  });

  it("prefere macros aninhados quando a raiz tem aliases zerados", () => {
    const result = calculateMealNutritionCanonical({
      dish: {
        energyKcal: 0,
        proteins: 0,
        carbs: 0,
        fatTotal: 0,
        nutrition: { energyKcal: 420, proteins: 30, carbs: 40, fatTotal: 10 },
      },
      recipeWeight: 280,
      targetMainDishWeight: 300,
    });

    expect(result.nutrition.energyKcal).toBe(450);
    expect(result.nutrition.proteins).toBe(32.143);
    expect(result.metadata.missingDishNutrition).toBe(false);
    expect(result.metadata.normalizedDishNutrition.energyKcal).toBe(420);
  });

  it("mapeia prato aninhado pelo helper de fonte nutricional", () => {
    const source = extractDishNutritionSource({
      dish: { calories: 420, proteins_g: 30, carbohydrate_g: 40, totalFat: 10 },
    });
    const result = calculateMealNutritionCanonical({
      dish: source,
      recipeWeight: 280,
      targetMainDishWeight: 300,
    });

    expect(result.nutrition.energyKcal).toBe(450);
    expect(result.nutrition.fatTotal).toBe(10.714);
  });

  it("usa fallback seguro sem gerar NaN quando nao ha peso de receita", () => {
    const result = calculateMealNutritionCanonical({
      dish: { energyKcal: 420, proteins: 28 },
      recipeWeight: 0,
      targetMainDishWeight: "abc",
    });

    expect(result.metadata.usedRecipeWeightFallback).toBe(true);
    expect(result.metadata.usedTargetWeightFallback).toBe(true);
    Object.values(result.nutrition).forEach((value) => {
      expect(Number.isNaN(value)).toBe(false);
    });
  });

  it("soma acompanhamento por 100g conforme gramagem fisica", () => {
    const result = calculateMealNutritionCanonical({
      dish: { energyKcal: 0 },
      recipeWeight: 200,
      targetMainDishWeight: 200,
      accompaniments: [{ energyKcal: 120, proteins: 4, weight: 80 }],
    });

    expect(result.nutrition.energyKcal).toBe(96);
    expect(result.nutrition.proteins).toBe(3.2);
  });

  it("soma prato principal e acompanhamento", () => {
    const result = calculateMealNutritionCanonical({
      dish: { energyKcal: 420, proteins: 28 },
      recipeWeight: 280,
      targetMainDishWeight: 300,
      accompaniments: [{ energy_kcal: 120, proteins: 4, weight: 80 }],
    });

    expect(result.nutrition.energyKcal).toBe(546);
    expect(result.nutrition.proteins).toBe(33.2);
  });

  it("ignora acompanhamento marcado como isNoAccompaniment sem zerar prato 200g", () => {
    const result = calculateMealNutritionCanonical({
      dish: { energyKcal: 420, proteins: 30, carbs: 40, fatTotal: 10 },
      recipeWeight: 200,
      targetMainDishWeight: 200,
      accompaniments: [
        {
          name: "Sem acompanhamento",
          isNoAccompaniment: true,
          energyKcal: 999,
          proteins: 99,
          carbs: 99,
          fatTotal: 99,
          fiber: 99,
          sodium: 999,
          weight: 100,
        },
      ],
    });

    expect(result.nutrition.energyKcal).toBe(420);
    expect(result.nutrition.proteins).toBe(30);
    expect(result.nutrition.carbs).toBe(40);
    expect(result.nutrition.fatTotal).toBe(10);
    expect(result.nutrition.fiber).toBe(0);
    expect(result.nutrition.sodium).toBe(0);
    expect(result.metadata.targetMainDishWeightUsed).toBe(200);
    expect(result.metadata.accompanimentsWeightTotal).toBe(0);
    expect(result.metadata.skippedNoAccompaniment).toBe(true);
    expect(result.metadata.skippedNoAccompanimentCount).toBe(1);
  });

  it("ignora acompanhamento marcado como is_no_accompaniment", () => {
    const result = calculateMealNutritionCanonical({
      dish: { energyKcal: 420, proteins: 30, carbs: 40, fatTotal: 10 },
      recipeWeight: 200,
      targetMainDishWeight: 200,
      accompaniments: [{ is_no_accompaniment: true, energyKcal: 120, proteins: 4, weight: 80 }],
    });

    expect(result.nutrition.energyKcal).toBe(420);
    expect(result.nutrition.proteins).toBe(30);
    expect(result.metadata.accompanimentsWeightTotal).toBe(0);
    expect(result.metadata.skippedNoAccompanimentCount).toBe(1);
  });

  it("mantem fallback temporario por nome para dados legados", () => {
    const result = calculateMealNutritionCanonical({
      dish: { energyKcal: 420, proteins: 30 },
      recipeWeight: 200,
      targetMainDishWeight: 200,
      accompaniments: [{ name: "Sem acompanhamento", energyKcal: 120, proteins: 4, weight: 80 }],
    });

    expect(result.nutrition.energyKcal).toBe(420);
    expect(result.nutrition.proteins).toBe(30);
    expect(result.metadata.skippedNoAccompanimentCount).toBe(1);
  });

  it("bug reportado: total nao pode ser apenas acompanhamento quando prato tem macros", () => {
    const result = calculateMealNutritionCanonical({
      dish: { energyKcal: 420, proteins: 30, carbs: 40, fatTotal: 10 },
      recipeWeight: 280,
      targetMainDishWeight: 300,
      accompaniments: [{ energyKcal: 100, proteins: 0, carbs: 0, fatTotal: 0, weight: 100 }],
    });

    const mainDish = calculateMainDishNutrition({
      dish: { energyKcal: 420, proteins: 30, carbs: 40, fatTotal: 10 },
      recipeWeight: 280,
      targetMainDishWeight: 300,
    });

    expect(mainDish.nutrition.energyKcal).toBe(450);
    expect(result.nutrition.energyKcal).toBe(550);
    expect(result.nutrition.energyKcal).toBeGreaterThan(100);
  });

  it("normaliza snake_case e camelCase", () => {
    const camel = calculateMealNutritionCanonical({
      dish: { energyKcal: 420, fatTotal: 10 },
      recipeWeight: 280,
      targetMainDishWeight: 300,
    }).nutrition;
    const snake = calculateMealNutritionCanonical({
      dish: { energy_kcal: 420, fat_total: 10 },
      recipeWeight: 280,
      targetMainDishWeight: 300,
    }).nutrition;

    expect(snake.energyKcal).toBe(camel.energyKcal);
    expect(snake.fatTotal).toBe(camel.fatTotal);
  });

  it("infere peso da receita pela soma de dish_composition.quantity", () => {
    const inferred = inferRecipeWeightFromComposition([
      { quantity: "120.5" },
      { quantity: 159.5 },
      { quantity: "x" },
    ]);

    expect(inferred.recipeWeight).toBe(280);
    expect(inferred.usedFallback).toBe(false);
  });

  it("portal Nutri e storefront usam o mesmo motor canonico", () => {
    const storefront = calculateMealNutritionCanonical({
      dish: { energyKcal: 420, proteins: 28, carbs: 42, fatTotal: 12 },
      recipeWeight: 280,
      targetMainDishWeight: 300,
      accompaniments: [{ energyKcal: 120, proteins: 4, carbs: 10, fatTotal: 1, weight: 80 }],
    }).nutrition;

    const nutri = calculateSingleCardNutrition({
      mainDishWeight: 300,
      recipeWeight: 280,
      macros: { kcal: 420, protein: 28, carbs: 42, fat: 12 },
      allowedAccompaniments: [
        { id: 1, name: "Arroz", isBase: true, energyKcal: 120, proteins: 4, carbs: 10, fatTotal: 1, weight: 80 },
      ],
    });

    expect(nutri.kcal).toBe(Math.round(storefront.energyKcal));
    expect(nutri.protein).toBe(Number(storefront.proteins.toFixed(1)));
    expect(nutri.carbs).toBe(Number(storefront.carbs.toFixed(1)));
  });

  it("Storefront hook usa helper para achar macros do prato", () => {
    const useDishSource = readSource("client/src/pages/products/logic/useDishNutrition.ts");
    const useProductSource = readSource("client/src/pages/products/logic/useProductNutrition.ts");

    expect(useDishSource).toContain("extractDishNutritionSource");
    expect(useDishSource).toContain("dish: dishNutritionSource");
    expect(useProductSource).toContain("extractDishNutritionSource");
    expect(useProductSource).toContain("dish: dishNutritionSource");
  });

  it("Portal Nutri passa macros do prato para o motor canonico", () => {
    const source = readSource("client/src/pages/nutri/components/PrescriptionDrawer/utils/nutrition-logic.ts");

    expect(source).toContain("calculateMealNutritionCanonical");
    expect(source).toContain("energyKcal: source?.kcal");
    expect(source).toContain("proteins: source?.protein");
  });

  it("pacote 300g passa peso real e nao cai no fallback de 200g", () => {
    const source = readSource("client/src/pages/packages/logic/usePackageViewModel.ts");

    expect(source).toContain("mainDishWeight: dish.mainDishWeight");
    expect(source).toContain("mainDishWeightUsed");
    expect(source).toContain("targetMainDishWeight: item.mainDishWeight");
  });

  it("schema e admin persistem campo sem acompanhamento", () => {
    const schemaSource = readSource("drizzle/schema/accompaniments.ts");
    const adminSource = readSource("server/routers/admin/accompaniments/options.ts");
    const adminListSource = readSource("server/accompaniments.ts");

    expect(schemaSource).toContain('isNoAccompaniment: boolean("is_no_accompaniment")');
    expect(adminSource).toContain("isNoAccompaniment: z.boolean().optional()");
    expect(adminSource).toContain("is_no_accompaniment: z.boolean().optional()");
    expect(adminSource).toContain("isNoAccompaniment: data.isNoAccompaniment");
    expect(adminListSource).toContain("is_no_accompaniment");
  });

  it("admin UI carrega e salva marcador sem acompanhamento", () => {
    const drawerSource = readSource("client/src/pages/adminSizes/components/AccDrawer.tsx");
    const storeSource = readSource("client/src/pages/adminSizes/logic/useAccStore.ts");

    expect(storeSource).toContain("isNoAccompaniment: false");
    expect(drawerSource).toContain("É opção 'sem acompanhamento'?");
    expect(drawerSource).toContain("isNoAccompaniment: !!(acc.isNoAccompaniment");
    expect(drawerSource).toContain("Esta opção será ignorada no cálculo nutricional.");
  });

  it("storefront e pacotes preservam o campo sem acompanhamento", () => {
    const productsSource = readSource("server/routers/storefront/products.ts");
    const mapperSource = readSource("client/src/pages/products/logic/mappers.ts");
    const packageSource = readSource("client/src/pages/packages/logic/usePackageViewModel.ts");

    expect(productsSource).toContain("isNoAccompaniment: schema.accompanimentOptions.isNoAccompaniment");
    expect(mapperSource).toContain("is_no_accompaniment");
    expect(packageSource).toContain("skippedNoAccompanimentCount");
    expect(packageSource).toContain("nutritionSkipped");
  });

  it("portal Nutri preserva o campo sem acompanhamento", () => {
    const prescriptionSource = readSource("server/routers/storefront/nutri/procedures/prescription.ts");
    const logicSource = readSource("client/src/pages/nutri/components/PrescriptionDrawer/utils/nutrition-logic.ts");

    expect(prescriptionSource).toContain("isNoAccompaniment: accompanimentOptions.isNoAccompaniment");
    expect(prescriptionSource).toContain("is_no_accompaniment: Boolean(dbAcc?.isNoAccompaniment)");
    expect(logicSource).toContain("allowedAccompaniments");
  });

  it("parsePrescription nao referencia colunas inexistentes em dish_sizes", () => {
    const source = readSource("server/routers/storefront/nutri/nutrition.ts");

    expect(source).toContain("dishesToSizes");
    expect(source).not.toContain("dish_sizes.protein_g");
    expect(source).not.toContain("dish_sizes.energy_kcal");
    expect(source).not.toContain("dish_sizes.dish_id");
  });

  it("Admin Sizes rotula mainDishWeight como peso do prato principal", () => {
    const source = readSource("client/src/pages/adminSizes/components/SizeCard.tsx");

    expect(source).toContain("Peso do Prato Principal (g)");
    expect(source).toContain("Prato principal:");
    expect(source).not.toContain("g Prot.");
    expect(source).not.toContain("Proteína (g)");
  });

  describe("Validação de Tamanhos Sem Acompanhamentos e Opções isNoAccompaniment", () => {
    it("tamanho sem grupos de acompanhamento deve retornar hasAccompaniments = false e ser valido no validador puro", () => {
      const size = { id: 1, name: "200g sem grupos", accompanimentGroups: [] };
      expect(hasAccompaniments(size)).toBe(false);

      const validation = validateAccSelections([], size);
      expect(validation.ok).toBe(true);
    });

    it("tamanho com grupos de acompanhamento mas sem opções cadastrados deve retornar hasAccompaniments = false e ser valido", () => {
      const size = {
        id: 2,
        name: "200g com grupos vazios",
        accompanimentGroups: [
          { id: 10, name: "Grupo Vazio 1", minSelections: 1, maxSelections: 2, options: [] },
          { id: 11, name: "Grupo Vazio 2", minSelections: 0, maxSelections: 1, options: [] }
        ]
      };
      expect(hasAccompaniments(size)).toBe(false);

      const validation = validateAccSelections([], size);
      expect(validation.ok).toBe(true);
    });

    it("tamanho com grupos contendo apenas opções isNoAccompaniment deve retornar hasAccompaniments = false e ser valido", () => {
      const size = {
        id: 3,
        name: "200g com apenas isNoAccompaniment",
        accompanimentGroups: [
          {
            id: 12,
            name: "Acompanhamentos",
            minSelections: 1,
            maxSelections: 1,
            options: [
              { id: 101, name: "Sem Acompanhamento", isNoAccompaniment: true }
            ]
          }
        ]
      };
      expect(hasAccompaniments(size)).toBe(false);

      const validation = validateAccSelections([], size);
      expect(validation.ok).toBe(true);
    });

    it("tamanho com grupos e acompanhamentos normais deve exigir seleção correta e aceitar isNoAccompaniment", () => {
      const size = {
        id: 4,
        name: "300g completo",
        accompanimentGroups: [
          {
            id: 13,
            name: "Escolha seu acompanhamento",
            groupId: 13,
            minSelections: 1,
            maxSelections: 1,
            options: [
              { id: 201, name: "Arroz Integral", isNoAccompaniment: false },
              { id: 202, name: "Sem Acompanhamento", isNoAccompaniment: true }
            ]
          }
        ]
      };
      expect(hasAccompaniments(size)).toBe(true);

      // Sem seleções deve falhar pois minSelections = 1 e hasAccompaniments = true
      const validationEmpty = validateAccSelections([], size);
      expect(validationEmpty.ok).toBe(false);
      expect(validationEmpty.message).toContain("Escolha pelo menos 1 item(ns)");

      // Com seleção de opção real deve passar
      const validationReal = validateAccSelections([{ id: 201, name: "Arroz Integral", groupId: 13 }], size);
      expect(validationReal.ok).toBe(true);

      // Com seleção de opção isNoAccompaniment deve passar
      const validationNoAcc = validateAccSelections([{ id: 202, name: "Sem Acompanhamento", groupId: 13, isNoAccompaniment: true }], size);
      expect(validationNoAcc.ok).toBe(true);
    });

    it("garante integridade estática: noAccompanimentsMessage mapeado e verificado nos arquivos de UI", () => {
      const mapperSource = readSource("client/src/pages/products/logic/mappers.ts");
      const mapperAdminSource = readSource("client/src/pages/adminOrders/view/steps/products/logic/mappers.ts");
      const sizeSelectorSource = readSource("client/src/pages/products/drawer/SizeSelector.tsx");
      const sizeSelectorAdminSource = readSource("client/src/pages/adminOrders/view/steps/products/drawer/SizeSelector.tsx");

      expect(mapperSource).toContain("noAccompanimentsMessage");
      expect(mapperAdminSource).toContain("noAccompanimentsMessage");
      expect(sizeSelectorSource).toContain("noAccompanimentsMessage");
      expect(sizeSelectorSource).toContain("hasAccompaniments");
      expect(sizeSelectorAdminSource).toContain("noAccompanimentsMessage");
      expect(sizeSelectorAdminSource).toContain("hasAccompaniments");
    });

    it("drawer envia mensagem de tamanho sem acompanhamentos como metadado do item", () => {
      const source = readSource("client/src/pages/products/logic/useProductDrawer.ts");
      const adminSource = readSource("client/src/pages/adminOrders/view/steps/products/view/ProductDrawer.tsx");

      expect(source).toContain("hasNoAvailableAccompaniments");
      expect(source).toContain("noAccompanimentsMessage");
      expect(source).toContain("!hasAccompaniments(selectedSize)");
      expect(adminSource).toContain("hasNoAvailableAccompaniments");
      expect(adminSource).toContain("noAccompanimentsMessage");
      expect(adminSource).toContain("NO_ACCOMPANIMENTS_FALLBACK");
    });

    it("carrinho preserva metadado sem criar acompanhamento fake", () => {
      const typeSource = readSource("client/src/_core/type/utils.ts");
      const cartSource = readSource("client/src/_core/CartContext.tsx");
      const recalcSource = readSource("server/orders/logic/recalculateOrder.ts");

      expect(typeSource).toContain("hasNoAvailableAccompaniments?: boolean");
      expect(typeSource).toContain("noAccompanimentsMessage?: string");
      expect(cartSource).toContain("normalizeNoAccompanimentsMessage");
      expect(cartSource).toContain("record.noAccompanimentsMessage");
      expect(recalcSource).toContain("sanitizeNoAccompanimentsMessage");
      expect(recalcSource).toContain("hasAvailableAccompanimentOptions");
      expect(recalcSource).toContain("noAccompanimentsMessage");
      expect(recalcSource).toContain("selectedAccs: authoritativeAccs");
      expect(recalcSource).not.toContain("selectedAccs: [noAccompanimentsMessage");
    });

    it("checkout e pedido copiam e exibem a mensagem operacional", () => {
      const checkoutOrdersSource = readSource("server/routers/storefront/checkout/orders.ts");
      const checkoutVmSource = readSource("client/src/pages/checkout/logic/useCheckoutViewModel.ts");
      const checkoutSummarySource = readSource("client/src/pages/checkout/components/CheckoutSummary.tsx");
      const successSource = readSource("client/src/pages/success/utils/orderHelpers.ts");
      const profileSource = readSource("client/src/pages/profile/components/OrderTab/OrdersTabItem.tsx");

      expect(checkoutOrdersSource).toContain("options: JSON.stringify(opts)");
      expect(checkoutVmSource).toContain("rawOptions.noAccompanimentsMessage");
      expect(checkoutSummarySource).toContain("item.noAccompanimentsMessage");
      expect(successSource).toContain("options.noAccompanimentsMessage");
      expect(profileSource).toContain("getNoAccompanimentsMessage");
      expect(profileSource).toContain("singleDishDetails.noAccompanimentsMessage");
    });

    it("admin e impressao exibem a mensagem sem alterar nutricao ou preco", () => {
      const adminItemsSource = readSource("client/src/pages/adminOrders/components/orderDrawer/AdminOrderItems.tsx");
      const stepItemsSource = readSource("client/src/pages/adminOrders/view/steps/StepItems.tsx");
      const printTemplateSource = readSource("client/src/pages/adminOrders/components/orderDrawer/print/OrderPrintTemplate.tsx");
      const escPosSource = readSource("client/src/pages/adminOrders/components/orderDrawer/print/logic/EscPosGenerator.ts");
      const nutritionSource = readSource("shared/domain/nutrition/nutrition.ts");

      expect(adminItemsSource).toContain("options.noAccompanimentsMessage");
      expect(stepItemsSource).toContain("options.noAccompanimentsMessage");
      expect(printTemplateSource).toContain("opts.noAccompanimentsMessage");
      expect(escPosSource).toContain("opts.noAccompanimentsMessage");
      expect(nutritionSource).not.toContain("noAccompanimentsMessage");
    });
  });
});
