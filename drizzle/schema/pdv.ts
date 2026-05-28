import { relations } from "drizzle-orm";
import {
  date,
  datetime,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

import { dishes } from "./catalog";

export const pdvClienteTipoEnum = mysqlEnum("tipo", ["cpf", "cnpj"]);
export const pdvComandaStatusEnum = mysqlEnum("status", [
  "aberta",
  "fechada",
  "cancelada",
]);
export const pdvPagamentoFormaEnum = mysqlEnum("forma", [
  "cartao",
  "pix",
  "outro",
]);

export const pdvClientes = mysqlTable("pdv_clientes", {
  id: int("id").primaryKey().autoincrement(),
  tipo: pdvClienteTipoEnum.notNull(),
  documento: varchar("documento", { length: 20 }).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 30 }),
  empresa: varchar("empresa", { length: 255 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const pdvComandas = mysqlTable("pdv_comandas", {
  id: int("id").primaryKey().autoincrement(),
  clienteId: int("cliente_id")
    .notNull()
    .references(() => pdvClientes.id, { onDelete: "restrict" }),
  status: pdvComandaStatusEnum.default("aberta").notNull(),
  observacoes: text("observacoes"),
  desconto: decimal("desconto", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  totalItens: decimal("total_itens", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  totalFinal: decimal("total_final", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  abertaEm: datetime("aberta_em", { mode: "date", fsp: 3 }).notNull(),
  fechadaEm: datetime("fechada_em", { mode: "date", fsp: 3 }),
  createdBy: varchar("created_by", { length: 191 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const pdvComandaItens = mysqlTable("pdv_comanda_itens", {
  id: int("id").primaryKey().autoincrement(),
  comandaId: int("comanda_id")
    .notNull()
    .references(() => pdvComandas.id, { onDelete: "cascade" }),
  dishId: int("dish_id").references(() => dishes.id, { onDelete: "set null" }),
  nome: varchar("nome", { length: 255 }).notNull(),
  precoUnit: decimal("preco_unit", { precision: 10, scale: 2 }).notNull(),
  quantidade: int("quantidade").default(1).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  observacao: text("observacao"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pdvPagamentos = mysqlTable("pdv_pagamentos", {
  id: int("id").primaryKey().autoincrement(),
  comandaId: int("comanda_id")
    .notNull()
    .references(() => pdvComandas.id, { onDelete: "cascade" }),
  forma: pdvPagamentoFormaEnum.notNull(),
  formaDescricao: varchar("forma_descricao", { length: 255 }),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pdvFechamentos = mysqlTable(
  "pdv_fechamentos",
  {
    id: int("id").primaryKey().autoincrement(),
    dataFechamento: date("data_fechamento", { mode: "string" }).notNull(),
    totalCartao: decimal("total_cartao", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    totalPix: decimal("total_pix", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    totalOutro: decimal("total_outro", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    totalGeral: decimal("total_geral", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    totalComandas: int("total_comandas").default(0).notNull(),
    observacoes: text("observacoes"),
    fechadoPor: varchar("fechado_por", { length: 191 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    dataFechamentoUnique: unique("pdv_fechamentos_data_fechamento_unique").on(
      table.dataFechamento,
    ),
  }),
);

export const pdvClientesRelations = relations(pdvClientes, ({ many }) => ({
  comandas: many(pdvComandas),
}));

export const pdvComandasRelations = relations(pdvComandas, ({ one, many }) => ({
  cliente: one(pdvClientes, {
    fields: [pdvComandas.clienteId],
    references: [pdvClientes.id],
  }),
  itens: many(pdvComandaItens),
  pagamentos: many(pdvPagamentos),
}));

export const pdvComandaItensRelations = relations(
  pdvComandaItens,
  ({ one }) => ({
    comanda: one(pdvComandas, {
      fields: [pdvComandaItens.comandaId],
      references: [pdvComandas.id],
    }),
    dish: one(dishes, {
      fields: [pdvComandaItens.dishId],
      references: [dishes.id],
    }),
  }),
);

export const pdvPagamentosRelations = relations(pdvPagamentos, ({ one }) => ({
  comanda: one(pdvComandas, {
    fields: [pdvPagamentos.comandaId],
    references: [pdvComandas.id],
  }),
}));
