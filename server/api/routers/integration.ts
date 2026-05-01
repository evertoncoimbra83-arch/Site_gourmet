import { router, internalProcedure } from "../../_core/trpc";
import { 
  dishes, 
  orders, 
  shippingZones, 
  accompanimentOptions 
} from "../../../drizzle/schema/index"; 
import { asc, desc, eq, inArray } from "drizzle-orm";

/**
 * 🍱 GOURMETIA INTEGRATION BRIDGE v2
 * Data Bridge seguro e performático para o gourmet-ai-service (Python).
 */
export const integrationRouter = router({
  
  /**
   * 1. INTELIGÊNCIA DE CLIENTES (CRM & LTV)
   * Agora restrito a colunas essenciais para evitar vazamento de dados sensíveis.
   */
  getCustomers: internalProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        role: true,
        aiCredits: true,
        availablePoints: true,
        createdAt: true,
        name: true, // Descriptografado via fromDriver
        phone: true,
      },
      with: {
        profile: {
          columns: { totalSpent: true }
        },
        orders: {
          columns: { total: true, status: true }
        }
      },
      limit: 1000,
    });

    return result.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      aiCredits: user.aiCredits,
      loyaltyPoints: user.availablePoints,
      totalSpent: user.profile?.totalSpent || "0.00",
      orderCount: user.orders.length,
      createdAt: user.createdAt
    }));
  }),

  /**
   * 2. CATÁLOGO E COMPOSIÇÃO TÉCNICA
   * Mantendo nomes canônicos do schema (camelCase) conforme sugestão do Codex.
   */
  getInventory: internalProcedure.query(async ({ ctx }) => {
    const [allDishes, allAccompaniments] = await Promise.all([
      ctx.db.query.dishes.findMany({
        columns: {
          id: true, name: true, slug: true, basePrice: true, salePrice: true,
          energyKcal: true, proteins: true, carbs: true, fatTotal: true, sodium: true
        },
        with: {
          category: { columns: { name: true } },
          composition: { 
            columns: { quantity: true, unit: true, ingredientName: true },
            with: { ingredient: { columns: { name: true } } }
          }
        },
        where: eq(dishes.isActive, true),
        orderBy: [asc(dishes.name)],
      }),
      ctx.db.query.accompanimentOptions.findMany({
        columns: {
          id: true, name: true, priceModifier: true, 
          energyKcal: true, proteins: true, ingredients: true
        },
        where: eq(accompanimentOptions.isActive, true),
      })
    ]);

    return { dishes: allDishes, accompaniments: allAccompaniments };
  }),

  /**
   * 3. PERFORMANCE DE VENDAS
   * Normalização de colunas para reduzir o payload do tráfego interno.
   */
  getSalesData: internalProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.query.orders.findMany({
      columns: {
        id: true, userId: true, status: true, subtotal: true, 
        shippingCost: true, totalDiscount: true, total: true,
        referralCode: true, paymentMethod: true, shippingCity: true, 
        shippingZipCode: true, createdAt: true
      },
      with: {
        items: {
          columns: {
            dishName: true, quantity: true, unitPrice: true, 
            totalPrice: true, options: true // Texto cru para parse no Python
          }
        }
      },
      where: inArray(orders.paymentStatus, ["paid"]),
      orderBy: [desc(orders.createdAt)],
      limit: 200,
    });

    return result;
  }),

  /**
   * 4. LOGÍSTICA E GEOMESH
   * Sem aliases: fidelidade total ao schema Drizzle.
   */
  getShippingIntelligence: internalProcedure.query(async ({ ctx }) => {
    const [zones, mesh] = await Promise.all([
      ctx.db.query.shippingZones.findMany({
        where: eq(shippingZones.isActive, true),
      }),
      ctx.db.query.geoMesh.findMany({
        columns: { zipCode: true, neighborhood: true, lat: true, lng: true },
        limit: 1000
      })
    ]);

    return { shippingZones: zones, geoMesh: mesh };
  })
});