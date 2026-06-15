import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import { z } from "zod";
import {
  suppliers,
  purchaseEntries,
  purchaseEntryItems,
  purchaseClassificationRules,
  ingredients,
} from "../../../drizzle/schema/index.js";
import { getDb } from "../../db.js";
import { adminProcedure, router } from "../../_core/trpc.js";
import {
  convertPurchaseQuantityToBaseUnit,
  calculateCostPerBaseUnit,
  inferClassificationStatus,
  normalizePurchaseUnit,
  findBestClassificationRule,
} from "../../finance/purchases.js";

const purchaseItemInputSchema = z.object({
  rawDescription: z.string().min(1, "Descrição do item é obrigatória"),
  quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  totalPrice: z.coerce.number().nonnegative("Preço total não pode ser negativo"),
  category: z.enum([
    "FOOD_INGREDIENT",
    "PACKAGING",
    "LABEL_PRINTING",
    "CLEANING",
    "LOGISTICS",
    "PAYMENT_OR_SERVICE_FEE",
    "OPERATIONAL_EXPENSE",
    "IGNORE",
  ]).optional(),
  linkedEntityType: z.enum(["ingredient", "packaging", "operational"]).optional().nullable(),
  linkedEntityId: z.number().optional().nullable(),
  conversionFactor: z.coerce.number().optional().nullable(),
  notes: z.string().optional(),
});

const purchaseEntryInputSchema = z.object({
  id: z.number().optional(),
  supplierId: z.number().optional().nullable(),
  supplierNameSnapshot: z.string().min(1, "Nome do fornecedor é obrigatório"),
  invoiceNumber: z.string().optional().nullable(),
  purchasedAt: z.coerce.date(),
  totalAmount: z.coerce.number().nonnegative("Valor total não pode ser negativo"),
  notes: z.string().optional().nullable(),
  source: z.enum(["manual", "spreadsheet", "xml"]).default("manual"),
  items: z.array(purchaseItemInputSchema).min(1, "A compra deve conter ao menos um item"),
});

export const adminPurchasesRouter = router({
  // ==========================================
  // FORNECEDORES
  // ==========================================
  listSuppliers: adminProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      let query = db.select().from(suppliers);
      if (input?.search) {
        query = query.where(like(suppliers.name, `%${input.search}%`)) as any;
      }
      return query.orderBy(asc(suppliers.name));
    }),

  createSupplier: adminProcedure
    .input(z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      cnpj: z.string().optional(),
      contactInfo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.insert(suppliers).values({
        name: input.name,
        cnpj: input.cnpj,
        contactInfo: input.contactInfo,
      });
      return {
        success: true,
        id: result[0]?.insertId,
        message: `Fornecedor "${input.name}" cadastrado com sucesso.`,
      };
    }),

  // ==========================================
  // ENTRADAS DE COMPRAS
  // ==========================================
  listEntries: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional(),
        status: z.enum(["pending", "partial", "classified", "ignored"]).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (input?.search) {
        conditions.push(like(purchaseEntries.supplierNameSnapshot, `%${input.search}%`));
      }
      if (input?.status) {
        conditions.push(eq(purchaseEntries.classificationStatus, input.status));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Contagem total
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(purchaseEntries)
        .where(whereClause);
      const total = Number(countResult?.count || 0);

      // Registros paginados
      const records = await db
        .select({
          id: purchaseEntries.id,
          supplierId: purchaseEntries.supplierId,
          supplierNameSnapshot: purchaseEntries.supplierNameSnapshot,
          invoiceNumber: purchaseEntries.invoiceNumber,
          purchasedAt: purchaseEntries.purchasedAt,
          totalAmount: purchaseEntries.totalAmount,
          source: purchaseEntries.source,
          classificationStatus: purchaseEntries.classificationStatus,
          createdAt: purchaseEntries.createdAt,
        })
        .from(purchaseEntries)
        .where(whereClause)
        .orderBy(desc(purchaseEntries.purchasedAt))
        .limit(limit)
        .offset(offset);

      // Registros paginados com contagens de itens
      const recordsWithCounts = await Promise.all(
        records.map(async (entry) => {
          const items = await db
            .select({
              classificationStatus: purchaseEntryItems.classificationStatus,
            })
            .from(purchaseEntryItems)
            .where(eq(purchaseEntryItems.purchaseEntryId, entry.id));

          const pendingCount = items.filter((it) => it.classificationStatus === "pending").length;
          const classifiedCount = items.filter((it) => it.classificationStatus === "classified").length;
          const ignoredCount = items.filter((it) => it.classificationStatus === "ignored").length;

          return {
            ...entry,
            pendingCount,
            classifiedCount,
            ignoredCount,
            totalItemsCount: items.length,
          };
        })
      );

      return {
        records: recordsWithCounts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  getEntry: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [entry] = await db
        .select()
        .from(purchaseEntries)
        .where(eq(purchaseEntries.id, input.id));

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entrada de compra não encontrada.",
        });
      }

      const items = await db
        .select()
        .from(purchaseEntryItems)
        .where(eq(purchaseEntryItems.purchaseEntryId, input.id));

      const pendingCount = items.filter((it) => it.classificationStatus === "pending").length;
      const classifiedCount = items.filter((it) => it.classificationStatus === "classified").length;
      const ignoredCount = items.filter((it) => it.classificationStatus === "ignored").length;

      return {
        ...entry,
        items,
        pendingCount,
        classifiedCount,
        ignoredCount,
        totalItemsCount: items.length,
      };
    }),

  createEntry: adminProcedure
    .input(purchaseEntryInputSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      return db.transaction(async (tx) => {
        // 1. Inserir cabeçalho da compra
        const result = await tx.insert(purchaseEntries).values({
          supplierId: input.supplierId,
          supplierNameSnapshot: input.supplierNameSnapshot,
          invoiceNumber: input.invoiceNumber,
          purchasedAt: input.purchasedAt,
          totalAmount: String(input.totalAmount),
          notes: input.notes,
          source: input.source,
          classificationStatus: "pending", // Atualizado dinamicamente depois
        });

        const entryId = result[0]?.insertId;
        if (!entryId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao gerar a Entrada de Compra.",
          });
        }

        let classifiedCount = 0;
        let ignoredCount = 0;
        const totalItemsCount = input.items.length;

        // 2. Inserir itens
        for (const item of input.items) {
          const factor = item.conversionFactor ?? 1;
          const baseQty = convertPurchaseQuantityToBaseUnit(item.quantity, item.unit, factor);
          const computedCost = calculateCostPerBaseUnit(item.totalPrice, baseQty);

          const status = inferClassificationStatus({
            category: item.category,
            linkedEntityType: item.linkedEntityType,
            linkedEntityId: item.linkedEntityId,
            conversionFactor: item.conversionFactor,
            unit: item.unit,
          });

          if (status === "classified") classifiedCount++;
          if (status === "ignored") ignoredCount++;

          await tx.insert(purchaseEntryItems).values({
            purchaseEntryId: entryId,
            rawDescription: item.rawDescription,
            quantity: String(item.quantity),
            unit: item.unit,
            totalPrice: String(item.totalPrice),
            category: item.category,
            linkedEntityType: item.linkedEntityType,
            linkedEntityId: item.linkedEntityId,
            conversionFactor: String(factor),
            computedCostPerBaseUnit: String(computedCost),
            classificationStatus: status,
            notes: item.notes,
          });
        }

        // 3. Atualizar status global do cabeçalho
        let globalStatus: "pending" | "partial" | "classified" | "ignored" = "pending";
        if (classifiedCount + ignoredCount === totalItemsCount) {
          globalStatus = ignoredCount === totalItemsCount ? "ignored" : "classified";
        } else if (classifiedCount + ignoredCount > 0) {
          globalStatus = "partial";
        }

        await tx
          .update(purchaseEntries)
          .set({ classificationStatus: globalStatus })
          .where(eq(purchaseEntries.id, entryId));

        return {
          success: true,
          id: entryId,
          message: "Compra registrada com sucesso!",
        };
      });
    }),

  classifyItem: adminProcedure
    .input(
      z.object({
        itemId: z.number(),
        category: z.enum([
          "FOOD_INGREDIENT",
          "PACKAGING",
          "LABEL_PRINTING",
          "CLEANING",
          "LOGISTICS",
          "PAYMENT_OR_SERVICE_FEE",
          "OPERATIONAL_EXPENSE",
          "IGNORE",
        ]),
        linkedEntityType: z.enum(["ingredient", "packaging", "operational"]).optional().nullable(),
        linkedEntityId: z.number().optional().nullable(),
        conversionFactor: z.coerce.number().optional().nullable(),
        saveRule: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      return db.transaction(async (tx) => {
        // 1. Obter o item existente
        const [item] = await tx
          .select()
          .from(purchaseEntryItems)
          .where(eq(purchaseEntryItems.id, input.itemId));

        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Item da compra não encontrado.",
          });
        }

        // 2. Recalcular valores base
        const factor = input.conversionFactor ?? 1;
        const qty = Number(item.quantity);
        const price = Number(item.totalPrice);
        const baseQty = convertPurchaseQuantityToBaseUnit(qty, item.unit, factor);
        const computedCost = calculateCostPerBaseUnit(price, baseQty);

        const status = inferClassificationStatus({
          category: input.category,
          linkedEntityType: input.linkedEntityType,
          linkedEntityId: input.linkedEntityId,
          conversionFactor: input.conversionFactor,
          unit: item.unit,
        });

        // 3. Atualizar o item
        await tx
          .update(purchaseEntryItems)
          .set({
            category: input.category,
            linkedEntityType: input.linkedEntityType,
            linkedEntityId: input.linkedEntityId,
            conversionFactor: String(factor),
            computedCostPerBaseUnit: String(computedCost),
            classificationStatus: status,
          })
          .where(eq(purchaseEntryItems.id, input.itemId));

        // 4. Salvar regra se solicitado
        if (input.saveRule) {
          const cleanPattern = item.rawDescription.trim().toLowerCase();
          const [existingRule] = await tx
            .select()
            .from(purchaseClassificationRules)
            .where(eq(purchaseClassificationRules.pattern, cleanPattern));

          if (existingRule) {
            await tx
              .update(purchaseClassificationRules)
              .set({
                category: input.category,
                linkedEntityType: input.linkedEntityType,
                linkedEntityId: input.linkedEntityId,
                defaultUnit: item.unit,
                conversionFactor: String(factor),
                confidence: existingRule.confidence + 1,
              })
              .where(eq(purchaseClassificationRules.id, existingRule.id));
          } else {
            await tx.insert(purchaseClassificationRules).values({
              pattern: cleanPattern,
              category: input.category,
              linkedEntityType: input.linkedEntityType,
              linkedEntityId: input.linkedEntityId,
              defaultUnit: item.unit,
              conversionFactor: String(factor),
              confidence: 1,
            });
          }
        }

        // 5. Recalcular status global da Entrada correspondente
        const entryId = item.purchaseEntryId;
        const allItems = await tx
          .select()
          .from(purchaseEntryItems)
          .where(eq(purchaseEntryItems.purchaseEntryId, entryId));

        let classifiedCount = 0;
        let ignoredCount = 0;
        const totalItemsCount = allItems.length;

        for (const it of allItems) {
          if (it.classificationStatus === "classified") classifiedCount++;
          if (it.classificationStatus === "ignored") ignoredCount++;
        }

        let globalStatus: "pending" | "partial" | "classified" | "ignored" = "pending";
        if (classifiedCount + ignoredCount === totalItemsCount) {
          globalStatus = ignoredCount === totalItemsCount ? "ignored" : "classified";
        } else if (classifiedCount + ignoredCount > 0) {
          globalStatus = "partial";
        }

        await tx
          .update(purchaseEntries)
          .set({ classificationStatus: globalStatus })
          .where(eq(purchaseEntries.id, entryId));

        return {
          success: true,
          message: "Item classificado com sucesso!",
          computedCostPerBaseUnit: computedCost,
          classificationStatus: status,
          globalStatus,
        };
      });
    }),

  // ==========================================
  // REGRAS DE CLASSIFICAÇÃO & SUGESTÃO
  // ==========================================
  listClassificationRules: adminProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      let query = db.select().from(purchaseClassificationRules);
      if (input?.search) {
        query = query.where(like(purchaseClassificationRules.pattern, `%${input.search}%`)) as any;
      }
      return query.orderBy(desc(purchaseClassificationRules.confidence));
    }),

  createClassificationRule: adminProcedure
    .input(z.object({
      pattern: z.string().min(1, "Padrão é obrigatório"),
      category: z.enum([
        "FOOD_INGREDIENT",
        "PACKAGING",
        "LABEL_PRINTING",
        "CLEANING",
        "LOGISTICS",
        "PAYMENT_OR_SERVICE_FEE",
        "OPERATIONAL_EXPENSE",
        "IGNORE",
      ]),
      linkedEntityType: z.enum(["ingredient", "packaging", "operational"]).optional().nullable(),
      linkedEntityId: z.number().optional().nullable(),
      defaultUnit: z.string().optional().nullable(),
      conversionFactor: z.coerce.number().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const cleanPattern = input.pattern.trim().toLowerCase();

      const [existing] = await db
        .select()
        .from(purchaseClassificationRules)
        .where(eq(purchaseClassificationRules.pattern, cleanPattern));

      if (existing) {
        await db
          .update(purchaseClassificationRules)
          .set({
            category: input.category,
            linkedEntityType: input.linkedEntityType,
            linkedEntityId: input.linkedEntityId,
            defaultUnit: input.defaultUnit,
            conversionFactor: input.conversionFactor ? String(input.conversionFactor) : "1.0000",
          })
          .where(eq(purchaseClassificationRules.id, existing.id));
        return {
          success: true,
          id: existing.id,
          message: `Regra para "${cleanPattern}" atualizada com sucesso.`,
        };
      }

      const result = await db.insert(purchaseClassificationRules).values({
        pattern: cleanPattern,
        category: input.category,
        linkedEntityType: input.linkedEntityType,
        linkedEntityId: input.linkedEntityId,
        defaultUnit: input.defaultUnit,
        conversionFactor: input.conversionFactor ? String(input.conversionFactor) : "1.0000",
        confidence: 1,
      });

      return {
        success: true,
        id: result[0]?.insertId,
        message: `Regra para "${cleanPattern}" criada com sucesso.`,
      };
    }),

  deleteClassificationRule: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .delete(purchaseClassificationRules)
        .where(eq(purchaseClassificationRules.id, input.id));
      return {
        success: true,
        message: "Regra de classificação removida com sucesso.",
      };
    }),

  suggestItemClassification: adminProcedure
    .input(z.object({ itemId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [item] = await db
        .select()
        .from(purchaseEntryItems)
        .where(eq(purchaseEntryItems.id, input.itemId));

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item da compra não encontrado.",
        });
      }

      const rules = await db.select().from(purchaseClassificationRules);
      const suggestion = findBestClassificationRule(item.rawDescription, rules);
      if (suggestion && suggestion.linkedEntityType === "ingredient" && suggestion.linkedEntityId) {
        const [ing] = await db
          .select({ name: ingredients.name })
          .from(ingredients)
          .where(eq(ingredients.id, suggestion.linkedEntityId));
        return {
          ...suggestion,
          linkedEntityName: ing?.name || null,
        };
      }
      return suggestion ? { ...suggestion, linkedEntityName: null } : null;
    }),
});
