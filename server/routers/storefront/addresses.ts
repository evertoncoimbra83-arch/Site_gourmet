import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { generateIdFromEntropySize } from "lucia";
import {
  shippingSettings,
  storeSettings,
  userAddresses,
} from "../../../drizzle/schema/index.js";
import { router, publicProcedure, protectedProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { logAction } from "../../db/lib/audit.js";
import { decrypt, encrypt, normalizeDigits } from "../../encryption.js";
import { globalShippingValidator } from "../../services/shippingService.js";

type AddressSchema = typeof userAddresses.$inferSelect;

const addressIdSchema = z.string().min(1);

const addressInputSchema = z.object({
  label: z.string().trim().optional().nullable(),
  street: z.string().trim().min(1, "Rua é obrigatória."),
  number: z.string().trim().min(1, "Número é obrigatório."),
  complement: z.string().trim().optional().nullable(),
  neighborhood: z.string().trim().min(1, "Bairro é obrigatório."),
  city: z.string().trim().min(1, "Cidade é obrigatória."),
  state: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => /^[A-Z]{2}$/.test(value), "UF inválida."),
  zipCode: z
    .string()
    .transform((value) => normalizeDigits(value))
    .refine((value) => value.length === 8, "CEP inválido."),
  phone: z
    .string()
    .transform((value) => normalizeDigits(value))
    .refine(
      (value) => value.length === 0 || value.length === 10 || value.length === 11,
      "Telefone inválido.",
    )
    .optional()
    .nullable(),
  isDefault: z.boolean().optional(),
});

function safeDecrypt(value: unknown): string {
  if (value == null) return "";
  try {
    const raw = value instanceof Buffer ? value.toString("utf8") : String(value);
    if (raw.split(":").length !== 3) return raw;
    return decrypt(raw) || raw;
  } catch {
    return String(value);
  }
}

function toFront(addr: AddressSchema) {
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

function buildInsertValues(
  userId: string,
  input: z.infer<typeof addressInputSchema>,
  id: string,
) {
  return {
    id,
    userId,
    label: encrypt(input.label || "Endereço"),
    street: encrypt(input.street),
    number: encrypt(input.number),
    complement: encrypt(input.complement || ""),
    neighborhood: encrypt(input.neighborhood),
    city: encrypt(input.city),
    state: encrypt(input.state),
    zipCode: encrypt(input.zipCode),
    phone: encrypt(input.phone || ""),
    isDefault: !!input.isDefault,
  } satisfies typeof userAddresses.$inferInsert;
}

export const addressesRouter = router({
  validateZipZone: publicProcedure
    .input(
      z.object({
        zipCode: z.string().optional().nullable(),
        addressId: addressIdSchema.optional().nullable(),
        storeSlug: z.string().optional().default("jundiai"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      let zipToValidate = normalizeDigits(input.zipCode || "");

      if (input.addressId && input.addressId !== "undefined") {
        const currentUserId = ctx.user?.id ? String(ctx.user.id) : null;

        if (currentUserId) {
          const [addr] = await db
            .select({ zipCode: userAddresses.zipCode })
            .from(userAddresses)
            .where(
              and(
                eq(userAddresses.id, input.addressId),
                eq(userAddresses.userId, currentUserId),
              ),
            )
            .limit(1);

          if (!addr) {
            return {
              isValid: false,
              message: "Endereço inválido ou não autorizado.",
            };
          }

          zipToValidate = normalizeDigits(safeDecrypt(addr.zipCode));
        }
      }

      if (zipToValidate.length !== 8) {
        return { isValid: false, message: "CEP inválido ou não informado." };
      }

      return globalShippingValidator(zipToValidate, input.storeSlug);
    }),

  create: protectedProcedure
    .input(addressInputSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      if (input.isDefault) {
        await db
          .update(userAddresses)
          .set({ isDefault: false })
          .where(eq(userAddresses.userId, userId));
      }

      const id = generateIdFromEntropySize(15);
      const insertValues = buildInsertValues(userId, input, id);

      await db.insert(userAddresses).values(insertValues);

      void logAction(
        { ...ctx, user: { id: userId } },
        "CREATE_ADDRESS",
        "user_addresses",
        { entityId: id },
      );

      return { success: true, id };
    }),

  update: protectedProcedure
    .input(addressInputSchema.partial().extend({ id: addressIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;
      const { id, ...rawData } = input;

      const [existing] = await db
        .select()
        .from(userAddresses)
        .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
        .limit(1);

      if (!existing) {
        throw new Error("Endereço não encontrado.");
      }

      if (rawData.isDefault) {
        await db
          .update(userAddresses)
          .set({ isDefault: false })
          .where(eq(userAddresses.userId, userId));
      }

      const data = rawData;

      await db
        .update(userAddresses)
        .set({
          label:
            data.label !== undefined
              ? encrypt(data.label || "Endereço")
              : existing.label,
          street:
            data.street !== undefined ? encrypt(data.street) : existing.street,
          number:
            data.number !== undefined ? encrypt(data.number) : existing.number,
          complement:
            data.complement !== undefined
              ? encrypt(data.complement || "")
              : existing.complement,
          neighborhood:
            data.neighborhood !== undefined
              ? encrypt(data.neighborhood)
              : existing.neighborhood,
          city: data.city !== undefined ? encrypt(data.city) : existing.city,
          state:
            data.state !== undefined ? encrypt(data.state) : existing.state,
          zipCode:
            data.zipCode !== undefined
              ? encrypt(data.zipCode)
              : existing.zipCode,
          phone:
            data.phone !== undefined ? encrypt(data.phone || "") : existing.phone,
          isDefault:
            data.isDefault !== undefined
              ? !!data.isDefault
              : !!existing.isDefault,
        })
        .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));

      void logAction(
        { ...ctx, user: { id: userId } },
        "UPDATE_ADDRESS",
        "user_addresses",
        { entityId: id },
      );

      return { success: true };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const rows = await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, ctx.user.id))
      .orderBy(desc(userAddresses.isDefault));

    return rows.map(toFront);
  }),

  getStoreSettings: publicProcedure.query(async () => {
    const db = await getDb();
    const [store] = await db.select().from(storeSettings).limit(1);
    const [shipping] = await db.select().from(shippingSettings).limit(1);

    return {
      generalMinOrderAmount: store?.generalMinOrderAmount || "0.00",
      pickupEnabled: !!shipping?.pickupEnabled,
      pickupLabel: shipping?.pickupLabel || "Retirada Gourmet Saudável",
      pickupInstruction:
        shipping?.pickupInstruction || "Segunda a Sexta, das 09h às 18h.",
      minOrderMessage:
        store?.minOrderMessage ||
        "O valor mínimo para entrega não foi atingido.",
    };
  }),

  delete: protectedProcedure
    .input(z.object({ id: addressIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      await db
        .delete(userAddresses)
        .where(
          and(
            eq(userAddresses.id, input.id),
            eq(userAddresses.userId, ctx.user.id),
          ),
        );

      return { success: true };
    }),
});
