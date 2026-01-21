import { z } from "zod";
import { router, publicProcedure } from "../../../_core/trpc.js";
import { eq, and, or, desc } from "drizzle-orm"; 
import { carts } from "../../../../drizzle/schema/index.js"; 
import { getDb } from "../../../db.js";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";

// Sub-roteadores e Lógica Centralizada
import { cartItemsRouter } from "./items.js";
import { cartRewardsRouter } from "./rewards.js";
import { syncCartState } from "./logic.js";

export const cartRouter = router({
  
  // 🔗 Sub-roteadores
  items: cartItemsRouter, // Adicionar/Remover itens
  applyCoupon: cartRewardsRouter.applyCoupon,
  removeCoupon: cartRewardsRouter.removeCoupon,

  /**
   * ✅ ATIVAR/DESATIVAR FIDELIDADE
   * Alterna o uso de pontos e recalcula o total instantaneamente.
   */
  toggleLoyalty: publicProcedure
    .input(z.object({ 
      cartId: z.string().optional(), 
      active: z.boolean() 
    }))
    .mutation(async ({ ctx, input }) => {
      // O DB já vem no contexto agora (graças à mudança no createContext)
      const db = ctx.db; 

      const userId = ctx.user?.id ? String(ctx.user.id) : null;
      const guestId = ctx.guestId;
      
      let targetCartId = input.cartId;

      // Se não veio ID explícito, busca o carrinho ativo do contexto atual
      if (!targetCartId) {
        // Lógica de busca: Se tem User, busca pelo User. Se não, busca pelo Guest.
        const searchCondition = userId 
          ? eq(carts.userId, userId)
          : guestId 
            ? eq(carts.guestId, guestId)
            : null;

        if (!searchCondition) {
             throw new TRPCError({ code: "BAD_REQUEST", message: "Sem identificação de sessão" });
        }

        const [cart] = await db.select().from(carts).where(
          and(
            or(eq(carts.status, "active"), eq(carts.status, "open")),
            searchCondition
          )
        ).orderBy(desc(carts.updatedAt)).limit(1);

        if (!cart) throw new TRPCError({ code: "NOT_FOUND", message: "Carrinho não encontrado" });
        targetCartId = cart.id;
      }

      // Atualiza o flag no banco
      await db.update(carts)
        .set({ 
          usesLoyalty: input.active, // Agora é boolean direto no schema
          updatedAt: new Date() 
        } as any) // Cast 'as any' caso o TS ainda reclame do tipo boolean/tinyint
        .where(eq(carts.id, targetCartId));

      // 🔄 Recalcula totais com a nova flag
      return await syncCartState(db, targetCartId, userId || undefined);
    }),

  /**
   * 🛒 OBTER RESUMO DO CARRINHO (GetSummary)
   * A rota principal que o frontend chama para renderizar a sacola.
   */
  getSummary: publicProcedure
    .query(async ({ ctx }) => {
      const db = ctx.db;
      
      const userId = ctx.user?.id ? String(ctx.user.id) : null;
      // Pegamos o guestId direto do contexto (que veio do header x-guest-id)
      const guestId = ctx.guestId; 

      if (!userId && !guestId) {
        // Se chegou aqui sem nenhum ID, retornamos null (frontend deve gerar ID e tentar de novo)
        return null; 
      }

      // 1. Busca carrinho ativo (Prioridade: Usuário > Visitante)
      const searchCondition = userId 
        ? eq(carts.userId, userId) 
        : eq(carts.guestId, guestId!);

      let [cart] = await db.select().from(carts).where(
        and(
          or(eq(carts.status, "active"), eq(carts.status, "open")),
          searchCondition
        )
      ).orderBy(desc(carts.updatedAt)).limit(1);

      // 2. Se não existir, cria um novo automaticamente
      if (!cart) {
        const newCartId = crypto.randomUUID();
        
        await db.insert(carts).values({
          id: newCartId,
          // Se tiver logado, vincula ao User. Se não, vincula ao GuestId
          userId: userId || null, 
          guestId: userId ? null : guestId, 
          sessionId: guestId, // Mantemos sessionId preenchido para compatibilidade legado
          status: "active",
        } as any);
        
        // Recarrega o carrinho criado
        [cart] = await db.select().from(carts).where(eq(carts.id, newCartId)).limit(1);
      }

      if (!cart) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao inicializar carrinho." });

      // 3. Verifica se precisamos fazer "Merge" (Visitante acabou de logar)
      // Se o carrinho pertence a um Guest, mas agora temos um User logado no contexto, "tomamos posse" dele.
      if (userId && !cart.userId && cart.guestId === guestId) {
         await db.update(carts)
           .set({ userId: userId, guestId: null } as any)
           .where(eq(carts.id, cart.id));
         
         // Atualiza objeto local
         cart.userId = userId;
      }

      // 🔄 Retorna o estado sincronizado e calculado
      const result = await syncCartState(db, cart.id, userId || undefined);

      return {
        ...result,
        cart: cart, 
      };
    }),

  /**
   * 🆔 CRIAR OU RETOMAR CARRINHO (Usado no Login/Merge explícito)
   */
  getOrCreateCart: publicProcedure
    .mutation(async ({ ctx }) => {
      const db = ctx.db;
      const userId = ctx.user?.id ? String(ctx.user.id) : null;
      const guestId = ctx.guestId;

      if (!userId && !guestId) {
         throw new TRPCError({ code: "BAD_REQUEST", message: "Visitante não identificado." });
      }

      const searchCondition = userId 
          ? eq(carts.userId, userId)
          : eq(carts.guestId, guestId!);

      let [cart] = await db.select().from(carts).where(
        and(
          eq(carts.status, "active"),
          searchCondition
        )
      ).orderBy(desc(carts.updatedAt)).limit(1);

      if (!cart) {
        const newCartId = crypto.randomUUID();
        await db.insert(carts).values({
          id: newCartId,
          userId: userId || null,
          guestId: userId ? null : guestId,
          sessionId: guestId,
          status: "active",
        } as any);
        return { cartId: newCartId };
      }

      // Merge automático se necessário
      if (userId && !cart.userId) {
        await db.update(carts)
          .set({ userId: userId, guestId: null, updatedAt: new Date() } as any)
          .where(eq(carts.id, cart.id));
      }

      return { cartId: cart.id };
    }),
});