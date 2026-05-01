import { adminProcedure, router } from "../../_core/trpc.js";
import { z } from "zod";
import { getDb } from "../../db.js";
import { accompanimentGroups, sizeAccompanimentGroups, groupToOptions } from "../../../drizzle/schema/index.js"; 
import { eq, asc } from "drizzle-orm";

type GroupInsert = typeof accompanimentGroups.$inferInsert;

function createSlug(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const adminGroupsRouter = router({
  
  list: adminProcedure.query(async () => {
    const db = await getDb();
    return await db.select().from(accompanimentGroups).orderBy(asc(accompanimentGroups.name));
  }),

  upsert: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string().min(1, "O nome do grupo é obrigatório"),
      isActive: z.boolean().optional(),
      minSelections: z.coerce.number().optional().default(0),
      maxSelections: z.coerce.number().optional().default(1),
      defaultGrammage: z.coerce.number().optional().default(100),
      // ✅ Removido displayOrder daqui pois o Schema não possui essa coluna
      itemsOrder: z.array(z.object({
        id: z.number().optional(),
        group_id: z.number().optional()
      })).optional().nullable(), 
    }).passthrough())
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, itemsOrder, ...data } = input;

      // 🚀 CORREÇÃO DO ERRO DE DUPLICIDADE:
      const baseSlug = createSlug(data.name);
      const uniqueSlug = id ? baseSlug : `${baseSlug}-${Date.now()}`;

      const payload: GroupInsert = {
        name: data.name,
        slug: uniqueSlug, 
        isActive: data.isActive ?? true,
        minSelections: data.minSelections,
        maxSelections: data.maxSelections,
        defaultGrammage: String(data.defaultGrammage || "100.00"),
        itemsOrder: itemsOrder ? JSON.stringify(itemsOrder) : "[]",
        // ✅ Removido displayOrder daqui para satisfazer o TypeScript (TS2353)
      };

      return await db.transaction(async (tx) => {
        let finalId: number;

        if (id) {
          await tx.update(accompanimentGroups).set(payload).where(eq(accompanimentGroups.id, id));
          finalId = id;
        } else {
          // Double casting para satisfazer o driver MySQL
          const [res] = await tx.insert(accompanimentGroups).values(payload) as unknown as [{ insertId: number }];
          finalId = res.insertId;
        }

        if (finalId) {
          await tx.delete(groupToOptions).where(eq(groupToOptions.groupId, finalId));

          if (itemsOrder && itemsOrder.length > 0) {
            const inserts = itemsOrder.map((item) => ({
              groupId: finalId,
              optionId: Number(item.group_id || item.id) 
            })).filter(i => i.optionId > 0);

            if (inserts.length > 0) {
              await tx.insert(groupToOptions).values(inserts);
            }
          }
        }

        const message = id 
          ? `Grupo "${data.name}" atualizado!` 
          : `Novo grupo "${data.name}" criado com sucesso!`;

        return { success: true, id: finalId, message };
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      return await db.transaction(async (tx) => {
        await tx.delete(sizeAccompanimentGroups).where(eq(sizeAccompanimentGroups.accompanimentGroupId, input.id));
        await tx.delete(groupToOptions).where(eq(groupToOptions.groupId, input.id));
        await tx.delete(accompanimentGroups).where(eq(accompanimentGroups.id, input.id));

        return {
          success: true,
          message: input.name ? `Grupo "${input.name}" excluído.` : "Grupo removido."
        };
      });
    }),
});