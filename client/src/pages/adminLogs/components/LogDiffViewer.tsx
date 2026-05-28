import { ArrowRight, Minus, Plus } from "lucide-react";
import { useMemo } from "react";

type DiffEntry = {
  key: string;
  before: unknown;
  after: unknown;
  type: "added" | "removed" | "changed";
};

const IGNORED_KEYS = new Set([
  "createdAt",
  "created_at",
  "updatedAt",
  "updated_at",
]);
const MAX_VALUE_LENGTH = 320;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    if (value.length > 10) return `[array com ${value.length} itens]`;
    return value.map(normalizeValue);
  }

  if (isRecord(value)) {
    const keys = Object.keys(value);
    if (keys.length > 20) return `[objeto com ${keys.length} campos]`;
    return Object.fromEntries(
      keys
        .filter(key => !IGNORED_KEYS.has(key))
        .map(key => [key, normalizeValue(value[key])])
    );
  }

  return value;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  try {
    const text = JSON.stringify(normalizeValue(value));
    if (text.length > MAX_VALUE_LENGTH) {
      return `${text.slice(0, MAX_VALUE_LENGTH)}...`;
    }
    return text;
  } catch {
    return String(value);
  }
}

export function buildDiffEntries(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined
): DiffEntry[] {
  const oldObj = isRecord(before) ? before : {};
  const newObj = isRecord(after) ? after : {};
  const keys = Array.from(
    new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
  )
    .filter(key => !IGNORED_KEYS.has(key))
    .sort();

  const entries: DiffEntry[] = [];

  for (const key of keys) {
    const oldExists = Object.prototype.hasOwnProperty.call(oldObj, key);
    const newExists = Object.prototype.hasOwnProperty.call(newObj, key);
    const oldValue = normalizeValue(oldObj[key]);
    const newValue = normalizeValue(newObj[key]);

    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue;
    if (!oldExists && newExists) {
      entries.push({ key, before: null, after: newValue, type: "added" });
    } else if (oldExists && !newExists) {
      entries.push({ key, before: oldValue, after: null, type: "removed" });
    } else {
      entries.push({ key, before: oldValue, after: newValue, type: "changed" });
    }
  }

  return entries;
}

export function LogDiffViewer({
  before,
  after,
  compact = false,
}: {
  before: Record<string, unknown> | null | undefined;
  after: Record<string, unknown> | null | undefined;
  compact?: boolean;
}) {
  const entries = useMemo(
    () => buildDiffEntries(before, after),
    [before, after]
  );

  if (entries.length === 0) {
    return (
      <span className="text-[10px] font-semibold italic text-slate-400">
        Sem alterações detalhadas
      </span>
    );
  }

  const visibleEntries = compact ? entries.slice(0, 2) : entries;

  return (
    <div className="space-y-2">
      {visibleEntries.map(entry => (
        <div
          key={entry.key}
          className="border border-slate-100 bg-white p-3 text-[11px]"
        >
          <div className="mb-2 flex items-center gap-2">
            {entry.type === "added" ? (
              <Plus className="size-3 text-emerald-600" />
            ) : entry.type === "removed" ? (
              <Minus className="size-3 text-red-600" />
            ) : (
              <ArrowRight className="size-3 text-amber-600" />
            )}
            <span className="font-black uppercase tracking-widest text-slate-500">
              {entry.key}
            </span>
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-start">
            <code className="max-h-28 overflow-auto bg-slate-50 p-2 text-slate-500">
              {formatValue(entry.before)}
            </code>
            <ArrowRight className="hidden size-3 text-slate-300 md:block" />
            <code className="max-h-28 overflow-auto bg-emerald-50 p-2 text-emerald-700">
              {formatValue(entry.after)}
            </code>
          </div>
        </div>
      ))}
      {compact && entries.length > visibleEntries.length && (
        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
          +{entries.length - visibleEntries.length} alterações
        </span>
      )}
    </div>
  );
}
