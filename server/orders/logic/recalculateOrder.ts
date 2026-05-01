import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { getDb } from "../../db.js";
import {
  cartItems,
  carts,
  coupons,
  discountRules,
  loyaltySettings,
  paymentMethods,
  users,
} from "../../../drizzle/schema/index.js";
import { getDishDetails } from "../../dishes.js";
import { getPackageById } from "../../packages.js";
import { calculatePricing } from "@shared/domain/cart/pricing";
import { calculateItemUnitPrice } from "@shared/domain/math/pricing";
import { safeJsonParse, safeNumber } from "../../lib/safe-parse.js";

interface RawSelectedAcc {
  id?: string | number;
  name?: string;
  label?: string;
  weight?: number | string;
  groupId?: string | number;
  groupName?: string;
}

interface RawSelectedMeal {
  label?: string;
  dishId?: string | number;
  dishName?: string;
  accompaniments?: RawSelectedAcc[];
  selectedAccompaniments?: RawSelectedAcc[];
  selectedAccs?: RawSelectedAcc[];
}

interface AuthoritativeCartItem {
  id: string;
  dishId: string | null;
  packageId: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  name: string;
  options: Record<string, unknown>;
  appliedNutrition: unknown;
}

interface RecalculateCheckoutParams {
  userId: string;
  cartId: string;
  shippingCost: number;
  paymentMethodId: string;
  useLoyaltyPoints: boolean;
}

interface RecalculateCheckoutResult {
  cart: {
    id: string;
    couponCode: string | null;
    couponId: number | null;
    usesLoyalty: boolean;
  };
  items: AuthoritativeCartItem[];
  subtotal: number;
  autoDiscount: number;
  autoDiscountName: string | null;
  couponDiscount: number;
  loyaltyDiscount: number;
  paymentDiscount: number;
  shippingCost: number;
  totalDiscounts: number;
  total: number;
  pointsUsed: number;
  pointsEarned: number;
  paymentMethodName: string;
}

interface RecalculateCartItemParams {
  dishId?: string | null;
  packageId?: string | null;
  quantity: number;
  options: Record<string, unknown>;
  appliedNutrition?: unknown;
}

type DbType = Awaited<ReturnType<typeof getDb>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown, fallback = 0): number {
  return safeNumber(value, fallback);
}

function toNullableId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function toMeaningfulString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseRecord(value: unknown): Record<string, unknown> {
  if (isRecord(value)) return value;
  if (typeof value !== "string" || !value.trim()) return {};

  const parsed = safeJsonParse<unknown>(value, {});
  return isRecord(parsed) ? parsed : {};
}

function parseSelectedAccs(value: unknown): RawSelectedAcc[] {
  if (!Array.isArray(value)) return [];

  const result: RawSelectedAcc[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) continue;

    result.push({
      id:
        typeof entry.id === "string" || typeof entry.id === "number"
          ? entry.id
          : undefined,
      name: toMeaningfulString(entry.name) || undefined,
      label: toMeaningfulString(entry.label) || undefined,
      weight:
        typeof entry.weight === "number" || typeof entry.weight === "string"
          ? entry.weight
          : undefined,
      groupId:
        typeof entry.groupId === "string" || typeof entry.groupId === "number"
          ? entry.groupId
          : undefined,
      groupName: toMeaningfulString(entry.groupName) || undefined,
    });
  }

  return result;
}

function parseSelectedMeals(value: unknown): RawSelectedMeal[] {
  if (!Array.isArray(value)) return [];

  const result: RawSelectedMeal[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) continue;

    result.push({
      label: toMeaningfulString(entry.label) || undefined,
      dishId:
        typeof entry.dishId === "string" || typeof entry.dishId === "number"
          ? entry.dishId
          : undefined,
      dishName: toMeaningfulString(entry.dishName) || undefined,
      accompaniments: parseSelectedAccs(entry.accompaniments),
      selectedAccompaniments: parseSelectedAccs(entry.selectedAccompaniments),
      selectedAccs: parseSelectedAccs(entry.selectedAccs),
    });
  }

  return result;
}

function pickSelectedAccs(options: Record<string, unknown>): RawSelectedAcc[] {
  return (
    parseSelectedAccs(options.selectedAccs) ||
    parseSelectedAccs(options.selectedAccompaniments) ||
    parseSelectedAccs(options.accompaniments)
  );
}

function getSelectedAccsFromMeal(meal: RawSelectedMeal): RawSelectedAcc[] {
  if (meal.accompaniments && meal.accompaniments.length > 0) return meal.accompaniments;
  if (meal.selectedAccompaniments && meal.selectedAccompaniments.length > 0) {
    return meal.selectedAccompaniments;
  }
  return meal.selectedAccs || [];
}

function roundMoney(value: number): number {
  return safeNumber(value.toFixed(2));
}

function getDishBasePrice(dish: Record<string, unknown>): number {
  const basePrice = toNumber(dish.salePrice || dish.price || dish.basePrice);
  const fallbackPrice = toNumber(dish.price || dish.basePrice);
  return basePrice > 0 ? basePrice : fallbackPrice;
}

function getPackageBasePrice(pkg: Record<string, unknown>): number {
  const salePrice = toNumber(pkg.salePrice);
  const basePrice = toNumber(pkg.price);
  return salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;
}

function matchGroupForAcc(
  groups: Array<Record<string, unknown>>,
  accId: number,
  providedGroupId?: string | number,
) {
  if (providedGroupId !== undefined) {
    const exact = groups.find((group) => {
      const groupId = group.groupId ?? group.id;
      if (String(groupId) !== String(providedGroupId)) return false;
      const options = Array.isArray(group.options) ? group.options : [];
      return options.some((option) => toNumber((option as Record<string, unknown>).id) === accId);
    });
    if (exact) return exact;
  }

  return groups.find((group) => {
    const options = Array.isArray(group.options) ? group.options : [];
    return options.some((option) => toNumber((option as Record<string, unknown>).id) === accId);
  });
}

function ensureGroupSelections(
  groups: Array<Record<string, unknown>>,
  counts: Map<string, number>,
  contextName: string,
) {
  for (const group of groups) {
    const groupId = String(group.groupId ?? group.id);
    const count = counts.get(groupId) || 0;
    const minSelections = toNumber(group.minSelections);
    const maxSelections = Math.max(1, toNumber(group.maxSelections, 1));

    if (count < minSelections) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `${contextName}: faltam seleções obrigatórias em ${String(group.name || "acompanhamentos")}.`,
      });
    }

    if (count > maxSelections) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `${contextName}: limite excedido em ${String(group.name || "acompanhamentos")}.`,
      });
    }
  }
}

async function recalculateSingleItem(
  quantity: number,
  dishId: string,
  options: Record<string, unknown>,
  appliedNutrition: unknown,
): Promise<AuthoritativeCartItem> {
  const parsedDishId = toNumber(dishId, NaN);
  if (!Number.isFinite(parsedDishId)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Prato invÃ¡lido ou inativo." });
  }

  const dish = (await getDishDetails(parsedDishId)) as Record<string, unknown> | null;
  if (!dish || dish.isActive === false) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Prato inválido ou inativo." });
  }

  const sizes = Array.isArray(dish.sizes) ? (dish.sizes as Record<string, unknown>[]) : [];
  const selectedSizeId = toNullableId(options.selectedSizeId ?? options.sizeId);

  if (!selectedSizeId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Selecione o tamanho de ${String(dish.name || "seu prato")}.`,
    });
  }

  const selectedSize =
    sizes.find((size) => String(size.id) === selectedSizeId) || null;

  if (!selectedSize) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Tamanho inválido para ${String(dish.name || "o prato")}.`,
    });
  }

  const groups = Array.isArray(selectedSize.accompanimentGroups)
    ? (selectedSize.accompanimentGroups as Record<string, unknown>[])
    : [];
  const selectedAccs = pickSelectedAccs(options);
  const authoritativeAccs: Array<Record<string, unknown>> = [];
  const counts = new Map<string, number>();

  for (const selectedAcc of selectedAccs) {
    const accId = toNumber(selectedAcc.id, NaN);
    if (!Number.isFinite(accId)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Acompanhamento inválido em ${String(dish.name || "seu prato")}.`,
      });
    }

    const matchedGroup = matchGroupForAcc(groups, accId, selectedAcc.groupId);
    if (!matchedGroup) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Acompanhamento não permitido para ${String(dish.name || "este prato")}.`,
      });
    }

    const matchedOption = (Array.isArray(matchedGroup.options)
      ? matchedGroup.options
      : []
    ).find(
      (option) => toNumber((option as Record<string, unknown>).id, NaN) === accId,
    ) as Record<string, unknown> | undefined;

    if (!matchedOption) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Acompanhamento inválido para ${String(dish.name || "este prato")}.`,
      });
    }

    const groupId = String(matchedGroup.groupId ?? matchedGroup.id);
    counts.set(groupId, (counts.get(groupId) || 0) + 1);

    authoritativeAccs.push({
      id: accId,
      name: String(matchedOption.name || selectedAcc.name || selectedAcc.label || "Acompanhamento"),
      weight: selectedAcc.weight ?? matchedGroup.defaultGrammage ?? 100,
      groupId: matchedGroup.groupId ?? matchedGroup.id,
      groupName: String(matchedGroup.name || selectedAcc.groupName || ""),
      priceModifier: toNumber(matchedOption.priceModifier),
    });
  }

  ensureGroupSelections(groups, counts, String(dish.name || "Prato"));

  const unitPrice = roundMoney(
    calculateItemUnitPrice(getDishBasePrice(dish), {
      size: { price_modifier: toNumber(selectedSize.priceModifier) },
      accompaniments: authoritativeAccs.map((acc) => ({
        priceModifier: toNumber(acc.priceModifier),
      })),
    }),
  );

  return {
    id: "",
    dishId,
    packageId: null,
    quantity,
    unitPrice,
    totalPrice: roundMoney(unitPrice * quantity),
    name: String(dish.name || "Prato"),
    options: {
      _type: "single",
      dishId,
      dishName: String(dish.name || "Prato"),
      selectedSizeId,
      selectedSizeName: String(selectedSize.name || options.selectedSizeName || "Padrão"),
      selectedAccs: authoritativeAccs,
    },
    appliedNutrition,
  };
}

async function recalculatePackageItem(
  quantity: number,
  packageId: string,
  options: Record<string, unknown>,
  appliedNutrition: unknown,
): Promise<AuthoritativeCartItem> {
  const pkg = (await getPackageById(packageId)) as Record<string, unknown> | null;
  if (!pkg) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Pacote inválido ou inativo." });
  }

  const slotDefinitions = Array.isArray(pkg.options)
    ? (pkg.options as Record<string, unknown>[])
    : [];
  const selectedMeals = parseSelectedMeals(options.meals || options.items);

  if (selectedMeals.length !== slotDefinitions.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Pacote ${String(pkg.name || "")} está incompleto.`,
    });
  }

  const authoritativeMeals: Array<Record<string, unknown>> = [];

  slotDefinitions.forEach((slot, index) => {
    const meal = selectedMeals[index];
    if (!meal) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Pacote ${String(pkg.name || "")} está incompleto.`,
      });
    }

    const selectedDishId = toNullableId(meal.dishId);
    const allowedDishes = Array.isArray(slot.dishes) ? (slot.dishes as Record<string, unknown>[]) : [];

    const matchedDish =
      allowedDishes.find((dish) => String(dish.id) === selectedDishId) || null;

    if (!matchedDish || !selectedDishId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Seleção inválida em ${String(slot.label || `Marmita ${index + 1}`)}.`,
      });
    }

    const groups = Array.isArray(slot.accompanimentGroups)
      ? (slot.accompanimentGroups as Record<string, unknown>[])
      : [];
    const selectedAccs = getSelectedAccsFromMeal(meal);
    const authoritativeAccs: Array<Record<string, unknown>> = [];
    const counts = new Map<string, number>();

    for (const selectedAcc of selectedAccs) {
      const accId = toNumber(selectedAcc.id, NaN);
      if (!Number.isFinite(accId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Acompanhamento inválido em ${String(slot.label || `Marmita ${index + 1}`)}.`,
        });
      }

      const matchedGroup = matchGroupForAcc(groups, accId, selectedAcc.groupId);
      if (!matchedGroup) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Acompanhamento não permitido em ${String(slot.label || `Marmita ${index + 1}`)}.`,
        });
      }

      const matchedOption = (Array.isArray(matchedGroup.options)
        ? matchedGroup.options
        : []
      ).find(
        (option) => toNumber((option as Record<string, unknown>).id, NaN) === accId,
      ) as Record<string, unknown> | undefined;

      if (!matchedOption) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Acompanhamento inválido em ${String(slot.label || `Marmita ${index + 1}`)}.`,
        });
      }

      const groupId = String(matchedGroup.groupId ?? matchedGroup.id);
      counts.set(groupId, (counts.get(groupId) || 0) + 1);

      authoritativeAccs.push({
        id: accId,
        name: String(matchedOption.name || selectedAcc.name || selectedAcc.label || "Acompanhamento"),
        weight: selectedAcc.weight ?? matchedGroup.defaultGrammage ?? 100,
        groupId: matchedGroup.groupId ?? matchedGroup.id,
        groupName: String(matchedGroup.name || selectedAcc.groupName || ""),
      });
    }

    ensureGroupSelections(
      groups,
      counts,
      String(slot.label || `Marmita ${index + 1}`),
    );

    authoritativeMeals.push({
      label: String(slot.label || meal.label || `Marmita ${index + 1}`),
      dishId: selectedDishId,
      dishName: String(matchedDish.name || meal.dishName || "Marmita"),
      accompaniments: authoritativeAccs,
    });
  });

  const unitPrice = roundMoney(getPackageBasePrice(pkg));
  const packageSizeName =
    toMeaningfulString(options.sizeName) ||
    `${slotDefinitions.length} Marmitas`;

  return {
    id: "",
    dishId: null,
    packageId,
    quantity,
    unitPrice,
    totalPrice: roundMoney(unitPrice * quantity),
    name: String(pkg.name || "Pacote"),
    options: {
      _type: "package_custom",
      packageId,
      packageName: String(pkg.name || "Pacote"),
      sizeName: packageSizeName,
      meals: authoritativeMeals,
    },
    appliedNutrition,
  };
}

async function calculateCouponDiscount(db: DbType, couponCode: string | null, subtotal: number, autoDiscount: number) {
  if (!couponCode) {
    return { discount: 0, couponId: null };
  }

  const [dbCoupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, couponCode))
    .limit(1);

  if (!dbCoupon || !dbCoupon.isActive) {
    return { discount: 0, couponId: null };
  }

  const now = new Date();
  if ((dbCoupon.validFrom && new Date(dbCoupon.validFrom) > now) || (dbCoupon.validUntil && new Date(dbCoupon.validUntil) < now)) {
    return { discount: 0, couponId: null };
  }

  const minRequired = toNumber(dbCoupon.minOrderValue);
  if (subtotal < minRequired) {
    return { discount: 0, couponId: null };
  }

  const baseCalc = Math.max(0, subtotal - autoDiscount);
  const discountValue = toNumber(dbCoupon.discountValue);
  const isPercentage = String(dbCoupon.discountType || "")
    .toLowerCase()
    .includes("percent");

  let discount = isPercentage ? baseCalc * (discountValue / 100) : discountValue;
  const maxDiscount = toNumber(dbCoupon.maxDiscount, Infinity);
  if (Number.isFinite(maxDiscount) && maxDiscount > 0 && discount > maxDiscount) {
    discount = maxDiscount;
  }

  return {
    discount: roundMoney(Math.min(discount, baseCalc)),
    couponId:
      typeof dbCoupon.id === "number" ? dbCoupon.id : toNumber(dbCoupon.id, 0) || null,
  };
}

async function calculateLoyaltyDiscount(
  db: DbType,
  userId: string,
  useLoyaltyPoints: boolean,
  remainder: number,
) {
  if (!useLoyaltyPoints) {
    return { loyaltyDiscount: 0, pointsUsed: 0 };
  }

  const [cfg] = await db.select().from(loyaltySettings).limit(1);
  const [user] = await db
    .select({ availablePoints: users.availablePoints })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const enabled =
    cfg?.enabled === true || String(cfg?.enabled) === "1" || toNumber(cfg?.enabled) === 1;
  if (!enabled || !user || toNumber(user.availablePoints) <= 0) {
    return { loyaltyDiscount: 0, pointsUsed: 0 };
  }

  const redemptionRatePoints = Math.max(1, toNumber(cfg?.redemptionRatePoints, 100));
  const redemptionRateMoney = Math.max(0, toNumber(cfg?.redemptionRateMoney, 1));
  const minCartToRedeem = toNumber(cfg?.minCartAmount);

  if (remainder <= 0 || (minCartToRedeem > 0 && remainder < minCartToRedeem)) {
    return { loyaltyDiscount: 0, pointsUsed: 0 };
  }

  // ✅ Limite vem das faixas (redemptionRules), não do maxDiscountAmount global
  const rawRules = cfg?.redemptionRules;
  const rules: Array<{ minOrderValue: number; maxDiscount: number }> =
    Array.isArray(rawRules) ? rawRules : (typeof rawRules === 'string' ? JSON.parse(rawRules) : []);

  let tierCeiling = remainder; // sem faixas = sem limite além do saldo
  if (rules.length > 0) {
    const sorted = [...rules].sort((a, b) => toNumber(b.minOrderValue) - toNumber(a.minOrderValue));
    const matched = sorted.find(r => remainder >= toNumber(r.minOrderValue));
    tierCeiling = matched ? toNumber(matched.maxDiscount) : 0;
  }

  if (tierCeiling <= 0) return { loyaltyDiscount: 0, pointsUsed: 0 };

  const availablePoints = toNumber(user.availablePoints);
  const pointsWorthMoney =
    redemptionRatePoints > 0
      ? (availablePoints / redemptionRatePoints) * redemptionRateMoney
      : 0;

  const ceiling = tierCeiling;
  const loyaltyDiscount = roundMoney(Math.min(pointsWorthMoney, remainder, ceiling));
  const pointsUsed =
    redemptionRateMoney > 0
      ? Math.round((loyaltyDiscount / redemptionRateMoney) * redemptionRatePoints)
      : 0;

  return { loyaltyDiscount, pointsUsed };
}

async function calculatePointsEarned(db: DbType, finalNet: number) {
  const [cfg] = await db.select().from(loyaltySettings).limit(1);
  const enabled =
    cfg?.enabled === true || String(cfg?.enabled) === "1" || toNumber(cfg?.enabled) === 1;

  if (!enabled) return 0;

  const earnPts = toNumber(cfg?.conversionRatePoints);
  const earnMoney = toNumber(cfg?.conversionRateMoney, 1);
  const earnPointsPerReal = earnMoney > 0 ? earnPts / earnMoney : 0;

  return earnPointsPerReal > 0 ? Math.floor(finalNet * earnPointsPerReal) : 0;
}

export async function recalculateCartItem(
  params: RecalculateCartItemParams,
): Promise<AuthoritativeCartItem> {
  const quantity = Math.max(1, toNumber(params.quantity, 1));
  const options = parseRecord(params.options);
  const dishId = toNullableId(params.dishId ?? options.dishId);
  const packageId = toNullableId(params.packageId ?? options.packageId);

  if (packageId) {
    return recalculatePackageItem(quantity, packageId, options, params.appliedNutrition);
  }

  if (dishId) {
    return recalculateSingleItem(quantity, dishId, options, params.appliedNutrition);
  }

  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Item do carrinho sem produto ou pacote válido.",
  });
}

export async function recalculateCheckoutFromCart(
  params: RecalculateCheckoutParams,
): Promise<RecalculateCheckoutResult> {
  const db = await getDb();
  const [cart] = await db
    .select({
      id: carts.id,
      couponCode: carts.couponCode,
      couponId: carts.couponId,
      usesLoyalty: carts.usesLoyalty,
      userId: carts.userId,
    })
    .from(carts)
    .where(
      and(
        eq(carts.id, params.cartId),
        eq(carts.userId, params.userId),
        or(eq(carts.status, "active"), eq(carts.status, "open")),
      ),
    )
    .orderBy(desc(carts.updatedAt))
    .limit(1);

  if (!cart) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Carrinho não encontrado." });
  }

  const rawItems = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.cartId, cart.id))
    .orderBy(asc(cartItems.createdAt));

  if (rawItems.length === 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Seu carrinho está vazio." });
  }

  const items = await Promise.all(
    rawItems.map(async (item) => {
      const recalculated = await recalculateCartItem({
        dishId: toNullableId(item.dishId),
        packageId: toNullableId(item.packageId),
        quantity: toNumber(item.quantity, 1),
        options: item.options || {},
        appliedNutrition: item.appliedNutrition,
      });

      return {
        ...recalculated,
        id: String(item.id),
      };
    }),
  );

  const [selectedPaymentMethod] = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, params.paymentMethodId))
    .limit(1);

  if (!selectedPaymentMethod) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Método de pagamento inválido." });
  }

  const rulesRaw = await db
    .select()
    .from(discountRules)
    .where(eq(discountRules.isActive, true))
    .orderBy(asc(discountRules.minQuantity));

  const pricing = calculatePricing(
    items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.unitPrice,
      quantity: item.quantity,
    })),
    rulesRaw,
  );

  const subtotal = roundMoney(pricing.subtotal);
  const autoDiscount = roundMoney(pricing.discounts);
  const autoDiscountName = pricing.appliedRule?.name || null;

  const couponResult = await calculateCouponDiscount(
    db,
    cart.couponCode || null,
    subtotal,
    autoDiscount,
  );
  const couponDiscount = couponResult.discount;

  const paymentDiscount = roundMoney(
    subtotal * (toNumber(selectedPaymentMethod.discountPercentage) / 100),
  );

  const loyaltyBase = Math.max(0, subtotal - autoDiscount - couponDiscount);
  const { loyaltyDiscount, pointsUsed } = await calculateLoyaltyDiscount(
    db,
    params.userId,
    params.useLoyaltyPoints,
    loyaltyBase,
  );

  const shippingCost = roundMoney(params.shippingCost);
  const totalDiscounts = roundMoney(
    autoDiscount + couponDiscount + loyaltyDiscount + paymentDiscount,
  );
  const total = roundMoney(Math.max(0, subtotal + shippingCost - totalDiscounts));
  const pointsEarned = await calculatePointsEarned(db, total);

  return {
    cart: {
      id: cart.id,
      couponCode: cart.couponCode || null,
      couponId: couponResult.couponId,
      usesLoyalty: Boolean(cart.usesLoyalty),
    },
    items,
    subtotal,
    autoDiscount,
    autoDiscountName,
    couponDiscount,
    loyaltyDiscount,
    paymentDiscount,
    shippingCost,
    totalDiscounts,
    total,
    pointsUsed,
    pointsEarned,
    paymentMethodName: selectedPaymentMethod.name,
  };
}