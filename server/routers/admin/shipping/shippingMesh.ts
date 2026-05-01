// server/routers/admin/shipping/shippingMesh.ts

import { z } from "zod";
import { router, adminProcedure } from "../../../_core/trpc.js";
import { getDb } from "../../../db.js";
import { geoMesh, shippingZones, appConfigs } from "../../../../drizzle/schema/index.js"; 
import { eq, sql, like, and, inArray } from "drizzle-orm";
import { decrypt, encrypt } from "../../../encryption.js"; 
import { logger } from "../../../logger.js";

// --- INTERFACES ---
interface GeoCoords { lat: number; lng: number; }

interface BaseCepRecord {
  cep: string;
  lat: string | number;
  lng: string | number;
  cidade: string;
  bairro?: string | null;
}

// ✅ FIX TS2769: Nomes das propriedades alinhados com o Schema do geoMesh (Drizzle)
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

// --- HELPERS GEOGRÁFICOS ---
function calculateDistance(p1: GeoCoords, p2: GeoCoords): number {
  const R = 6371e3;
  const dLat = (Number(p2.lat) - Number(p1.lat)) * Math.PI / 180;
  const dLon = (Number(p2.lng) - Number(p1.lng)) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(Number(p1.lat) * Math.PI / 180) * Math.cos(Number(p2.lat) * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isPointInPolygon(point: GeoCoords, polygon: GeoCoords[]): boolean {
  let inside = false;
  const { lat, lng } = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = Number(polygon[i].lat), yi = Number(polygon[i].lng);
    const xj = Number(polygon[j].lat), yj = Number(polygon[j].lng);
    const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * 🚀 MOTOR DE VARREDURA: Cruza a base_ceps com as shipping_zones e gera a geo_mesh
 */
async function processCityScan(storeSlug: string, cidade: string) {
  const db = await getDb();
  
  const queryBase = sql`SELECT * FROM base_ceps WHERE cidade = ${cidade}`;
  const resultBase = await db.execute(queryBase);
  
  const rawRows = (resultBase[0] || resultBase) as unknown as BaseCepRecord[];
  const cepsDaCidade = Array.isArray(rawRows) ? rawRows : [];

  if (cepsDaCidade.length === 0) return { totalLidos: 0, totalNaMalha: 0 };

  const rules = await db.select().from(shippingZones)
    .where(and(eq(shippingZones.storeSlug, storeSlug), eq(shippingZones.isActive, true)));
  
  const cepsParaInserir: MeshInsertRecord[] = [];

  for (const item of cepsDaCidade) {
    const point = { lat: Number(item.lat), lng: Number(item.lng) };
    if (!point.lat || !point.lng) continue;

    for (const rule of rules) {
      if (!rule.polygonCoords) continue;
      const geoData = typeof rule.polygonCoords === "string" ? JSON.parse(rule.polygonCoords) : rule.polygonCoords;

      let isInside = false;
      if (rule.type === 'circle' && geoData.center) {
        isInside = calculateDistance(point, geoData.center) <= Number(geoData.radius);
      } else if (rule.type === 'polygon' && Array.isArray(geoData)) {
        isInside = isPointInPolygon(point, geoData);
      }

      if (isInside) {
        // ✅ CORREÇÃO: Propriedades mapeadas corretamente para o DB
        cepsParaInserir.push({
          zipCode: String(item.cep).replace(/\D/g, ""),
          city: item.cidade,
          neighborhood: item.bairro || "Não Informado",
          lat: String(item.lat),
          lng: String(item.lng),
          price: String(rule.shippingCost || 0),
          storeSlug: storeSlug,
          lastSeen: new Date()
        });
        break; 
      }
    }
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`DELETE FROM geo_mesh WHERE store_slug = ${storeSlug} AND city = ${cidade}`);
    if (cepsParaInserir.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < cepsParaInserir.length; i += chunkSize) {
        await tx.insert(geoMesh).values(cepsParaInserir.slice(i, i + chunkSize));
      }
    }
  });

  return { totalLidos: cepsDaCidade.length, totalNaMalha: cepsParaInserir.length };
}

export const shippingMeshRouter = router({

  bindOperativeCity: adminProcedure
    .input(z.object({ 
      rows: z.array(z.object({
        cep: z.string(),
        cidade: z.string(),
        bairro: z.string().optional(),
        lat: z.string().or(z.number()),
        lng: z.string().or(z.number())
      })) 
    }))
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

  deleteImportedCity: adminProcedure
    .input(z.object({ cidade: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.execute(sql`DELETE FROM base_ceps WHERE cidade = ${input.cidade}`);
      await db.execute(sql`DELETE FROM geo_mesh WHERE city = ${input.cidade}`); // ✅ Ajustado para "city"
      return { success: true };
    }),

  getImportedCities: adminProcedure.query(async () => {
    const db = await getDb();
    const result = await db.execute(sql`SELECT DISTINCT cidade FROM base_ceps ORDER BY cidade ASC`);
    const rows = (result[0] || result) as unknown as { cidade: string }[];
    return rows.map((row) => row.cidade);
  }),

  /**
   * 🔄 SINCRONIZAÇÃO TOTAL (Cidades x Desenhos)
   */
  syncMeshWithRules: adminProcedure.mutation(async () => {
    const db = await getDb();
    const storeConfigs = await db.select().from(appConfigs).where(like(appConfigs.configKey, 'store_address_%'));
    let total = 0;
    
    const resultCities = await db.execute(sql`SELECT DISTINCT cidade FROM base_ceps`);
    const cepsCities = (resultCities[0] || resultCities) as unknown as { cidade: string }[];

    for (const config of storeConfigs) {
      try {
        const slug = config.configKey.replace('store_address_', '');
        for (const row of cepsCities) {
            const res = await processCityScan(slug, row.cidade);
            total += res.totalNaMalha;
        }
      } catch (err) { 
        logger.error({ err }, "Erro ao sincronizar unidade de malha logística"); 
      }
    }
    return { insertedCount: total };
  }),

  listStores: adminProcedure.query(async () => {
    const db = await getDb();
    const configs = await db.select().from(appConfigs).where(like(appConfigs.configKey, 'store_address_%'));
    return configs.map(config => {
      try {
        const slug = config.configKey.replace('store_address_', '');
        const decrypted = decrypt(config.configValue || "") as string;
        const parsed = JSON.parse(decrypted || '{}');
        return { slug, name: parsed.companyName || slug.toUpperCase() };
      } catch { return null; }
    }).filter(Boolean);
  }),

  getStoreBase: adminProcedure
    .input(z.object({ storeSlug: z.string().default("default") }))
    .query(async ({ input }) => {
      const db = await getDb();
      const configs = await db.select().from(appConfigs).where(inArray(appConfigs.configKey, [`store_address_${input.storeSlug}`, `store_pickup_${input.storeSlug}`]));
      
      const result = { 
        companyName: "", address: "", lat: 0, lng: 0, allowedCities: [] as string[], 
        pickupEnabled: false, pickupLabel: "", pickupInstruction: "",
        minOrderValue: 0, minOrderMessage: ""
      };

      for (const config of configs) {
        try {
          const decrypted = decrypt(config.configValue || "") as string;
          const parsed = JSON.parse(decrypted || '{}');
          if (config.configKey.includes('address')) {
            Object.assign(result, parsed);
          } else {
            result.pickupEnabled = !!parsed.pickupEnabled;
            result.pickupLabel = parsed.pickupLabel || "";
            result.pickupInstruction = parsed.pickupInstruction || "";
          }
        } catch { /* ignored */ }
      }
      return result;
    }),

  updateStoreLocation: adminProcedure
    .input(z.object({
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
      minOrderMessage: z.string().optional().default("")
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      const addressData = { 
        companyName: input.companyName, 
        address: input.address, 
        lat: input.lat, 
        lng: input.lng, 
        allowedCities: input.allowedCities,
        minOrderValue: input.minOrderValue,
        minOrderMessage: input.minOrderMessage
      };
      const encryptedAddress = encrypt(JSON.stringify(addressData));
      
      const pickupData = { 
        pickupEnabled: input.pickupEnabled, 
        pickupLabel: input.pickupLabel, 
        pickupInstruction: input.pickupInstruction 
      };
      const encryptedPickup = encrypt(JSON.stringify(pickupData));

      await db.transaction(async (tx) => {
        await tx.insert(appConfigs).values({ configKey: `store_address_${input.storeSlug}`, configValue: encryptedAddress })
          .onDuplicateKeyUpdate({ set: { configValue: encryptedAddress, updatedAt: new Date() } });
        await tx.insert(appConfigs).values({ configKey: `store_pickup_${input.storeSlug}`, configValue: encryptedPickup })
          .onDuplicateKeyUpdate({ set: { configValue: encryptedPickup, updatedAt: new Date() } });
      });
      return { success: true };
    }),

  getMesh: adminProcedure.query(async () => {
    const db = await getDb();
    return await db.select().from(geoMesh).limit(1000);
  }),
});