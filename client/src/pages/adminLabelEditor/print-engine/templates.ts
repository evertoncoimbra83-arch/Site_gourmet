import { safeJsonParse, safeNumber } from "@/lib/safe-parse";

export interface PrintLabelElement {
  id: string;
  type: "text" | "variable" | "image" | "box";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: string;
  zIndex: number;
  color?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
}

export interface AdminLabelTemplate {
  id: number;
  name: string;
  width: number | null;
  height: number | null;
  elements: string;
  isDefault: boolean | null;
}

export interface LegacyLabelTemplate {
  id?: string | number;
  name?: string;
  elements: PrintLabelElement[] | string;
  config?: { width: number; height: number };
}

export interface ActiveLabelTemplate {
  id: string;
  name: string;
  source: "admin.labels" | "legacy";
  width: number;
  height: number;
  elements: PrintLabelElement[];
  isDefault: boolean;
}

function normalizeNewElements(rawElements: string): PrintLabelElement[] {
  const raw = safeJsonParse<Array<Record<string, unknown>>>(rawElements, []);
  return raw.map((element) => ({
    id: String(element.id ?? ""),
    type: (element.type === "nutrition_table" ? "text" : element.type ?? "text") as PrintLabelElement["type"],
    content: String(
      element.content ||
        element.staticText ||
        (element.field ? `{{${String(element.field).toUpperCase()}}}` : "TEXTO"),
    ),
    x: safeNumber(element.x),
    y: safeNumber(element.y),
    width: safeNumber(element.width, 100),
    height: safeNumber(element.height, 20),
    fontSize: safeNumber(element.fontSize, 12),
    fontWeight: String(element.fontWeight ?? "700"),
    zIndex: safeNumber(element.zIndex, 10),
    textAlign: (element.textAlign ?? "left") as PrintLabelElement["textAlign"],
    color: element.color ? String(element.color) : undefined,
    backgroundColor: element.backgroundColor ? String(element.backgroundColor) : undefined,
  }));
}

export function parseLegacyTemplates(rawValue?: string | null): LegacyLabelTemplate[] {
  if (!rawValue) return [];
  const parsed = safeJsonParse<unknown>(rawValue, []);
  return Array.isArray(parsed) ? parsed : parsed ? [parsed as LegacyLabelTemplate] : [];
}

export function buildTemplateLibrary(
  templates: AdminLabelTemplate[],
  legacyValue?: string | null,
): ActiveLabelTemplate[] {
  const normalized = templates.map((template) => ({
    id: `new:${template.id}`,
    name: template.name,
    source: "admin.labels" as const,
    width: template.width ?? 100,
    height: template.height ?? 60,
    elements: normalizeNewElements(template.elements),
    isDefault: Boolean(template.isDefault),
  }));

  if (normalized.length > 0) return normalized;

  return parseLegacyTemplates(legacyValue).map((template, index) => ({
    id: `legacy:${String(template.id ?? index)}`,
    name: template.name ?? `Layout ${index + 1}`,
    source: "legacy" as const,
    width: template.config?.width ?? 100,
    height: template.config?.height ?? 60,
    elements:
      typeof template.elements === "string"
        ? safeJsonParse<PrintLabelElement[]>(template.elements, [])
        : Array.isArray(template.elements)
          ? template.elements
          : [],
    isDefault: index === 0,
  }));
}
