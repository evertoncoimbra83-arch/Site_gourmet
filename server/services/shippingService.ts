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

type DatabaseClient = Awaited<ReturnType<typeof getDb>>;
type TxType = Parameters<Parameters<DatabaseClient["transaction"]>[0]>[0];

export interface DeliveryResolution {
  allowed: boolean;
  cityAllowed: boolean;
  reason?: string;
  normalizedCep: string;
  zoneId?: number | null;
  ruleId?: number | null;
  method: "delivery" | "pickup";
  fee: number;
  estimatedTime?: string | null;
  minimumOrderValue?: number | null;
  source?: string;
}

interface GeoPoint {
  lat: number;
  lng: number;
}

function isPointInCircle(
  point: GeoPoint,
  center: GeoPoint,
  radiusMeters: number,
) {
  const earthRadius = 6371e3;
  const phi1 = (point.lat * Math.PI) / 180;
  const phi2 = (center.lat * Math.PI) / 180;
  const deltaPhi = ((center.lat - point.lat) * Math.PI) / 180;
  const deltaLambda = ((center.lng - point.lng) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c <= radiusMeters;
}

function isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]) {
  const { lat: x, lng: y } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function parseGeoPoint(value: unknown): GeoPoint | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const lat = safeNumber(record.lat, Number.NaN);
  const lng = safeNumber(record.lng, Number.NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function parseCoordinate(value: string | null | undefined | number): number | null {
  if (value == null) return null;
  const parsed = safeNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function logShippingValidation(
  cep: string,
  method: string,
  allowed: boolean,
  zoneId: number | null | undefined,
  fee: number,
  reason: string | undefined,
  context: "cart" | "checkout" | "place_order"
) {
  console.log(
    `[ShippingValidation] Context: ${context} | CEP: ${cep} | Method: ${method} | Allowed: ${allowed} | ZoneId: ${zoneId ?? "none"} | Fee: ${fee} | Reason: ${reason ?? "none"}`
  );
}

async function insertGeoMesh(
  db: any,
  cep: string,
  geoInfo: { city: string; neighborhood?: string },
  storeSlug: string,
  price: number,
  lat?: number | null,
  lng?: number | null,
) {
  try {
    const bairroSeguro = geoInfo.neighborhood && geoInfo.neighborhood.trim() !== "" ? geoInfo.neighborhood : "Nao Informado";
    const cidadeSegura = geoInfo.city || "Desconhecida";
    const finalLat = lat ?? 0;
    const finalLng = lng ?? 0;

    await db.execute(sql`
      INSERT INTO geo_mesh (
        cep, bairro, cidade, store_slug, lat, lng, price, last_seen
      ) VALUES (
        ${cep},
        ${bairroSeguro},
        ${cidadeSegura},
        ${storeSlug},
        ${String(finalLat)},
        ${String(finalLng)},
        ${String(price)},
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
}

export async function resolveDeliveryCoverage(params: {
  cep: string;
  storeSlug?: string;
  coords?: { lat: number | null; lng: number | null } | null;
  tx?: TxType;
  context?: "cart" | "checkout" | "place_order";
}): Promise<DeliveryResolution> {
  const storeSlug = params.storeSlug || "jundiai";
  const cleanCep = params.cep.replace(/\D/g, "");
  const method = "delivery";
  const context = params.context || "cart";

  const db = params.tx || (await getDb());

  if (cleanCep.length !== 8) {
    const res: DeliveryResolution = {
      allowed: false,
      cityAllowed: false,
      reason: "CEP inválido ou não informado.",
      normalizedCep: cleanCep,
      method,
      fee: 0,
      source: "invalid_cep",
    };
    logShippingValidation(cleanCep, method, res.allowed, null, res.fee, res.reason, context);
    return res;
  }

  // 1. Carregar configurações da loja
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

  // 2. Carregar regras de frete ativas
  const activeRules = await db.query.shippingZones.findMany({
    where: and(eq(shippingZones.storeSlug, storeSlug), eq(shippingZones.isActive, true)),
  });

  const precoPadrao = activeRules.length > 0 ? safeNumber(activeRules[0].shippingCost, 0) : 0;
  const defaultZoneId = activeRules.length > 0 ? activeRules[0].id : null;
  const defaultEstimatedDays = activeRules.length > 0 ? activeRules[0].estimatedDays : null;

  // 3. Verificar se o CEP atende diretamente a uma regra de zipcode
  const zipRule = activeRules.find((rule) => {
    if (rule.type !== "zipcode") return false;
    if (!rule.zipCodeStart || !rule.zipCodeEnd) return false;
    const start = rule.zipCodeStart.replace(/\D/g, "");
    const end = rule.zipCodeEnd.replace(/\D/g, "");
    return cleanCep >= start && cleanCep <= end;
  });

  if (zipRule) {
    const res: DeliveryResolution = {
      allowed: true,
      cityAllowed: true,
      normalizedCep: cleanCep,
      zoneId: zipRule.id,
      ruleId: zipRule.id,
      method,
      fee: safeNumber(zipRule.shippingCost, 0),
      estimatedTime: zipRule.estimatedDays ? `${zipRule.estimatedDays} dias` : null,
      minimumOrderValue: minOrderValue,
      source: "zipcode",
    };
    logShippingValidation(cleanCep, method, res.allowed, res.zoneId, res.fee, undefined, context);
    return res;
  }

  // 4. Verificar se o CEP está na geo_mesh
  const resultMesh = await db.execute(sql`
    SELECT * FROM geo_mesh 
    WHERE cep = ${cleanCep} AND store_slug = ${storeSlug} 
    LIMIT 1
  `);

  const rows = (resultMesh[0] || resultMesh) as unknown as Array<{
    price?: string | number;
    shipping_cost?: string | number;
    lat?: string | number;
    lng?: string | number;
    bairro?: string;
    cidade?: string;
  }>;
  const meshRecord = rows.length > 0 ? rows[0] : null;

  if (meshRecord) {
    const finalCost = meshRecord.price ?? meshRecord.shipping_cost ?? precoPadrao;
    const res: DeliveryResolution = {
      allowed: true,
      cityAllowed: true,
      normalizedCep: cleanCep,
      zoneId: defaultZoneId,
      ruleId: defaultZoneId,
      method,
      fee: safeNumber(finalCost, 0),
      estimatedTime: defaultEstimatedDays ? `${defaultEstimatedDays} dias` : null,
      minimumOrderValue: minOrderValue,
      source: "geoMesh",
    };
    logShippingValidation(cleanCep, method, res.allowed, res.zoneId, res.fee, undefined, context);
    return res;
  }

  // 5. Se não está em mesh ou zipcode range, buscamos coordenadas externas (nominatim/viacep)
  const geoInfo = await fetchExternalGeo(cleanCep);
  if (!geoInfo) {
    const res: DeliveryResolution = {
      allowed: false,
      cityAllowed: false,
      reason: "CEP não localizado ou indisponível.",
      normalizedCep: cleanCep,
      method,
      fee: 0,
      minimumOrderValue: minOrderValue,
      source: "not_found",
    };
    logShippingValidation(cleanCep, method, res.allowed, null, res.fee, res.reason, context);
    return res;
  }

  const isCityAllowed = allowedCities.some(
    (city) => normalizeText(city) === normalizeText(geoInfo.city),
  );

  if (!isCityAllowed) {
    const res: DeliveryResolution = {
      allowed: false,
      cityAllowed: false,
      reason: "Ainda não chegamos na sua região. Disponível apenas para retirada.",
      normalizedCep: cleanCep,
      method,
      fee: 0,
      minimumOrderValue: minOrderValue,
      source: "city_denied",
    };
    logShippingValidation(cleanCep, method, res.allowed, null, res.fee, res.reason, context);
    return res;
  }

  // 6. A cidade é permitida. Verificamos regras de polígono ou círculo
  const lat = params.coords?.lat ?? parseCoordinate(geoInfo.lat);
  const lng = params.coords?.lng ?? parseCoordinate(geoInfo.lng);

  if (lat != null && lng != null) {
    const clientPoint = { lat, lng };

    for (const rule of activeRules) {
      if (!rule.polygonCoords) continue;
      const geoData = safeJsonParse<unknown>(rule.polygonCoords, null);

      if (rule.type === "circle") {
        const geoRecord = geoData && typeof geoData === "object" ? (geoData as Record<string, unknown>) : null;
        const center = parseGeoPoint(geoRecord?.center);
        const radius = safeNumber(geoRecord?.radius, Number.NaN);

        if (center && Number.isFinite(radius) && isPointInCircle(clientPoint, center, radius)) {
          const ruleFee = safeNumber(rule.shippingCost, 0);
          await insertGeoMesh(db, cleanCep, geoInfo, storeSlug, ruleFee, lat, lng);
          const res: DeliveryResolution = {
            allowed: true,
            cityAllowed: true,
            normalizedCep: cleanCep,
            zoneId: rule.id,
            ruleId: rule.id,
            method,
            fee: ruleFee,
            estimatedTime: rule.estimatedDays ? `${rule.estimatedDays} dias` : null,
            minimumOrderValue: minOrderValue,
            source: "circle",
          };
          logShippingValidation(cleanCep, method, res.allowed, res.zoneId, res.fee, undefined, context);
          return res;
        }
      }

      if (rule.type === "polygon" && Array.isArray(geoData)) {
        const polygon = geoData.map(parseGeoPoint).filter((point): point is GeoPoint => point !== null);

        if (polygon.length > 2 && isPointInPolygon(clientPoint, polygon)) {
          const ruleFee = safeNumber(rule.shippingCost, 0);
          await insertGeoMesh(db, cleanCep, geoInfo, storeSlug, ruleFee, lat, lng);
          const res: DeliveryResolution = {
            allowed: true,
            cityAllowed: true,
            normalizedCep: cleanCep,
            zoneId: rule.id,
            ruleId: rule.id,
            method,
            fee: ruleFee,
            estimatedTime: rule.estimatedDays ? `${rule.estimatedDays} dias` : null,
            minimumOrderValue: minOrderValue,
            source: "polygon",
          };
          logShippingValidation(cleanCep, method, res.allowed, res.zoneId, res.fee, undefined, context);
          return res;
        }
      }
    }
  }

  // 7. Se não encaixou em nenhuma regra geométrica, mas a cidade é permitida, fazemos o "city bypass"
  await insertGeoMesh(db, cleanCep, geoInfo, storeSlug, precoPadrao, lat, lng);
  const res: DeliveryResolution = {
    allowed: true,
    cityAllowed: true,
    normalizedCep: cleanCep,
    zoneId: defaultZoneId,
    ruleId: defaultZoneId,
    method,
    fee: precoPadrao,
    estimatedTime: defaultEstimatedDays ? `${defaultEstimatedDays} dias` : null,
    minimumOrderValue: minOrderValue,
    source: "cityBypass",
  };
  logShippingValidation(cleanCep, method, res.allowed, res.zoneId, res.fee, undefined, context);
  return res;
}

export async function globalShippingValidator(
  cep: string,
  storeSlug: string = "jundiai",
) {
  const res = await resolveDeliveryCoverage({
    cep,
    storeSlug,
    context: "checkout",
  });

  return {
    isValid: res.allowed,
    cityAllowed: res.cityAllowed,
    shippingCost: res.fee,
    source: res.source || "mesh",
    minOrderValue: res.minimumOrderValue || 0,
    minOrderMessage: "Valor minimo nao atingido para entrega.",
  };
}
