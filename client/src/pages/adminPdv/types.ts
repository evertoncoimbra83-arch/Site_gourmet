import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "../../../../server/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type AdminOutputs = RouterOutputs["admin"];
type PdvOutputs = AdminOutputs["pdv"];

export type PdvClienteBusca = PdvOutputs["clientes"]["buscar"][number];
export type PdvComandaAberta = PdvOutputs["comandas"]["listarAbertas"][number];
export type PdvComandaDetalhe = PdvOutputs["comandas"]["getById"];
export type PdvResumoDia = PdvOutputs["relatorios"]["resumoDia"];
export type PdvComandaPeriodo = PdvOutputs["relatorios"]["comandasPorPeriodo"][number];
export type PdvComandaCliente = PdvOutputs["relatorios"]["comandasPorCliente"][number];
export type AdminDishListItem = AdminOutputs["dishes"]["list"]["data"][number];
