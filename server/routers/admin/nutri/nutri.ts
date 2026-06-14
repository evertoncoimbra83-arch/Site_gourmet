import { z } from "zod";
import { router, adminProcedure } from "../../../_core/trpc.js";
import { getDb } from "../../../db.js";
import { 
  prescriptions, 
  dishes, 
  dishSizes, 
  nutriProfiles, 
  users, 
  nutriAddresses,
  professionalClients,
} from "../../../../drizzle/schema/index.js";
import { eq, inArray, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { safeNumber } from "../../../lib/safe-parse.js";
import { decrypt } from "../../../../server/encryption.js"; // ✅ CORREÇÃO: Nome correto da função e caminho relativo

export const adminNutriRouter = router({
  /**
   * ✅ LISTAR TODOS OS NUTRICIONISTAS
   */
  listAll: adminProcedure
    .query(async () => {
      const db = await getDb();
      const rows = await db
        .select({
          id: nutriProfiles.id,
          userId: nutriProfiles.userId,
          crn: nutriProfiles.crn,
          specialty: nutriProfiles.specialty,
          referralCode: nutriProfiles.referralCode,
          discountPercentage: nutriProfiles.discountPercentage,
          isVerified: nutriProfiles.isVerified,
          isActive: nutriProfiles.isActive,
          createdAt: nutriProfiles.createdAt,
          name: users.name,   
          email: users.email, 
          avatar: nutriProfiles.avatarUrl,
        })
        .from(nutriProfiles)
        .innerJoin(users, eq(nutriProfiles.userId, users.id))
        .orderBy(desc(nutriProfiles.createdAt));

      // ✅ Usando a função 'decrypt' exportada do seu módulo
      return rows.map(nutri => ({
        ...nutri,
        name: nutri.name ? decrypt(nutri.name) : "Nome não disponível",
        email: nutri.email ? decrypt(nutri.email) : "E-mail não disponível",
      }));
    }),

  /**
   * ✅ BUSCAR PACIENTES VINCULADOS (Aba 'Rede')
   */
  getLinkedUsers: adminProcedure
    .input(z.object({ referralCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();

      const [nutri] = await db
        .select({ id: nutriProfiles.id })
        .from(nutriProfiles)
        .where(eq(nutriProfiles.referralCode, input.referralCode))
        .limit(1);

      const canonicalRows = nutri
        ? await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              createdAt: users.createdAt
            })
            .from(professionalClients)
            .innerJoin(users, eq(professionalClients.clientId, users.id))
            .where(eq(professionalClients.professionalId, nutri.id))
        : [];

      const legacyRows = await db
        .select({
          id: users.id,
          name: users.name,   
          email: users.email, 
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.referralCode, input.referralCode));

      const rowsById = new Map<string, (typeof canonicalRows)[number]>();
      canonicalRows.forEach((row) => rowsById.set(row.id, row));
      legacyRows.forEach((row) => rowsById.set(row.id, row));
      const rows = Array.from(rowsById.values());

      return rows.map(user => ({
        ...user,
        name: user.name ? decrypt(user.name) : "Nome não disponível",
        email: user.email ? decrypt(user.email) : "E-mail não disponível",
      }));
    }),

  /**
   * ✅ BUSCAR ENDEREÇOS DO NUTRI (Aba 'Endereços')
   */
  getDetails: adminProcedure
    .input(z.object({ nutriId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db
        .select()
        .from(nutriAddresses)
        .where(eq(nutriAddresses.nutriId, input.nutriId));

      return rows.map(addr => ({
        ...addr,
        street: addr.street ? decrypt(addr.street) : null,
        number: addr.number ? decrypt(addr.number) : null,
        complement: addr.complement ? decrypt(addr.complement) : null,
        neighborhood: addr.neighborhood ? decrypt(addr.neighborhood) : null,
        city: addr.city ? decrypt(addr.city) : null,
        state: addr.state ? decrypt(addr.state) : null,
        zipCode: addr.zipCode ? decrypt(addr.zipCode) : null,
      }));
    }),

  /**
   * ✅ ATUALIZAR DADOS
   */
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      discountPercentage: z.number().optional(),
      isVerified: z.boolean().optional(),
      isActive: z.boolean().optional(),
      crn: z.string().optional(),
      specialty: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db.update(nutriProfiles).set(data).where(eq(nutriProfiles.id, id));
      return { success: true };
    }),

  /**
   * ✅ EXCLUIR
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(nutriProfiles).where(eq(nutriProfiles.id, input.id));
      return { success: true };
    }),

  /**
   * ✅ SALVAR PRESCRIÇÃO
   */
  save: adminProcedure
    .input(z.object({
      clientId: z.string(),
      professionalId: z.string(),
      planName: z.string(),
      technicalInsight: z.string().optional(),
      meals: z.array(z.object({
        name: z.string(),
        order: z.number(),
        dishes: z.array(z.object({
          dishId: z.number(),
          sizeId: z.number(),
        }))
      }))
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const allDishIds = input.meals.flatMap(m => m.dishes.map(d => d.dishId));
      const allSizeIds = input.meals.flatMap(m => m.dishes.map(d => d.sizeId));
      
      if (allDishIds.length === 0) return { success: false };

      const dishesInfo = await db.select().from(dishes).where(inArray(dishes.id, allDishIds));
      const sizesInfo = allSizeIds.length > 0 
        ? await db.select().from(dishSizes).where(inArray(dishSizes.id, allSizeIds))
        : [];

      const [nutri] = await db
        .select({ discount: nutriProfiles.discountPercentage })
        .from(nutriProfiles)
        .where(eq(nutriProfiles.id, input.professionalId))
        .limit(1);

      const dietSnapshot = input.meals.map(meal => ({
        mealName: meal.name,
        order: meal.order,
        dishes: meal.dishes.map(d => {
          const dishBase = dishesInfo.find(dbase => dbase.id === d.dishId);
          const sizeBase = sizesInfo.find(s => s.id === d.sizeId);

          return {
            dishId: d.dishId,
            sizeId: d.sizeId,
            name: dishBase?.name || "Prato não encontrado",
            priceAtCreation: safeNumber(sizeBase?.price),
            sizeName: sizeBase?.name || "Padrão",
            multiplier: "1.00", 
            nutritionalData: {
              mainDishWeight: safeNumber(sizeBase?.mainDishWeight),
              baseMacros: {
                kcal: safeNumber(dishBase?.energyKcal),
                protein: safeNumber(dishBase?.proteins),
                carbs: safeNumber(dishBase?.carbs),
                fat: safeNumber(dishBase?.fatTotal),
              }
            }
          };
        })
      }));

      await db.insert(prescriptions).values({
        id: uuidv4(),
        clientId: input.clientId,
        professionalId: input.professionalId,
        planName: input.planName,
        technicalInsight: input.technicalInsight,
        discountPercentage: nutri?.discount || 0,
        dietSnapshot: dietSnapshot, 
        status: "active"
      });

      return { success: true };
    }),
});
