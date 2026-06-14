import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gte, like, lte, or } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, operatorProcedure, router } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { safeInteger, safeNumber } from "../../lib/safe-parse.js";
import { syncPdvComandaToBI } from "../../pdv-bi-sync.js";
import { AuditLogService } from "../../services/AuditLogService.js";
import {
  pdvClientes,
  pdvComandas,
  pdvComandaItens,
  pdvFechamentos,
  pdvPagamentos,
} from "../../../drizzle/schema/index.js";

const clienteSchema = z.object({
  tipo: z.enum(["cpf", "cnpj"]),
  documento: z.string().min(11).max(20),
  nome: z.string().min(1).max(255),
  email: z.string().email().optional().or(z.literal("")),
  telefone: z.string().max(30).optional().or(z.literal("")),
  empresa: z.string().max(255).optional().or(z.literal("")),
  observacoes: z.string().max(2000).optional().or(z.literal("")),
});

const pagamentoSchema = z.object({
  forma: z.enum(["cartao", "pix", "outro"]),
  formaDescricao: z.string().max(255).optional(),
  valor: z.number().nonnegative(),
});

function money(value: unknown): number {
  return safeNumber(safeNumber(value).toFixed(2));
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function textOrNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function todayKey(date = new Date()): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayBounds(dateKey: string): { start: Date; end: Date } {
  return {
    start: new Date(`${dateKey}T00:00:00.000`),
    end: new Date(`${dateKey}T23:59:59.999`),
  };
}

async function recalculateComandaTotals(
  tx: Awaited<ReturnType<typeof getDb>>,
  comandaId: number,
) {
  const items = await tx.query.pdvComandaItens.findMany({
    where: eq(pdvComandaItens.comandaId, comandaId),
  });
  const comanda = await tx.query.pdvComandas.findFirst({
    where: eq(pdvComandas.id, comandaId),
  });

  if (!comanda) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Comanda não encontrada.",
    });
  }

  const totalItens = money(
    items.reduce((acc, item) => acc + money(item.subtotal), 0),
  );
  const totalFinal = money(Math.max(totalItens - money(comanda.desconto), 0));

  await tx
    .update(pdvComandas)
    .set({
      totalItens: totalItens.toFixed(2),
      totalFinal: totalFinal.toFixed(2),
    })
    .where(eq(pdvComandas.id, comandaId));
}

async function getComandaPayload(id: number) {
  const db = await getDb();
  const comanda = await db.query.pdvComandas.findFirst({
    where: eq(pdvComandas.id, id),
    with: {
      cliente: true,
      itens: {
        orderBy: [desc(pdvComandaItens.id)],
      },
      pagamentos: {
        orderBy: [asc(pdvPagamentos.id)],
      },
    },
  });

  if (!comanda) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Comanda não encontrada.",
    });
  }

  return {
    id: comanda.id,
    status: comanda.status,
    observacoes: comanda.observacoes,
    desconto: money(comanda.desconto),
    totalItens: money(comanda.totalItens),
    totalFinal: money(comanda.totalFinal),
    abertaEm: comanda.abertaEm,
    fechadaEm: comanda.fechadaEm,
    createdBy: comanda.createdBy,
    cliente: {
      id: comanda.cliente.id,
      tipo: comanda.cliente.tipo,
      documento: comanda.cliente.documento,
      nome: comanda.cliente.nome,
      email: comanda.cliente.email,
      telefone: comanda.cliente.telefone,
      empresa: comanda.cliente.empresa,
      observacoes: comanda.cliente.observacoes,
    },
    itens: comanda.itens.map((item) => ({
      id: item.id,
      dishId: item.dishId,
      nome: item.nome,
      precoUnit: money(item.precoUnit),
      quantidade: safeInteger(item.quantidade, 0),
      subtotal: money(item.subtotal),
      observacao: item.observacao,
      createdAt: item.createdAt,
    })),
    pagamentos: comanda.pagamentos.map((pagamento) => ({
      id: pagamento.id,
      forma: pagamento.forma,
      formaDescricao: pagamento.formaDescricao,
      valor: money(pagamento.valor),
      createdAt: pagamento.createdAt,
    })),
    quantidadeItens: comanda.itens.reduce(
      (acc, item) => acc + safeInteger(item.quantidade, 0),
      0,
    ),
  };
}

export const pdvRouter = router({
  clientes: router({
    buscar: operatorProcedure
      .input(z.object({ termo: z.string().trim().min(1) }))
      .query(async ({ input }) => {
        const db = await getDb();
        const termo = input.termo.trim();
        const documento = onlyDigits(termo);
        const rows = await db
          .select()
          .from(pdvClientes)
          .where(
            or(
              like(pdvClientes.nome, `%${termo}%`),
              like(pdvClientes.documento, `%${documento || termo}%`),
            ),
          )
          .orderBy(asc(pdvClientes.nome))
          .limit(20);

        return rows.map((cliente) => ({
          id: cliente.id,
          tipo: cliente.tipo,
          documento: cliente.documento,
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          empresa: cliente.empresa,
          observacoes: cliente.observacoes,
        }));
      }),

    criar: operatorProcedure.input(clienteSchema).mutation(async ({ input }) => {
      const db = await getDb();
      const payload = {
        tipo: input.tipo,
        documento: onlyDigits(input.documento),
        nome: input.nome.trim(),
        email: textOrNull(input.email),
        telefone: textOrNull(input.telefone),
        empresa: textOrNull(input.empresa),
        observacoes: textOrNull(input.observacoes),
      } satisfies typeof pdvClientes.$inferInsert;

      const [insertResult] = await db.insert(pdvClientes).values(payload);
      const insertId = insertResult?.insertId;

      if (!insertId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro operacional ao gerar o ID do registro no banco.",
        });
      }

      return {
        success: true,
        id: safeInteger(insertId, 0),
        message: `Cliente "${payload.nome}" cadastrado com sucesso.`,
      };
    }),

    listar: operatorProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1).optional(),
          perPage: z.number().min(1).max(100).default(20).optional(),
        }),
      )
      .query(async ({ input }) => {
        const db = await getDb();
        const page = input.page ?? 1;
        const perPage = input.perPage ?? 20;
        const offset = (page - 1) * perPage;
        const [total] = await db.select({ value: count() }).from(pdvClientes);
        const rows = await db
          .select()
          .from(pdvClientes)
          .orderBy(desc(pdvClientes.id))
          .limit(perPage)
          .offset(offset);

        return {
          data: rows.map((cliente) => ({
            id: cliente.id,
            tipo: cliente.tipo,
            documento: cliente.documento,
            nome: cliente.nome,
            email: cliente.email,
            telefone: cliente.telefone,
            empresa: cliente.empresa,
            observacoes: cliente.observacoes,
            createdAt: cliente.createdAt,
            updatedAt: cliente.updatedAt,
          })),
          total: safeInteger(total?.value, 0),
          page,
          perPage,
        };
      }),
  }),

  comandas: router({
    abrir: operatorProcedure
      .input(
        z.object({
          clienteId: z.number().int().positive(),
          observacoes: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const cliente = await db.query.pdvClientes.findFirst({
          where: eq(pdvClientes.id, input.clienteId),
        });

        if (!cliente) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cliente não encontrado.",
          });
        }

        const [insertResult] = await db.insert(pdvComandas).values({
          clienteId: input.clienteId,
          status: "aberta",
          observacoes: textOrNull(input.observacoes),
          desconto: "0.00",
          totalItens: "0.00",
          totalFinal: "0.00",
          abertaEm: new Date(),
          createdBy: ctx.user.id,
        });
        const insertId = insertResult?.insertId;

        if (!insertId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro operacional ao gerar o ID do registro no banco.",
          });
        }

        return {
          success: true,
          id: safeInteger(insertId, 0),
          message: `Comanda de "${cliente.nome}" aberta com sucesso.`,
        };
      }),

    listarAbertas: operatorProcedure.query(async () => {
      const db = await getDb();
      const comandas = await db.query.pdvComandas.findMany({
        where: eq(pdvComandas.status, "aberta"),
        with: {
          cliente: true,
          itens: true,
        },
        orderBy: [asc(pdvComandas.abertaEm)],
      });

      return comandas.map((comanda) => ({
        id: comanda.id,
        clienteId: comanda.clienteId,
        clienteNome: comanda.cliente.nome,
        clienteDocumento: comanda.cliente.documento,
        status: comanda.status,
        observacoes: comanda.observacoes,
        totalItens: money(comanda.totalItens),
        totalFinal: money(comanda.totalFinal),
        desconto: money(comanda.desconto),
        abertaEm: comanda.abertaEm,
        quantidadeItens: comanda.itens.reduce(
          (acc, item) => acc + safeInteger(item.quantidade, 0),
          0,
        ),
      }));
    }),

    getById: operatorProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => getComandaPayload(input.id)),

    adicionarItem: operatorProcedure
      .input(
        z.object({
          comandaId: z.number().int().positive(),
          dishId: z.number().int().positive().nullable().optional(),
          nome: z.string().min(1).max(255),
          precoUnit: z.number().nonnegative(),
          quantidade: z.number().int().positive(),
          observacao: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        const subtotal = money(input.precoUnit * input.quantidade);

        await db.transaction(async (tx) => {
          const comanda = await tx.query.pdvComandas.findFirst({
            where: eq(pdvComandas.id, input.comandaId),
          });

          if (!comanda) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Comanda não encontrada.",
            });
          }

          if (comanda.status !== "aberta") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Apenas comandas abertas podem receber itens.",
            });
          }

          await tx.insert(pdvComandaItens).values({
            comandaId: input.comandaId,
            dishId: input.dishId ?? null,
            nome: input.nome.trim(),
            precoUnit: money(input.precoUnit).toFixed(2),
            quantidade: input.quantidade,
            subtotal: subtotal.toFixed(2),
            observacao: textOrNull(input.observacao),
          });

          await recalculateComandaTotals(
            tx as Awaited<ReturnType<typeof getDb>>,
            input.comandaId,
          );
        });

        return {
          success: true,
          message: `Item "${input.nome}" adicionado à comanda.`,
        };
      }),

    removerItem: operatorProcedure
      .input(z.object({ itemId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const db = await getDb();

        await db.transaction(async (tx) => {
          const item = await tx.query.pdvComandaItens.findFirst({
            where: eq(pdvComandaItens.id, input.itemId),
          });

          if (!item) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Item não encontrado.",
            });
          }

          await tx
            .delete(pdvComandaItens)
            .where(eq(pdvComandaItens.id, input.itemId));

          await recalculateComandaTotals(
            tx as Awaited<ReturnType<typeof getDb>>,
            item.comandaId,
          );
        });

        return {
          success: true,
          message: "Item removido da comanda.",
        };
      }),

    atualizarItemObservacao: operatorProcedure
      .input(
        z.object({
          itemId: z.number().int().positive(),
          observacao: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        await db
          .update(pdvComandaItens)
          .set({ observacao: textOrNull(input.observacao) })
          .where(eq(pdvComandaItens.id, input.itemId));

        return {
          success: true,
          message: "Observação do item atualizada.",
        };
      }),

    aplicarDesconto: operatorProcedure
      .input(
        z.object({
          comandaId: z.number().int().positive(),
          desconto: z.number().nonnegative(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        await db.transaction(async (tx) => {
          const comanda = await tx.query.pdvComandas.findFirst({
            where: eq(pdvComandas.id, input.comandaId),
          });

          if (!comanda) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Comanda não encontrada.",
            });
          }

          await tx
            .update(pdvComandas)
            .set({ desconto: money(input.desconto).toFixed(2) })
            .where(eq(pdvComandas.id, input.comandaId));

          await recalculateComandaTotals(
            tx as Awaited<ReturnType<typeof getDb>>,
            input.comandaId,
          );
        });

        return {
          success: true,
          message: "Desconto aplicado à comanda.",
        };
      }),

    fechar: operatorProcedure
      .input(
        z.object({
          comandaId: z.number().int().positive(),
          pagamentos: z.array(pagamentoSchema).min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();

        await db.transaction(async (tx) => {
          const comanda = await tx.query.pdvComandas.findFirst({
            where: eq(pdvComandas.id, input.comandaId),
          });

          if (!comanda) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Comanda não encontrada.",
            });
          }

          if (comanda.status !== "aberta") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A comanda já está fechada ou cancelada.",
            });
          }

          const totalPagamentos = money(
            input.pagamentos.reduce((acc, pagamento) => acc + pagamento.valor, 0),
          );

          if (totalPagamentos < money(comanda.totalFinal)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A soma dos pagamentos deve ser maior ou igual ao total final.",
            });
          }

          await tx
            .delete(pdvPagamentos)
            .where(eq(pdvPagamentos.comandaId, input.comandaId));

          await tx.insert(pdvPagamentos).values(
            input.pagamentos.map((pagamento) => ({
              comandaId: input.comandaId,
              forma: pagamento.forma,
              formaDescricao: textOrNull(pagamento.formaDescricao),
              valor: money(pagamento.valor).toFixed(2),
            })),
          );

          await tx
            .update(pdvComandas)
            .set({
              status: "fechada",
              fechadaEm: new Date(),
            })
            .where(eq(pdvComandas.id, input.comandaId));
        });

        let biSync:
          | Awaited<ReturnType<typeof syncPdvComandaToBI>>
          | { status: "failed"; message: string }
          | null = null;

        try {
          biSync = await syncPdvComandaToBI(input.comandaId);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          biSync = { status: "failed", message: err.message };
          void AuditLogService.recordError({
            module: "pdv",
            source: "backend",
            error: err,
            actor: {
              userId: ctx.user.id,
              ipAddress:
                ctx.req?.ip ||
                (ctx.req?.headers?.["x-forwarded-for"] as string)
                  ?.split(",")[0]
                  ?.trim() ||
                "127.0.0.1",
              userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
              requestId: (ctx.req as any)?.requestId,
            },
            procedure: "admin.pdv.comandas.fechar",
            metadata: {
              comandaId: input.comandaId,
              syncTarget: "bi_facts",
            },
            severity: "critical",
          });
        }

        return {
          success: true,
          message: "Comanda fechada com sucesso.",
          biSync,
        };
      }),
  }),

  syncComandaToBI: adminProcedure
    .input(z.object({ comandaId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const result = await syncPdvComandaToBI(input.comandaId);
      return {
        success: result.status === "synced",
        ...result,
      };
    }),

  relatorios: router({
    resumoDia: operatorProcedure
      .input(z.object({ data: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const data = input.data || todayKey();
        const bounds = dayBounds(data);
        const comandas = await db.query.pdvComandas.findMany({
          where: and(
            eq(pdvComandas.status, "fechada"),
            gte(pdvComandas.fechadaEm, bounds.start),
            lte(pdvComandas.fechadaEm, bounds.end),
          ),
          with: {
            cliente: true,
            pagamentos: true,
          },
          orderBy: [desc(pdvComandas.fechadaEm)],
        });

        let totalCartao = 0;
        let totalPix = 0;
        let totalOutro = 0;

        comandas.forEach((comanda) => {
          comanda.pagamentos.forEach((pagamento) => {
            const value = money(pagamento.valor);
            if (pagamento.forma === "cartao") totalCartao += value;
            if (pagamento.forma === "pix") totalPix += value;
            if (pagamento.forma === "outro") totalOutro += value;
          });
        });

        return {
          data,
          totalCartao: money(totalCartao),
          totalPix: money(totalPix),
          totalOutro: money(totalOutro),
          totalGeral: money(totalCartao + totalPix + totalOutro),
          totalComandas: comandas.length,
          comandas: comandas.map((comanda) => ({
            id: comanda.id,
            clienteNome: comanda.cliente.nome,
            totalFinal: money(comanda.totalFinal),
            desconto: money(comanda.desconto),
            fechadaEm: comanda.fechadaEm,
            pagamentos: comanda.pagamentos.map((pagamento) => ({
              forma: pagamento.forma,
              formaDescricao: pagamento.formaDescricao,
              valor: money(pagamento.valor),
            })),
          })),
        };
      }),

    comandasPorPeriodo: operatorProcedure
      .input(
        z.object({
          dataInicio: z.string(),
          dataFim: z.string(),
        }),
      )
      .query(async ({ input }) => {
        const db = await getDb();
        const start = dayBounds(input.dataInicio).start;
        const end = dayBounds(input.dataFim).end;
        const comandas = await db.query.pdvComandas.findMany({
          where: and(gte(pdvComandas.createdAt, start), lte(pdvComandas.createdAt, end)),
          with: {
            cliente: true,
          },
          orderBy: [desc(pdvComandas.createdAt)],
        });

        return comandas.map((comanda) => ({
          id: comanda.id,
          clienteId: comanda.clienteId,
          clienteNome: comanda.cliente.nome,
          status: comanda.status,
          totalItens: money(comanda.totalItens),
          desconto: money(comanda.desconto),
          totalFinal: money(comanda.totalFinal),
          abertaEm: comanda.abertaEm,
          fechadaEm: comanda.fechadaEm,
          createdAt: comanda.createdAt,
        }));
      }),

    comandasPorCliente: operatorProcedure
      .input(z.object({ clienteId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const comandas = await db.query.pdvComandas.findMany({
          where: eq(pdvComandas.clienteId, input.clienteId),
          with: {
            cliente: true,
            pagamentos: true,
          },
          orderBy: [desc(pdvComandas.createdAt)],
        });

        return comandas.map((comanda) => ({
          id: comanda.id,
          clienteNome: comanda.cliente.nome,
          status: comanda.status,
          totalItens: money(comanda.totalItens),
          desconto: money(comanda.desconto),
          totalFinal: money(comanda.totalFinal),
          abertaEm: comanda.abertaEm,
          fechadaEm: comanda.fechadaEm,
          pagamentos: comanda.pagamentos.map((pagamento) => ({
            forma: pagamento.forma,
            formaDescricao: pagamento.formaDescricao,
            valor: money(pagamento.valor),
          })),
        }));
      }),

    fecharCaixa: operatorProcedure
      .input(
        z.object({
          data: z.string().optional(),
          observacoes: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const data = input.data || todayKey();
        const bounds = dayBounds(data);
        const comandas = await db.query.pdvComandas.findMany({
          where: and(
            eq(pdvComandas.status, "fechada"),
            gte(pdvComandas.fechadaEm, bounds.start),
            lte(pdvComandas.fechadaEm, bounds.end),
          ),
          with: {
            pagamentos: true,
          },
        });

        let totalCartao = 0;
        let totalPix = 0;
        let totalOutro = 0;

        comandas.forEach((comanda) => {
          comanda.pagamentos.forEach((pagamento) => {
            const value = money(pagamento.valor);
            if (pagamento.forma === "cartao") totalCartao += value;
            if (pagamento.forma === "pix") totalPix += value;
            if (pagamento.forma === "outro") totalOutro += value;
          });
        });

        const payload = {
          dataFechamento: data,
          totalCartao: money(totalCartao).toFixed(2),
          totalPix: money(totalPix).toFixed(2),
          totalOutro: money(totalOutro).toFixed(2),
          totalGeral: money(totalCartao + totalPix + totalOutro).toFixed(2),
          totalComandas: comandas.length,
          observacoes: textOrNull(input.observacoes),
          fechadoPor: ctx.user.id,
        } satisfies typeof pdvFechamentos.$inferInsert;

        const existing = await db.query.pdvFechamentos.findFirst({
          where: eq(pdvFechamentos.dataFechamento, data),
        });

        if (existing) {
          await db
            .update(pdvFechamentos)
            .set(payload)
            .where(eq(pdvFechamentos.id, existing.id));
        } else {
          await db.insert(pdvFechamentos).values(payload);
        }

        return {
          success: true,
          data,
          totalCartao: money(totalCartao),
          totalPix: money(totalPix),
          totalOutro: money(totalOutro),
          totalGeral: money(totalCartao + totalPix + totalOutro),
          totalComandas: comandas.length,
          message: "Fechamento do caixa consolidado com sucesso.",
        };
      }),
  }),
});
