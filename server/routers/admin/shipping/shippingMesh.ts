import { z } from "zod";
import { and, eq, inArray, like, sql } from "drizzle-orm";
import { geoMesh, shippingZones, appConfigs } from "../../../../drizzle/schema/index.js";
import { router, superAdminProcedure } from "../../../_core/trpc.js";
import { getDb } from "../../../db.js";
import { decrypt, encrypt } from "../../../encryption.js";
import { safeJsonParse } from "../../../lib/safe-parse.js";
import { logger } from "../../../logger.js";

interface GeoCoords {
  lat: number;
  lng: number;
}

interface BaseCepRecord {
  cep: string;
  lat: string | number | null;
  lng: string | number | null;
  cidade: string;
  bairro?: string | null;
}

interface MeshInsertRecord {
  zipCode: string;
  city: string;
  neighborhood: string;
  lat: string;
  lng: string;
  price: string;
  storeSlug: string;
  lastSeen: Date;
}

interface StoreAddressConfig {
  companyName?: unknown;
  address?: unknown;
  lat?: unknown;
  lng?: unknown;
  allowedCities?: unknown;
  minOrderValue?: unknown;
  minOrderMessage?: unknown;
}

interface StorePickupConfig {
  pickupEnabled?: unknown;
  pickupLabel?: unknown;
  pickupInstruction?: unknown;
}

function calculateDistance(p1: GeoCoords, p2: GeoCoords): number {
  const r = 6371e3;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * Math.PI / 180) *
      Math.cos(p2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return r * c;
}

function isPointInPolygon(point: GeoCoords, polygon: GeoCoords[]): boolean {
  let inside = false;
  const { lat, lng } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = Number(polygon[i]?.lat);
    const yi = Number(polygon[i]?.lng);
    const xj = Number(polygon[j]?.lat);
    const yj = Number(polygon[j]?.lng);
    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function toSafeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toSafeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toSafeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

async function processCityScan(storeSlug: string, cidade: string) {
  const db = await getDb();
  const resultBase = await db.execute(
    sql`SELECT * FROM base_ceps WHERE cidade = ${cidade}`,
  );
  const rawRows = (resultBase[0] || resultBase) as unknown as BaseCepRecord[];
  const cepsDaCidade = Array.isArray(rawRows) ? rawRows : [];

  if (cepsDaCidade.length === 0) {
    return { totalLidos: 0, totalNaMalha: 0 };
  }

  const rules = await db
    .select()
    .from(shippingZones)
    .where(
      and(
        eq(shippingZones.storeSlug, storeSlug),
        eq(shippingZones.isActive, true),
      ),
    );

  const cepsParaInserir: MeshInsertRecord[] = [];

  for (const item of cepsDaCidade) {
    const latNum = Number(item.lat);
    const lngNum = Number(item.lng);

    if (
      isNaN(latNum) ||
      isNaN(lngNum) ||
      item.lat === null ||
      item.lng === null ||
      latNum === 0 ||
      lngNum === 0
    ) {
      continue;
    }

    const point = { lat: latNum, lng: lngNum };

    for (const rule of rules) {
      if (!rule.polygonCoords) continue;

      const geoData = safeJsonParse<
        GeoCoords[] | { center?: GeoCoords; radius?: number }
      >(rule.polygonCoords, []);

      let isInside = false;

      if (rule.type === "circle" && !Array.isArray(geoData) && geoData.center) {
        isInside =
          calculateDistance(point, geoData.center) <= Number(geoData.radius);
      } else if (rule.type === "polygon" && Array.isArray(geoData)) {
        isInside = isPointInPolygon(point, geoData);
      }

      if (!isInside) continue;

      cepsParaInserir.push({
        zipCode: String(item.cep).replace(/\D/g, ""),
        city: item.cidade,
        neighborhood: item.bairro || "Nao Informado",
        lat: String(item.lat),
        lng: String(item.lng),
        price: String(rule.shippingCost || 0),
        storeSlug,
        lastSeen: new Date(),
      });
      break;
    }
  }

  await db.transaction(async (tx) => {
    await tx.execute(
      sql`DELETE FROM geo_mesh WHERE store_slug = ${storeSlug} AND cidade = ${cidade}`,
    );

    if (cepsParaInserir.length > 0) {
      const chunkSize = 500;

      for (let i = 0; i < cepsParaInserir.length; i += chunkSize) {
        await tx.insert(geoMesh).values(cepsParaInserir.slice(i, i + chunkSize));
      }
    }
  });

  return {
    totalLidos: cepsDaCidade.length,
    totalNaMalha: cepsParaInserir.length,
  };
}

export const shippingMeshRouter = router({
  bindOperativeCity: superAdminProcedure
    .input(
      z.object({
        rows: z.array(
          z.object({
            cep: z.string(),
            cidade: z.string(),
            bairro: z.string().optional(),
            lat: z.string().or(z.number()),
            lng: z.string().or(z.number()),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      let count = 0;

      await db.transaction(async (tx) => {
        for (const item of input.rows) {
          const cleanLat = parseFloat(String(item.lat)).toFixed(6);
          const cleanLng = parseFloat(String(item.lng)).toFixed(6);

          if (isNaN(Number(cleanLat)) || isNaN(Number(cleanLng))) continue;

          await tx.execute(sql`
            INSERT INTO base_ceps (cep, cidade, bairro, lat, lng)
            VALUES (${item.cep.replace(/\D/g, "")}, ${item.cidade}, ${item.bairro || "Centro"}, ${cleanLat}, ${cleanLng})
            ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng)
          `);
          count++;
        }
      });

      return { success: true, count };
    }),

  deleteImportedCity: superAdminProcedure
    .input(z.object({ cidade: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.execute(sql`DELETE FROM base_ceps WHERE cidade = ${input.cidade}`);
      await db.execute(sql`DELETE FROM geo_mesh WHERE cidade = ${input.cidade}`);
      return { success: true };
    }),

  getImportedCities: superAdminProcedure.query(async () => {
    const db = await getDb();
    const resultCities = await db.execute(
      sql`SELECT DISTINCT cidade FROM base_ceps ORDER BY cidade ASC`,
    );
    const rows = Array.isArray(resultCities[0])
      ? (resultCities[0] as { cidade: string }[])
      : [];

    return rows.map((row) => row.cidade);
  }),

  syncMeshWithRules: superAdminProcedure.mutation(async () => {
    const db = await getDb();
    const storeConfigs = await db
      .select()
      .from(appConfigs)
      .where(like(appConfigs.configKey, "store_address_%"));
    let total = 0;

    const resultCities = await db.execute(sql`SELECT DISTINCT cidade FROM base_ceps`);
    const cepsCities = Array.isArray(resultCities[0])
      ? (resultCities[0] as { cidade: string }[])
      : [];

    const perStoreResults = await Promise.all(
      storeConfigs.map(async (config) => {
        try {
          const slug = config.configKey.replace("store_address_", "");
          const cityResults = await Promise.all(
            cepsCities.map((row) => processCityScan(slug, row.cidade)),
          );

          return cityResults.reduce(
            (sum, res) => sum + res.totalNaMalha,
            0,
          );
        } catch (err) {
          logger.error({ err }, "Erro ao sincronizar unidade de malha logistica");
          return 0;
        }
      }),
    );

    total = perStoreResults.reduce((sum, value) => sum + value, 0);

    return { insertedCount: total };
  }),

  listStores: superAdminProcedure.query(async () => {
    const db = await getDb();
    const configs = await db
      .select()
      .from(appConfigs)
      .where(like(appConfigs.configKey, "store_address_%"));

    return configs
      .map((config) => {
        try {
          const slug = config.configKey.replace("store_address_", "");
          const decrypted = decrypt(config.configValue || "") as string;
          const parsed = safeJsonParse<Record<string, unknown>>(decrypted, {});

          return {
            slug,
            name: toSafeString(parsed.companyName, slug.toUpperCase()),
          };
        } catch {
          return null;
        }
      })
      .filter(
        (store): store is NonNullable<typeof store> => store !== null,
      );
  }),

  getStoreBase: superAdminProcedure
    .input(z.object({ storeSlug: z.string().default("default") }))
    .query(async ({ input }) => {
      const db = await getDb();
      const configs = await db
        .select()
        .from(appConfigs)
        .where(
          inArray(appConfigs.configKey, [
            `store_address_${input.storeSlug}`,
            `store_pickup_${input.storeSlug}`,
          ]),
        );

      const result = {
        companyName: "",
        address: "",
        lat: 0,
        lng: 0,
        allowedCities: [] as string[],
        pickupEnabled: false,
        pickupLabel: "",
        pickupInstruction: "",
        minOrderValue: 0,
        minOrderMessage: "",
      };

      for (const config of configs) {
        try {
          const decrypted = decrypt(config.configValue || "") as string;

          if (config.configKey.includes("address")) {
            const parsed = safeJsonParse<StoreAddressConfig>(decrypted, {});
            result.companyName = toSafeString(parsed.companyName);
            result.address = toSafeString(parsed.address);
            result.lat = toSafeNumber(parsed.lat);
            result.lng = toSafeNumber(parsed.lng);
            result.allowedCities = Array.isArray(parsed.allowedCities)
              ? parsed.allowedCities.filter(
                  (city): city is string => typeof city === "string",
                )
              : [];
            result.minOrderValue = toSafeNumber(parsed.minOrderValue);
            result.minOrderMessage = toSafeString(parsed.minOrderMessage);
          } else {
            const parsed = safeJsonParse<StorePickupConfig>(decrypted, {});
            result.pickupEnabled = parsed.pickupEnabled === true;
            result.pickupLabel = toSafeString(parsed.pickupLabel);
            result.pickupInstruction = toSafeString(parsed.pickupInstruction);
          }
        } catch {}
      }

      return result;
    }),

  updateStoreLocation: superAdminProcedure
    .input(
      z.object({
        storeSlug: z.string(),
        companyName: z.string(),
        address: z.string().optional().default(""),
        lat: z.number().optional().default(0),
        lng: z.number().optional().default(0),
        allowedCities: z.array(z.string()).optional().default([]),
        pickupEnabled: z.boolean(),
        pickupLabel: z.string(),
        pickupInstruction: z.string(),
        minOrderValue: z.number().optional().default(0),
        minOrderMessage: z.string().optional().default(""),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const addressData = {
        companyName: input.companyName,
        address: input.address,
        lat: input.lat,
        lng: input.lng,
        allowedCities: input.allowedCities,
        minOrderValue: input.minOrderValue,
        minOrderMessage: input.minOrderMessage,
      };
      const encryptedAddress = encrypt(JSON.stringify(addressData));

      const pickupData = {
        pickupEnabled: input.pickupEnabled,
        pickupLabel: input.pickupLabel,
        pickupInstruction: input.pickupInstruction,
      };
      const encryptedPickup = encrypt(JSON.stringify(pickupData));

      await db.transaction(async (tx) => {
        await tx
          .insert(appConfigs)
          .values({
            configKey: `store_address_${input.storeSlug}`,
            configValue: encryptedAddress,
          })
          .onDuplicateKeyUpdate({
            set: { configValue: encryptedAddress, updatedAt: new Date() },
          });

        await tx
          .insert(appConfigs)
          .values({
            configKey: `store_pickup_${input.storeSlug}`,
            configValue: encryptedPickup,
          })
          .onDuplicateKeyUpdate({
            set: { configValue: encryptedPickup, updatedAt: new Date() },
          });
      });

      return { success: true };
    }),

  getMesh: superAdminProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(geoMesh).limit(1000);
  }),
});
