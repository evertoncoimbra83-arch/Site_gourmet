import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../../_core/trpc.js";
import { decrypt, encrypt } from "../../encryption.js";
import { getDb } from "../../db.js";
import { eq, and, sql, desc } from "drizzle-orm";
import { userAddresses, storeSettings } from "../../../drizzle/schema/index.js";
import { generateIdFromEntropySize } from "lucia";
import axios from "axios";
import { logAction } from "../../db/lib/audit.js";

// --- SCHEMAS DE VALIDAÇÃO ---
const AddressInput = z.object({
  label: z.string().optional().nullable(),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().min(1, "CEP é obrigatório"),
  phone: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
});

// --- HELPERS DE CRIPTOGRAFIA ---
function safeDecrypt(val: any): string {
  if (!val) return "";
  try {
    const str = String(val);
    // Verifica se parece uma string criptografada (formato iv:authTag:content)
    if (str.split(':').length !== 3) return str;
    return decrypt(str) || str;
  } catch { return String(val); }
}

function toFront(addr: any) {
  if (!addr) return null;
  return {
    ...addr,
    id: String(addr.id), 
    label: safeDecrypt(addr.label) || "Endereço",
    street: safeDecrypt(addr.street),
    number: safeDecrypt(addr.number) || "S/N",
    complement: safeDecrypt(addr.complement) || "",
    neighborhood: safeDecrypt(addr.neighborhood) || "",
    city: safeDecrypt(addr.city) || "",
    state: safeDecrypt(addr.state) || "",
    zipCode: safeDecrypt(addr.zipCode),
    phone: safeDecrypt(addr.phone) || "",
    isDefault: !!addr.isDefault,
  };
}

export const addressesRouter = router({
  
  /**
   * ✅ RESOLUÇÃO DO ERRO: "addresses.getStoreSettings"
   */
  getStoreSettings: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      const settings = await db.select().from(storeSettings).limit(1);
      
      // Se a tabela existir mas estiver vazia, retornamos um objeto padrão
      // para evitar que o frontend quebre tentando ler propriedades de null
      if (!settings || settings.length === 0) {
        return {
          id: "default",
          generalMinOrderAmount: "0.00",
          emergencyMode: false,
          minOrderMessage: "Valor mínimo não atingido"
        };
      }
      return settings[0];
    } catch (error) {
      console.error("🚨 [DB ERROR] Erro ao buscar storeSettings:", error);
      // Retorno de fallback para o front não travar
      return { id: "error", generalMinOrderAmount: "0.00", emergencyMode: false };
    }
  }),

  /**
   * ⚙️ CONFIGURAÇÕES DE ENTREGA
   */
  getSettings: publicProcedure.query(async () => {
    const db = await getDb();
    try {
      const [settings] = await db.select().from(storeSettings).limit(1);
      
      return {
        minOrderValue: Number(settings?.generalMinOrderAmount || 0),
        isDeliveryEnabled: !settings?.emergencyMode,
        deliveryFee: 0, 
        baseFee: 0,
        minOrderMessage: settings?.minOrderMessage || "Valor mínimo não atingido",
      };
    } catch {
      return { minOrderValue: 0, isDeliveryEnabled: true, deliveryFee: 0, baseFee: 0, minOrderMessage: "" };
    }
  }),

  /**
   * 🔍 BUSCA CEP EXTERNA (ViaCEP)
   */
  getCep: publicProcedure
    .input(z.object({ cep: z.string() }))
    .query(async ({ input }) => {
      const cleanCep = input.cep.replace(/\D/g, "");
      if (cleanCep.length !== 8) return null;
      try {
        const { data } = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`, { timeout: 5000 });
        if (data.erro) return null;
        return {
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        };
      } catch { return null; }
    }),

  /**
   * 🏁 VALIDAÇÃO DE ZONA DE ENTREGA
   */
  validateZipZone: publicProcedure
    .input(z.object({ zipCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const cleanZip = input.zipCode.replace(/\D/g, "");

      try {
        const [rows]: any = await db.execute(sql`
          SELECT id, name, price AS shippingCost
          FROM shipping_rules
          WHERE active = 1
            AND CAST(cep_start AS UNSIGNED) <= CAST(${cleanZip} AS UNSIGNED)
            AND CAST(cep_end AS UNSIGNED) >= CAST(${cleanZip} AS UNSIGNED)
          LIMIT 1
        `);

        const rule = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        if (!rule) return { isValid: false, shippingCost: 0 };

        return {
          isValid: true,
          zoneId: String(rule.id),
          zoneName: rule.name,
          shippingCost: Number(rule.shippingCost ?? 0),
        };
      } catch {
        return { isValid: false, shippingCost: 0, error: "Tabela shipping_rules não encontrada" };
      }
    }),

  /**
   * 📋 LISTAR ENDEREÇOS
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const rows = await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, ctx.user.id))
      .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt));

    return rows.map(toFront);
  }),

  /**
   * ➕ CRIAR ENDEREÇO
   */
  create: protectedProcedure
    .input(AddressInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id; 

      if (input.isDefault) {
        await db.update(userAddresses)
          .set({ isDefault: false })
          .where(eq(userAddresses.userId, userId));
      }

      const id = generateIdFromEntropySize(15);
      await db.insert(userAddresses).values({
        id,
        userId,
        label: encrypt(input.label || "Endereço"),
        street: encrypt(input.street),
        number: encrypt(input.number || "S/N"),
        complement: encrypt(input.complement || ""),
        neighborhood: encrypt(input.neighborhood || ""),
        city: encrypt(input.city || ""),
        state: encrypt(input.state || ""),
        zipCode: encrypt(input.zipCode),
        phone: encrypt(input.phone || ""),
        isDefault: !!input.isDefault,
      });
      
      logAction(ctx, "CREATE_ADDRESS", "user_addresses", {
        entityId: id,
        new: { label: input.label, zip: input.zipCode }
      }).catch(() => {});
      
      return { success: true, id };
    }),

  /**
   * 🗑️ EXCLUIR ENDEREÇO
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      const [addr] = await db.select().from(userAddresses)
        .where(and(eq(userAddresses.id, input.id), eq(userAddresses.userId, ctx.user.id)));
      
      if (!addr) throw new TRPCError({ code: "NOT_FOUND" });

      await db.delete(userAddresses)
        .where(and(eq(userAddresses.id, input.id), eq(userAddresses.userId, ctx.user.id)));
      
      logAction(ctx, "DELETE_ADDRESS", "user_addresses", {
        entityId: input.id,
        old: { label: safeDecrypt(addr.label) }
      }).catch(() => {});
      
      return { success: true };
    }),
});