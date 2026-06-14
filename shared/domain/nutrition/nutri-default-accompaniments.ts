export interface NutriDefaultAccompanimentOption {
  id: string | number;
  name: string;
  weight?: string | number | null;
  energyKcal?: string | number | null;
  proteins?: string | number | null;
  carbs?: string | number | null;
  fatTotal?: string | number | null;
  isActive?: boolean | null;
  isNoAccompaniment?: boolean | null;
  is_no_accompaniment?: boolean | null;
  [key: string]: unknown;
}

export interface NutriDefaultAccompanimentGroup {
  id?: string | number | null;
  name?: string | null;
  minSelections?: string | number | null;
  min_selections?: string | number | null;
  maxSelections?: string | number | null;
  max_selections?: string | number | null;
  isRequired?: boolean | null;
  is_required?: boolean | null;
  options?: NutriDefaultAccompanimentOption[] | null;
}

export interface SelectedNutriDefaultAccompaniment
  extends NutriDefaultAccompanimentOption {
  id: string | number;
  name: string;
  weight: number;
  isBase: boolean;
  sourceGroupId?: string | number | null;
  sourceGroupName?: string | null;
}

export interface NutriDefaultSelectionResult {
  selectedAccompaniments: SelectedNutriDefaultAccompaniment[];
  autoSelectedCount: number;
  warnings: string[];
}

interface SelectDefaultAccompanimentsForNutriInput {
  groups?: NutriDefaultAccompanimentGroup[] | null;
  minFallback?: number;
  ignoreNoAccompaniment?: boolean;
}

function safeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(typeof value === "string" ? value.replace(",", ".") : value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isNoAccompaniment(option: NutriDefaultAccompanimentOption): boolean {
  if (option.isNoAccompaniment === true || option.is_no_accompaniment === true) {
    return true;
  }

  return String(option.name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim() === "sem acompanhamento";
}

function isActiveOption(option: NutriDefaultAccompanimentOption): boolean {
  return option.isActive !== false;
}

function getMinimumForGroup(
  group: NutriDefaultAccompanimentGroup,
  minFallback: number,
): number {
  const explicitMin = safeNumber(
    group.minSelections ?? group.min_selections,
    Number.NaN,
  );

  if (Number.isFinite(explicitMin) && explicitMin > 0) {
    return explicitMin;
  }

  return minFallback;
}

function getMaximumForGroup(
  group: NutriDefaultAccompanimentGroup,
  candidateCount: number,
): number {
  const explicitMax = safeNumber(
    group.maxSelections ?? group.max_selections,
    Number.NaN,
  );

  if (Number.isFinite(explicitMax) && explicitMax > 0) {
    return explicitMax;
  }

  return candidateCount;
}

export function selectDefaultAccompanimentsForNutri({
  groups,
  minFallback = 2,
  ignoreNoAccompaniment = true,
}: SelectDefaultAccompanimentsForNutriInput): NutriDefaultSelectionResult {
  const selectedAccompaniments: SelectedNutriDefaultAccompaniment[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (const group of groups || []) {
    const activeOptions = (group.options || []).filter(isActiveOption);
    const realOptions = activeOptions.filter((option) => !isNoAccompaniment(option));
    const noAccompanimentOptions = activeOptions.filter(isNoAccompaniment);
    const candidates =
      ignoreNoAccompaniment && realOptions.length > 0
        ? realOptions
        : activeOptions;

    if (activeOptions.length === 0) {
      warnings.push(`Grupo ${group.name || group.id || "sem nome"} sem opcoes ativas.`);
      continue;
    }

    if (candidates.length === 0 && noAccompanimentOptions.length > 0) {
      candidates.push(...noAccompanimentOptions);
    }

    const minimum = getMinimumForGroup(group, minFallback);
    const maximum = getMaximumForGroup(group, candidates.length);
    const selectionLimit = Math.max(0, Math.min(minimum, maximum, candidates.length));

    if (minimum > 0 && selectionLimit < minimum) {
      warnings.push(
        `Grupo ${group.name || group.id || "sem nome"} tem menos opcoes ativas que o minimo.`,
      );
    }

    for (const option of candidates.slice(0, selectionLimit)) {
      const key = `${group.id ?? "group"}:${option.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      selectedAccompaniments.push({
        ...option,
        id: option.id,
        name: option.name,
        weight: safeNumber(option.weight, 100),
        isBase: selectedAccompaniments.length === 0,
        sourceGroupId: group.id ?? null,
        sourceGroupName: group.name ?? null,
      });
    }
  }

  return {
    selectedAccompaniments,
    autoSelectedCount: selectedAccompaniments.length,
    warnings,
  };
}
