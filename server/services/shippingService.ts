// server/services/shippingService.ts

import { sql, eq, and } from "drizzle-orm";
import { getDb } from "../db.js";
import { appConfigs, shippingZones } from "../../drizzle/schema/index.js";
import { decrypt } from "../encryption.js";
import { safeJsonParse, safeNumber, safeString } from "../lib/safe-parse.js";

interface ExternalGeoData {
  city: string;
  lat: string;
  lng: string;
  neighborhood?: string;
}

const normalizeText = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

async function fetchExternalGeo(cep: string): Promise<ExternalGeoData | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();

    if (data.erro) return null;

    let lat = "0";
    let lng = "0";

    try {
      const fullAddr = `${data.logradouro}, ${data.localidade} - ${data.uf}`;
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddr)}&limit=1`,
        { headers: { "User-Agent": "GourmetSaudavel-Server-Validator" } },
      );
      const geoData = await geoRes.json();

      if (geoData && geoData[0]) {
        lat = geoData[0].lat;
        lng = geoData[0].lon;
      }
    } catch {
      console.warn(
        `Aviso: Nao foi possivel obter coordenadas para o CEP ${cep}, usando 0,0.`,
      );
    }

    return {
      city: data.localidade,
      neighborhood: data.bairro || "Nao Informado",
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

export async function globalShippingValidator(
  cep: string,
  storeSlug: string = "jundiai",
) {
  const db = await getDb();
  const cleanCep = cep.replace(/\D/g, "");

  const config = await db.query.appConfigs.findFirst({
    where: eq(appConfigs.configKey, `store_address_${storeSlug}`),
  });

  const decryptedValue = config?.configValue
    ? (decrypt(config.configValue) as string)
    : "{}";
  const settings = safeJsonParse<Record<string, unknown>>(decryptedValue, {});
  const allowedCities = Array.isArray(settings.allowedCities)
    ? settings.allowedCities.map((city) => safeString(city)).filter(Boolean)
    : [];

  const minOrderValue = safeNumber(settings.minOrderValue, 0);
  const minOrderMessage = safeString(
    settings.minOrderMessage,
    "Valor minimo nao atingido para entrega.",
  );

  const resultMesh = await db.execute(sql`
    SELECT * FROM geo_mesh 
    WHERE cep = ${cleanCep} AND store_slug = ${storeSlug} 
    LIMIT 1
  `);

  const rows = (resultMesh[0] || resultMesh) as unknown as Array<{
    price?: string | number;
    shipping_cost?: string | number;
  }>;
  const meshRecord = rows.length > 0 ? rows[0] : null;

  if (meshRecord) {
    const finalCost = meshRecord.price ?? meshRecord.shipping_cost ?? 0;
    return {
      isValid: true,
      cityAllowed: true,
      shippingCost: safeNumber(finalCost),
      source: "mesh",
      minOrderValue,
      minOrderMessage,
    };
  }

  const geoInfo = await fetchExternalGeo(cleanCep);
  if (!geoInfo) {
    return {
      isValid: false,
      cityAllowed: false,
      shippingCost: 0,
      source: "not_found",
      minOrderValue,
      minOrderMessage,
    };
  }

  const isCityAllowed = allowedCities.some(
    (city) => normalizeText(city) === normalizeText(geoInfo.city),
  );

  if (!isCityAllowed) {
    return {
      isValid: false,
      cityAllowed: false,
      shippingCost: 0,
      source: "city_denied",
      minOrderValue,
      minOrderMessage,
    };
  }

  const rules = await db.query.shippingZones.findMany({
    where: and(eq(shippingZones.storeSlug, storeSlug), eq(shippingZones.isActive, true)),
  });

  const precoPadrao = rules.length > 0 ? safeNumber(rules[0].shippingCost, 0) : 0;

  try {
    const bairroSeguro =
      geoInfo.neighborhood && geoInfo.neighborhood.trim() !== ""
        ? geoInfo.neighborhood
        : "Nao Informado";

    const cidadeSegura = geoInfo.city || "Desconhecida";

    await db.execute(sql`
      INSERT INTO geo_mesh (
        cep, bairro, cidade, store_slug, lat, lng, price, last_seen
      ) VALUES (
        ${cleanCep}, 
        ${bairroSeguro}, 
        ${cidadeSegura}, 
        ${storeSlug}, 
        ${geoInfo.lat}, 
        ${geoInfo.lng}, 
        ${precoPadrao}, 
        NOW()
      )
      ON DUPLICATE KEY UPDATE 
        price = VALUES(price),
        lat = VALUES(lat),
        lng = VALUES(lng),
        bairro = VALUES(bairro),
        last_seen = NOW()
    `);
  } catch (insertError) {
    console.error("[ShippingService] Falha ao guardar na geo_mesh:", insertError);
  }

  return {
    isValid: true,
    cityAllowed: true,
    shippingCost: precoPadrao,
    source: "city_bypass",
    minOrderValue,
    minOrderMessage,
  };
}
