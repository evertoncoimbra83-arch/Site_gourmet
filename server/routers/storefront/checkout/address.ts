import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../db.js";
import { decrypt, normalizeDigits } from "../../../encryption.js";
import {
  shippingZones,
  userAddresses,
} from "../../../../drizzle/schema/index.js";
import axios from "axios";
import { safeJsonParse, safeNumber } from "../../../lib/safe-parse.js";

type Database = Awaited<ReturnType<typeof getDb>>;
type TxType = Parameters<Parameters<Database["transaction"]>[0]>[0];

type ShippingZoneRow = typeof shippingZones.$inferSelect;
type UserAddressRow = typeof userAddresses.$inferSelect & {
  lat?: string | null;
  lng?: string | null;
};

interface GeoPoint {
  lat: number;
  lng: number;
}

interface AddressOptions {
  shippingType: "delivery" | "pickup";
  addressId: string | null;
}

interface AddressSnapshotData {
  id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  complement: string;
  lat: number | null;
  lng: number | null;
}

interface AddressSnapshotResult {
  type: "delivery" | "pickup";
  id?: string;
  text: string;
  zipCode: string | null;
  city?: string;
  state?: string;
  number?: string;
  neighborhood?: string;
  street?: string;
  complement?: string;
  price: number;
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

function safeDecrypt(value: unknown): string {
  if (!value) return "";
  const raw = String(value);
  if (raw.split(":").length !== 3) return raw.trim();

  try {
    return (decrypt(raw) || raw).trim();
  } catch {
    return raw.trim();
  }
}

function parseCoordinate(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = safeNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNumber(value: unknown, fallback = 0): number {
  return safeNumber(value, fallback);
}

function requireAddressField(value: string, fieldLabel: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Endereço incompleto: ${fieldLabel} é obrigatório.`,
    });
  }
  return normalized;
}

function normalizeState(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Endereço inválido: UF deve ter 2 letras.",
    });
  }
  return normalized;
}

function buildAddressData(addr: UserAddressRow): AddressSnapshotData {
  const street = requireAddressField(safeDecrypt(addr.street), "rua");
  const number = requireAddressField(safeDecrypt(addr.number), "número");
  const neighborhood = requireAddressField(
    safeDecrypt(addr.neighborhood),
    "bairro",
  );
  const city = requireAddressField(safeDecrypt(addr.city), "cidade");
  const state = normalizeState(safeDecrypt(addr.state));
  const zipCode = normalizeDigits(safeDecrypt(addr.zipCode));

  if (zipCode.length !== 8) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Endereço inválido: CEP deve conter 8 dígitos.",
    });
  }

  return {
    id: addr.id,
    street,
    number,
    neighborhood,
    city,
    state,
    zipCode,
    complement: safeDecrypt(addr.complement),
    lat: parseCoordinate(addr.lat),
    lng: parseCoordinate(addr.lng),
  };
}

function parseGeoPoint(value: unknown): GeoPoint | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const lat = safeNumber(record.lat, Number.NaN);
  const lng = safeNumber(record.lng, Number.NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function buildReturn(
  data: AddressSnapshotData,
  rule: ShippingZoneRow,
): AddressSnapshotResult {
  return {
    type: "delivery",
    id: data.id,
    text: `${data.street}, ${data.number}${
      data.complement ? ` (${data.complement})` : ""
    } - ${data.neighborhood}, ${data.city}/${data.state}`,
    zipCode: data.zipCode,
    city: data.city,
    state: data.state,
    number: data.number,
    neighborhood: data.neighborhood,
    street: data.street,
    complement: data.complement,
    price: toNumber(rule.shippingCost),
  };
}

export async function loadAddressSnapshot(
  tx: TxType,
  opts: AddressOptions,
): Promise<AddressSnapshotResult> {
  if (opts.shippingType === "pickup") {
    return {
      type: "pickup",
      text: "Retirada no Local / Balcão",
      zipCode: null,
      price: 0,
    };
  }

  if (!opts.addressId || opts.addressId === "undefined") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ID do endereço inválido ou não informado.",
    });
  }

  const activeRules = await tx
    .select()
    .from(shippingZones)
    .where(eq(shippingZones.isActive, true));

  const [addr] = await tx
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.id, opts.addressId))
    .limit(1);

  if (!addr) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Endereço não localizado.",
    });
  }

  const finalAddressData = buildAddressData(addr);
  const cleanZip = finalAddressData.zipCode;

  const zipRule = activeRules.find((rule) => {
    if (rule.type !== "zipcode") return false;
    return cleanZip >= rule.zipCodeStart && cleanZip <= rule.zipCodeEnd;
  });

  if (zipRule) {
    return buildReturn(finalAddressData, zipRule);
  }

  let lat = finalAddressData.lat;
  let lng = finalAddressData.lng;

  if (lat == null || lng == null) {
    try {
      const query = `${finalAddressData.street}, ${finalAddressData.number}, ${finalAddressData.city}, Brasil`;
      const response = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: query, format: "json", limit: 1 },
        headers: { "User-Agent": "Gourmet-Saudavel-Checkout-Bot" },
        timeout: 4000,
      });

      const firstMatch = Array.isArray(response.data) ? response.data[0] : null;
      if (firstMatch) {
        lat = safeNumber(firstMatch.lat, Number.NaN);
        lng = safeNumber(firstMatch.lon, Number.NaN);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          await tx.execute(
            sql`UPDATE user_addresses SET lat = ${String(lat)}, lng = ${String(lng)} WHERE id = ${finalAddressData.id}`,
          );
        }
      }
    } catch {
      console.error("[AddressSnapshot] Falha na geocodificação Nominatim");
    }
  }

  if (lat != null && lng != null) {
    const clientPoint: GeoPoint = { lat, lng };

    for (const rule of activeRules) {
      if (!rule.polygonCoords) continue;

      const geoData = safeJsonParse<unknown>(rule.polygonCoords, null);

      if (rule.type === "circle") {
        const geoRecord =
          geoData && typeof geoData === "object"
            ? (geoData as Record<string, unknown>)
            : null;
        const center = parseGeoPoint(geoRecord?.center);
        const radius = safeNumber(geoRecord?.radius, Number.NaN);

        if (center && Number.isFinite(radius)) {
          if (isPointInCircle(clientPoint, center, radius)) {
            return buildReturn(finalAddressData, rule);
          }
        }
      }

      if (rule.type === "polygon" && Array.isArray(geoData)) {
        const polygon = geoData
          .map(parseGeoPoint)
          .filter((point): point is GeoPoint => point !== null);

        if (polygon.length > 2 && isPointInPolygon(clientPoint, polygon)) {
          return buildReturn(finalAddressData, rule);
        }
      }
    }
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: `Infelizmente nossa logística ainda não atende a região do CEP ${finalAddressData.zipCode}.`,
  });
}
