// backend/src/pages/adminSizes/router/adminSizesRouter.ts

import { adminProcedure, router } from "../../_core/trpc.js";
import { z } from "zod";
import { getDb } from "../../db.js";
import { dishSizes, sizeAccompanimentGroups, dishesToSizes } from "../../../drizzle/schema/index.js"; 
import { eq, and } from "drizzle-orm"; // ✅ Adicionado inArray para o reorder

// ✅ Tipagem inferida para inserção
type SizeInsert = typeof dishSizes.$inferInsert;

export const adminSizesRouter = router({
  
  // 1. LISTAR TODOS OS TAMANHOS
  list: adminProcedure.query(async () => {
    const db = await getDb();
    const result = await db
      .select()
      .from(dishSizes)
      .orderBy(dishSizes.displayOrder); // ✅ Já retorna na ordem correta

    return result.map(size => ({
      ...size,
      groupsOrder: typeof size.groupsOrder === 'string' 
        ? JSON.parse(size.groupsOrder) as number[]
        : (size.groupsOrder as unknown as number[] || [])
    }));
  }),

  // 2. BUSCAR VÍNCULOS
  getAccompanimentGroups: adminProcedure.query(async () => {
    const db = await getDb();
    return await db.select().from(sizeAccompanimentGroups);
  }),

  /**
   * ✅ SALVAR (CRIAR OU EDITAR)
   */
  upsert: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string().min(1).optional(),
      price: z.coerce.string().optional(),
      priceModifier: z.coerce.string().optional(),
      iconKey: z.string().optional().nullable(),
      color: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
      description: z.string().optional().nullable(),
      weight: z.string().optional().nullable(),
      mainDishWeight: z.coerce.number().optional().nullable(),
      groupsOrder: z.array(z.number()).optional().nullable(), 
      displayOrder: z.number().optional(),
    }).passthrough()) 
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, groupsOrder, displayOrder, ...data } = input;
      
      const payload: SizeInsert = { 
        name: data.name ?? "",
        iconKey: data.iconKey ?? "Box",
        color: data.color ?? "slate",
        isActive: data.isActive ?? true,
        description: data.description,
        weight: data.weight,
        mainDishWeight: String(data.mainDishWeight || "200.00"),
        price: String(data.price || "0.00"),
        priceModifier: String(data.priceModifier || "0.00"),
        groupsOrder: JSON.stringify(groupsOrder || []),
        displayOrder: displayOrder ?? 0, 
      };

      if (id) {
        await db.update(dishSizes).set(payload).where(eq(dishSizes.id, id));
        return { 
          success: true, 
          id, 
          message: `Tamanho "${data.name}" atualizado com sucesso!` 
        };
      } 
      
      const [res] = await db.insert(dishSizes).values(payload) as unknown as [{ insertId: number }];
      
      return { 
        success: true, 
        id: res.insertId,
        message: `Novo tamanho "${data.name}" criado!` 
      };
    }),

  /**
   * ✅ DELETAR
   */
  delete: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.transaction(async (tx) => {
        await tx.delete(sizeAccompanimentGroups).where(eq(sizeAccompanimentGroups.sizeId, input.id));
        await tx.delete(dishesToSizes).where(eq(dishesToSizes.sizeId, input.id));
        await tx.delete(dishSizes).where(eq(dishSizes.id, input.id));
      });
      return { 
        success: true, 
        message: input.name ? `Tamanho "${input.name}" removido.` : "Tamanho excluído do sistema." 
      };
    }),

  /**
   * ✅ REORDENAR (A ROTA QUE ESTAVA FALTANDO!)
   */
  reorder: adminProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      // Atualiza a displayOrder de cada ID individualmente no banco
      await db.transaction(async (tx) => {
        for (let i = 0; i < input.ids.length; i++) {
          await tx
            .update(dishSizes)
            .set({ displayOrder: i })
            .where(eq(dishSizes.id, input.ids[i]));
        }
      });

      return { success: true, message: "Ordem dos tamanhos atualizada!" };
    }),

  /**
   * ✅ VÍNCULOS (TOGGLE LINK + AUTO SYNC)
   */
  toggleLink: adminProcedure
    .input(z.object({
      sizeId: z.number(),
      accompanimentGroupId: z.number()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      return await db.transaction(async (tx) => {
        const existing = await tx.select()
          .from(sizeAccompanimentGroups)
          .where(and(
            eq(sizeAccompanimentGroups.sizeId, input.sizeId),
            eq(sizeAccompanimentGroups.accompanimentGroupId, input.accompanimentGroupId)
          ))
          .limit(1);

        let linked = false;
        if (existing.length > 0) {
          await tx.delete(sizeAccompanimentGroups)
            .where(and(
              eq(sizeAccompanimentGroups.sizeId, input.sizeId),
              eq(sizeAccompanimentGroups.accompanimentGroupId, input.accompanimentGroupId)
            ));
        } else {
          await tx.insert(sizeAccompanimentGroups).values({
            sizeId: input.sizeId,
            accompanimentGroupId: input.accompanimentGroupId
          });
          linked = true;
        }

        const currentLinks = await tx.select({ id: sizeAccompanimentGroups.accompanimentGroupId })
          .from(sizeAccompanimentGroups)
          .where(eq(sizeAccompanimentGroups.sizeId, input.sizeId));
        
        const newOrder = currentLinks.map(l => l.id);
        
        await tx.update(dishSizes)
          .set({ groupsOrder: JSON.stringify(newOrder) })
          .where(eq(dishSizes.id, input.sizeId));

        return { 
          success: true, 
          message: linked ? "Grupo de acompanhamento vinculado!" : "Vínculo removido e lista sincronizada." 
        };
      });
    })
});