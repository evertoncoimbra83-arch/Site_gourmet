import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { 
  authUsers, 
  userAddresses, 
  users, 
  orders, 
  orderItems, 
  dishes, 
  loyaltyHistory,
  couponUsage
} from "../../../drizzle/schema/index.js"; 
import { randomBytes, createHash, createCipheriv, scryptSync } from "crypto";
import { sql, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// --- CONFIGURAÇÕES E SEGURANÇA ---
const MIGRATED_PASSWORD_HASH = "$2b$10$7zB3/Vl.P9WcE4Xw2hA8UeK9j8Z5zG5mK9H8F7E6D5C4B3A21.mig";
const ENCRYPTION_KEY_RAW = process.env.DB_ENCRYPTION_KEY || "dev-secret-key-pode-ser-curta";
const PII_PEPPER = process.env.PII_PEPPER || "";
const ALGORITHM = "aes-256-gcm";

function getDerivedKey(): Buffer {
  return scryptSync(ENCRYPTION_KEY_RAW, "static-salt", 32);
}

function encryptManual(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    const key = getDerivedKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (e) { return null; }
}

function generatePiiHash(text: string | null | undefined) {
  if (!text) return null;
  const clean = String(text).replace(/\D/g, "");
  return createHash("sha256").update(`${PII_PEPPER}:${clean}`).digest("hex");
}

function generateCuidLike() {
  return randomBytes(12).toString('hex'); 
}

export const migrationRouter = router({

  /**
   * 🧹 LIMPEZA DE PEDIDOS (Executar antes de re-importar)
   */
  clearOrders: adminProcedure.mutation(async () => {
    const db = await getDb();
    await db.transaction(async (tx) => {
      await tx.delete(orderItems); 
      await tx.delete(loyaltyHistory).where(sql`order_id IS NOT NULL`);
      await tx.delete(couponUsage);
      await tx.delete(orders);
    });
    return { success: true };
  }),

  /**
   * 📦 FASE 3: IMPORTAÇÃO DE PEDIDOS
   * Suporta: Criação de User, Endereço em Bloco e Acompanhamentos com Labels.
   */
  importOrders: adminProcedure
    .input(z.object({ data: z.array(z.any()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const allUsers = await db.select().from(users);
      const dbDishes = await db.select().from(dishes);
      
      let imported = 0;
      const dishMap = new Map(dbDishes.map(d => [d.name.toLowerCase(), d.id]));

      for (const order of input.data) {
        try {
          const rawEmail = (order.user_email || "").toLowerCase().trim();
          const orderNumber = String(order.order_number);
          
          // 1. TENTA LOCALIZAR OU CRIAR UTILIZADOR (SHADOW USER)
          let linkedUserId: string;
          const foundUser = allUsers.find(u => u.email.toLowerCase().trim() === rawEmail);

          if (foundUser) {
            linkedUserId = foundUser.id;
          } else {
            linkedUserId = generateCuidLike();
            const rawPhone = String(order.billing_phone || "").replace(/\D/g, "");
            const fallbackEmail = rawEmail || `cliente-${orderNumber}@importado.com`;

            await db.insert(users).values({
              id: linkedUserId,
              email: fallbackEmail,
              name: encryptManual(order.billing_full_name || "Cliente WordPress"),
              phone: encryptManual(rawPhone),
              phoneHash: generatePiiHash(rawPhone),
              role: "user",
              createdAt: new Date(),
            } as any);

            allUsers.push({ id: linkedUserId, email: fallbackEmail } as any);
          }

          // 2. PARSER DE ENDEREÇO INTELIGENTE
          let street = order.billing_address_1 || "";
          let number = "S/N";
          let complement = order.billing_address_2 || order.billing_address_2 || "";
          let neighborhood = order.shipping_neighborhood || "";
          let city = order.billing_city || "Jundiaí";

          const rawBlock = order["Endereço Completo (Envio)"];
          if (rawBlock && typeof rawBlock === 'string') {
            const lines = rawBlock.split('\n').map(l => l.trim());
            // Linha 0: Nome, Linha 1: Rua, Número
            const streetLine = lines[1] || "";
            if (streetLine.includes(',')) {
              const parts = streetLine.split(',');
              street = parts[0].trim();
              number = parts[1].trim();
            } else {
              street = streetLine;
            }
            complement = lines[2] || "";
            neighborhood = lines[3] || "";
            city = lines[4] || city;
          }

          const gsOrderId = `GS-WP-${orderNumber}`;
          const sub = parseFloat(order.order_subtotal) || 0;
          const tot = parseFloat(order.order_total) || 0;
          const dateParts = order.order_date.split('/');
          const orderDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T12:00:00Z`);

          // 3. INSERIR PEDIDO
          await db.insert(orders).values({
            id: gsOrderId,
            userId: linkedUserId,
            status: 'completed',
            subtotal: sub.toFixed(2),
            total: tot.toFixed(2),
            totalDiscount: Math.max(0, sub - tot).toFixed(2),
            customerName: order.billing_full_name || "Cliente WP",
            customerPhone: order.billing_phone,
            shippingAddress: encryptManual(street),
            shippingAddressNumber: encryptManual(number),
            shippingAddressComplement: encryptManual(complement),
            shippingNeighborhood: encryptManual(neighborhood),
            shippingCity: encryptManual(city),
            paymentMethod: order["Forma de Pagamento"] || 'legacy_import',
            createdAt: orderDate,
          } as any).onDuplicateKeyUpdate({ set: { status: 'completed' } });

          // 4. PROCESSAR PRODUTOS E LABELS DE ACOMPANHAMENTO
          if (order.products) {
            for (const prod of order.products) {
              const cleanName = prod.name.split(" | ")[0].trim();
              const matchedDishId = dishMap.get(cleanName.toLowerCase()) || null;

              const accs: any[] = [];
              const labelsMapping = [
                { key: "Acompanhamento 120g", label: "120g" },
                { key: "Acompanhamento 100g", label: "100g" },
                { key: "Acompanhamento 80g", label: "80g" },
                { key: "Tipo", label: "Tipo" },
                { key: "Acompanhamento", label: "Extra" }
              ];

              labelsMapping.forEach(item => {
                const val = prod[item.key];
                if (val && val !== false && val !== "" && val !== "false") {
                  accs.push({ 
                    name: val, 
                    groupName: item.label 
                  });
                }
              });

              await db.insert(orderItems).values({
                id: generateCuidLike(),
                orderId: gsOrderId,
                dishId: matchedDishId,
                dishName: cleanName,
                quantity: parseInt(prod.qty || 1),
                unitPrice: parseFloat(prod.item_price || 0).toFixed(2),
                totalPrice: parseFloat(prod.price || 0).toFixed(2),
                accompaniments: JSON.stringify(accs)
              } as any);
            }
          }
          imported++;
        } catch (err) {
          console.error(`Erro no pedido ${order.order_number}:`, err);
        }
      }
      return { success: true, imported };
    }),

  /**
   * 👤 FASE 1: IMPORTAÇÃO DE CLIENTES (Via JSON de utilizadores)
   */
  importClients: adminProcedure
    .input(z.object({ data: z.array(z.any()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      let imported = 0;
      let skipped = 0;

      for (const client of input.data) {
        try {
          await db.transaction(async (tx) => {
            const email = client.email.toLowerCase().trim();
            const newUserId = generateCuidLike();
            const rawPhone = String(client.contact?.phone || "").replace(/\D/g, "");

            await tx.insert(users).values({
              id: newUserId,
              email,
              name: encryptManual(client.name || "Cliente WordPress"),
              phone: encryptManual(rawPhone),
              phoneHash: generatePiiHash(rawPhone),
              role: "user",
              createdAt: new Date(client.registered),
            } as any);

            await tx.insert(authUsers).values({
              id: newUserId,
              email,
              password: MIGRATED_PASSWORD_HASH,
              role: 'user',
              userIdLegacy: newUserId 
            });
          });
          imported++;
        } catch (err: any) {
          skipped++;
        }
      }
      return { success: true, imported, skipped };
    }),

  /**
   * 💎 FASE 4: FIDELIDADE (Cruzamento CSV + JSON)
   */
  importLoyalty: adminProcedure
    .input(z.object({ 
      logs: z.array(z.any()), 
      userMap: z.array(z.object({ old_id: z.number(), email: z.string() })) 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const allUsers = await db.select().from(users);
      let imported = 0;

      const emailToId = new Map(allUsers.map(u => [u.email.toLowerCase().trim(), u.id]));
      const oldIdToEmail = new Map(input.userMap.map(m => [Number(m.old_id), m.email.toLowerCase().trim()]));

      for (const log of input.logs) {
        try {
          const email = oldIdToEmail.get(Number(log.user_id));
          const userId = email ? emailToId.get(email) : null;

          if (userId) {
            const amount = parseInt(log.amount);
            if (isNaN(amount) || amount === 0) continue;

            const dateStr = log.date_earning ? log.date_earning.replace(' ', 'T') : new Date().toISOString();

            await db.insert(loyaltyHistory).values({
              id: generateCuidLike(),
              userId,
              pointsChange: amount,
              type: amount > 0 ? 'earned' : 'used',
              reason: log.description || `Migração YITH`,
              createdAt: new Date(dateStr),
            } as any);
            imported++;
          }
        } catch (err) {}
      }
      return { success: true, imported };
    }),
});