import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import { z } from "zod";
import {
  suppliers,
  purchaseEntries,
  purchaseEntryItems,
  purchaseClassificationRules,
  ingredients,
  costHistory,
} from "../../../drizzle/schema/index.js";
import { getDb } from "../../db.js";
import { adminProcedure, router } from "../../_core/trpc.js";
import {
  convertPurchaseQuantityToBaseUnit,
  calculateCostPerBaseUnit,
  inferClassificationStatus,
  normalizePurchaseUnit,
  findBestClassificationRule,
  canApplyPurchaseItemCost,
  calculateCostDelta,
  validateCostApplication,
} from "../../finance/purchases.js";
import { parseFiscalXml } from "../../finance/fiscalXml.js";
import {
  extractNfceAccessKey,
  validateNfceAccessKey,
  maskNfceAccessKey,
  detectNfceStateFromUrl,
} from "../../finance/nfceQr.js";

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
          .select({
            name: ingredients.name,
            unit: ingredients.unit,
            currentCostPerBaseUnit: ingredients.currentCostPerBaseUnit,
            currentCostBaseUnit: ingredients.currentCostBaseUnit,
          })
          .from(ingredients)
          .where(eq(ingredients.id, suggestion.linkedEntityId));
        return {
          ...suggestion,
          linkedEntityName: ing?.name || null,
          unit: ing?.unit || null,
          currentCostPerBaseUnit: ing?.currentCostPerBaseUnit || null,
          currentCostBaseUnit: ing?.currentCostBaseUnit || null,
        };
      }
      return suggestion ? {
        ...suggestion,
        linkedEntityName: null,
        unit: null,
        currentCostPerBaseUnit: null,
        currentCostBaseUnit: null,
      } : null;
    }),

  getCostApplicationPreview: adminProcedure
    .input(z.object({ purchaseEntryItemId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [item] = await db
        .select()
        .from(purchaseEntryItems)
        .where(eq(purchaseEntryItems.id, input.purchaseEntryItemId));

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item da compra não encontrado.",
        });
      }

      // Validações básicas de aplicabilidade
      if (item.category !== "FOOD_INGREDIENT") {
        return {
          canApply: false,
          blockReason: "Apenas itens de Insumo Alimentar (Ingrediente) podem ter custos aplicados ao catálogo nesta fase.",
        };
      }

      if (item.linkedEntityType !== "ingredient" || !item.linkedEntityId) {
        return {
          canApply: false,
          blockReason: "O item não está vinculado a um ingrediente do catálogo.",
        };
      }

      if (item.classificationStatus !== "classified") {
        return {
          canApply: false,
          blockReason: "O item ainda não foi classificado.",
        };
      }

      const [ing] = await db
        .select()
        .from(ingredients)
        .where(eq(ingredients.id, item.linkedEntityId));

      if (!ing) {
        return {
          canApply: false,
          blockReason: "Ingrediente vinculado não encontrado no catálogo.",
        };
      }

      const currentCost = parseFloat(String(ing.currentCostPerBaseUnit || "0"));
      const newCost = parseFloat(String(item.computedCostPerBaseUnit || "0"));

      if (isNaN(newCost) || newCost < 0) {
        return {
          canApply: false,
          blockReason: "O custo computado do item é inválido ou negativo.",
        };
      }

      const delta = calculateCostDelta(currentCost, newCost);
      const validation = validateCostApplication(currentCost, newCost);

      if (!validation.valid) {
        return {
          canApply: false,
          blockReason: validation.error || "Validação do custo falhou.",
        };
      }

      return {
        canApply: true,
        rawDescription: item.rawDescription,
        category: item.category,
        linkedEntityType: item.linkedEntityType,
        linkedEntityId: item.linkedEntityId,
        ingredientName: ing.name,
        currentCost,
        newCost,
        baseUnit: ing.unit || "g",
        diffAbsolute: delta.diffAbsolute,
        diffPercent: delta.diffPercent,
        isHighVariance: delta.isHighVariance,
        costApplicationStatus: item.costApplicationStatus,
        warning: validation.warning,
      };
    }),

  applyPurchaseItemCost: adminProcedure
    .input(
      z.object({
        purchaseEntryItemId: z.number(),
        confirm: z.boolean(),
        confirmHighVariance: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!input.confirm) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Confirmação explícita é obrigatória para aplicar o custo.",
        });
      }

      const db = await getDb();
      return db.transaction(async (tx) => {
        // 1. Obter e validar o item da compra dentro da transação
        const [item] = await tx
          .select()
          .from(purchaseEntryItems)
          .where(eq(purchaseEntryItems.id, input.purchaseEntryItemId));

        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Item da compra não encontrado.",
          });
        }

        if (item.category !== "FOOD_INGREDIENT" || item.linkedEntityType !== "ingredient" || !item.linkedEntityId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Apenas itens de Insumo Alimentar vinculados podem ter custos aplicados.",
          });
        }

        if (item.classificationStatus !== "classified") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "O item precisa estar classificado para ter seu custo aplicado.",
          });
        }

        // 2. Obter ingrediente correspondente
        const [ing] = await tx
          .select()
          .from(ingredients)
          .where(eq(ingredients.id, item.linkedEntityId));

        if (!ing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Ingrediente vinculado não encontrado no catálogo.",
          });
        }

        const currentCost = parseFloat(String(ing.currentCostPerBaseUnit || "0"));
        const newCost = parseFloat(String(item.computedCostPerBaseUnit || "0"));

        const delta = calculateCostDelta(currentCost, newCost);
        const validation = validateCostApplication(currentCost, newCost);

        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: validation.error || "O custo fornecido é inválido.",
          });
        }

        if (delta.isHighVariance && !input.confirmHighVariance) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Variação de custo muito alta (>= 30%). Confirmação adicional necessária.",
          });
        }

        const adminId = (ctx as any).user?.id || null;
        const entryId = item.purchaseEntryId;

        // 3. Gravar histórico em cost_history
        await tx.insert(costHistory).values({
          entityType: "ingredient",
          entityId: ing.id,
          previousCostPerBaseUnit: String(currentCost),
          newCostPerBaseUnit: String(newCost),
          baseUnit: ing.unit || "g",
          source: "purchase",
          purchaseEntryId: entryId,
          purchaseEntryItemId: item.id,
          reason: `Atualização de custo manual a partir da compra #${entryId}`,
          appliedBy: adminId,
        });

        // 4. Atualizar o custo vigente do ingrediente
        await tx
          .update(ingredients)
          .set({
            currentCostPerBaseUnit: String(newCost),
            currentCostBaseUnit: ing.unit || "g",
            lastCostUpdateAt: new Date(),
            lastCostSource: "purchase",
            lastCostPurchaseItemId: item.id,
          })
          .where(eq(ingredients.id, ing.id));

        // 5. Atualizar o status de aplicação de custo no item da compra
        await tx
          .update(purchaseEntryItems)
          .set({
            costAppliedAt: new Date(),
            costAppliedBy: adminId,
            costApplicationStatus: "applied",
          })
          .where(eq(purchaseEntryItems.id, item.id));

        return {
          success: true,
          message: `Custo do ingrediente "${ing.name}" atualizado para R$ ${newCost.toFixed(4)} por ${ing.unit || "g"}.`,
        };
      });
    }),

  previewFiscalXmlImport: adminProcedure
    .input(z.object({
      xmlContent: z.string().min(1, "Conteúdo do XML é obrigatório"),
      fileName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const parsed = parseFiscalXml(input.xmlContent);

      // Verificar duplicidade pela chave de acesso
      const [existing] = await db
        .select()
        .from(purchaseEntries)
        .where(eq(purchaseEntries.fiscalAccessKey, parsed.document.accessKey));

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este XML já foi importado como entrada de compra.",
        });
      }

      // Buscar fornecedor por CNPJ
      const [supplierRecord] = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.cnpj, parsed.supplier.cnpj));

      // Carregar todas as regras de classificação para aplicar sugestões
      const rules = await db.select().from(purchaseClassificationRules);

      // Processar sugestão para cada item
      const itemsWithSuggestions = await Promise.all(
        parsed.items.map(async (item) => {
          const suggestion = findBestClassificationRule(item.description, rules);
          let linkedEntityName: string | null = null;
          if (suggestion && suggestion.linkedEntityType === "ingredient" && suggestion.linkedEntityId) {
            const [ing] = await db
              .select({ name: ingredients.name })
              .from(ingredients)
              .where(eq(ingredients.id, suggestion.linkedEntityId));
            linkedEntityName = ing?.name || null;
          }
          return {
            ...item,
            suggestion: suggestion
              ? {
                  ...suggestion,
                  linkedEntityName,
                }
              : null,
          };
        })
      );

      return {
        document: parsed.document,
        supplier: {
          ...parsed.supplier,
          id: supplierRecord?.id || null,
          exists: !!supplierRecord,
        },
        items: itemsWithSuggestions,
        totals: parsed.totals,
      };
    }),

  createEntryFromFiscalXml: adminProcedure
    .input(z.object({
      xmlContent: z.string().min(1, "Conteúdo do XML é obrigatório"),
      notes: z.string().optional().nullable(),
      supplierId: z.number().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const parsed = parseFiscalXml(input.xmlContent);

      // Verificar duplicidade pela chave de acesso novamente
      const [existing] = await db
        .select()
        .from(purchaseEntries)
        .where(eq(purchaseEntries.fiscalAccessKey, parsed.document.accessKey));

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este XML já foi importado como entrada de compra.",
        });
      }

      const adminId = (ctx as any).user?.id || null;

      return db.transaction(async (tx) => {
        let finalSupplierId = input.supplierId;
        let supplierName = parsed.supplier.name;

        // Se supplierId não foi fornecido, resolver por CNPJ ou criar
        if (!finalSupplierId) {
          const [existingSupplier] = await tx
            .select()
            .from(suppliers)
            .where(eq(suppliers.cnpj, parsed.supplier.cnpj));

          if (existingSupplier) {
            finalSupplierId = existingSupplier.id;
            supplierName = existingSupplier.name;
          } else {
            // Criar novo fornecedor
            const contactInfo = `Cidade: ${parsed.supplier.city || ""}, UF: ${parsed.supplier.state || ""}. Inscrição Estadual: ${parsed.supplier.stateRegistration || ""}`;
            const [newSup] = await tx.insert(suppliers).values({
              name: parsed.supplier.name,
              cnpj: parsed.supplier.cnpj,
              contactInfo,
            });
            finalSupplierId = newSup.insertId;
          }
        } else {
          // Validar se fornecedor existe e pegar seu nome
          const [sup] = await tx
            .select()
            .from(suppliers)
            .where(eq(suppliers.id, finalSupplierId));
          if (!sup) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Fornecedor selecionado não encontrado.",
            });
          }
          supplierName = sup.name;
        }

        // Inserir cabeçalho de compras
        const purchasedAt = parsed.document.issuedAt || new Date();
        const [newEntry] = await tx.insert(purchaseEntries).values({
          supplierId: finalSupplierId,
          supplierNameSnapshot: supplierName,
          invoiceNumber: parsed.document.number,
          purchasedAt,
          totalAmount: String(parsed.document.totalAmount),
          notes: input.notes,
          source: "xml",
          fiscalAccessKey: parsed.document.accessKey,
          fiscalDocumentType: parsed.document.type,
          fiscalSeries: parsed.document.series,
          fiscalNumber: parsed.document.number,
          fiscalIssuedAt: purchasedAt,
          classificationStatus: "pending",
        });

        const entryId = newEntry.insertId;
        if (!entryId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao gerar a Entrada de Compra a partir do XML.",
          });
        }

        // Carregar todas as regras para classificar de forma automática na criação
        const rules = await tx.select().from(purchaseClassificationRules);
        let classifiedCount = 0;
        let ignoredCount = 0;
        const totalItemsCount = parsed.items.length;

        for (const item of parsed.items) {
          const suggestion = findBestClassificationRule(item.description, rules);

          let category = null;
          let linkedEntityType = null;
          let linkedEntityId = null;
          let factor = 1;
          let status: "pending" | "classified" | "ignored" = "pending";

          if (suggestion) {
            category = suggestion.category;
            linkedEntityType = suggestion.linkedEntityType;
            linkedEntityId = suggestion.linkedEntityId;
            factor = suggestion.conversionFactor || 1;
            status = inferClassificationStatus({
              category,
              linkedEntityType,
              linkedEntityId,
              conversionFactor: factor,
              unit: item.unit,
            });
          }

          if (status === "classified") classifiedCount++;
          if (status === "ignored") ignoredCount++;

          const baseQty = convertPurchaseQuantityToBaseUnit(item.quantity, item.unit, factor);
          const computedCost = calculateCostPerBaseUnit(item.totalPrice, baseQty);

          await tx.insert(purchaseEntryItems).values({
            purchaseEntryId: entryId,
            rawDescription: item.description,
            quantity: String(item.quantity),
            unit: item.unit,
            totalPrice: String(item.totalPrice),
            category: category as any,
            linkedEntityType: linkedEntityType as any,
            linkedEntityId,
            conversionFactor: String(factor),
            computedCostPerBaseUnit: String(computedCost),
            classificationStatus: status,
            fiscalCode: item.code,
            ean: item.ean,
            ncm: item.ncm,
            cfop: item.cfop,
          });
        }

        // Atualizar status global do cabeçalho
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
          message: "Entrada de compra importada do XML com sucesso!",
        };
      });
    }),

  parseNfceQrUrl: adminProcedure
    .input(z.object({ urlOrKey: z.string().min(1, "URL ou chave é obrigatória") }))
    .mutation(async ({ input }) => {
      const accessKey = extractNfceAccessKey(input.urlOrKey);
      if (!accessKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Não foi possível extrair uma chave de acesso de 44 dígitos do texto fornecido.",
        });
      }
      const isValid = validateNfceAccessKey(accessKey);
      const maskedKey = maskNfceAccessKey(accessKey);
      const state = detectNfceStateFromUrl(input.urlOrKey);
      return { accessKey, isValid, maskedKey, state };
    }),

  searchLinkableIngredients: adminProcedure
    .input(
      z.object({
        search: z.string().optional().default(""),
        limit: z.number().optional().default(15),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const term = input.search ? input.search.trim() : "";

      if (!term || term.length < 2) {
        return [];
      }

      return db
        .select({
          id: ingredients.id,
          name: ingredients.name,
          unit: ingredients.unit,
          currentCostPerBaseUnit: ingredients.currentCostPerBaseUnit,
          currentCostBaseUnit: ingredients.currentCostBaseUnit,
        })
        .from(ingredients)
        .where(like(ingredients.name, `%${term}%`))
        .orderBy(asc(ingredients.name))
        .limit(input.limit);
    }),
});
