export interface PackageConfigGroup {
  id: string | number;
  customLabel?: string | null;
  optionIds?: Array<string | number>;
}

export interface PackageConfigSlot {
  name?: string | null;
  sizeId?: string | number | null;
  dishIds?: Array<string | number>;
  groups?: PackageConfigGroup[];
}

export interface PackageConfigInput {
  slots?: PackageConfigSlot[];
}

export interface PackageConfigCatalogDish {
  id: string | number;
  name: string;
  isActive: boolean;
  sizeIds: Array<string | number>;
}

export interface PackageConfigCatalogGroup {
  id: string | number;
  name: string;
  isActive: boolean;
  minSelections?: number | null;
  maxSelections?: number | null;
  optionIds?: Array<string | number>;
}

export interface PackageConfigCatalogOption {
  id: string | number;
  name: string;
  isActive: boolean;
  priceModifier?: number | string | null;
}

export interface PackageConfigCatalog {
  dishes: PackageConfigCatalogDish[];
  groups: PackageConfigCatalogGroup[];
  options: PackageConfigCatalogOption[];
}

export interface PackageConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const toKey = (value: string | number | null | undefined) =>
  value == null ? "" : String(value);

const labelSlot = (slot: PackageConfigSlot, index: number) =>
  slot.name?.trim() || `Marmita ${index + 1}`;

export function validatePackageConfig(
  config: PackageConfigInput | null | undefined,
  packageSizeId: string | number | null | undefined,
  catalog: PackageConfigCatalog,
  options: { isPackageActive?: boolean } = {},
): PackageConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const slots = Array.isArray(config?.slots) ? config!.slots! : [];
  const packageSizeKey = toKey(packageSizeId);

  const dishesById = new Map(catalog.dishes.map((dish) => [toKey(dish.id), dish]));
  const groupsById = new Map(catalog.groups.map((group) => [toKey(group.id), group]));
  const optionsById = new Map(
    catalog.options.map((option) => [toKey(option.id), option]),
  );

  if (!packageSizeKey) {
    errors.push("Selecione um tamanho para o pacote.");
  }

  if (slots.length === 0) {
    errors.push("Pacote ativo precisa ter pelo menos uma marmita configurada.");
  }

  slots.forEach((slot, slotIndex) => {
    const slotName = labelSlot(slot, slotIndex);
    const slotSizeKey = toKey(slot.sizeId) || packageSizeKey;
    const dishIds = Array.isArray(slot.dishIds) ? slot.dishIds : [];
    const validDishIds: string[] = [];

    if (dishIds.length === 0) {
      errors.push(`"${slotName}" precisa ter pelo menos um prato permitido.`);
    }

    dishIds.forEach((dishId) => {
      const dishKey = toKey(dishId);
      const dish = dishesById.get(dishKey);

      if (!dish) {
        errors.push(`"${slotName}" referencia prato inexistente (${dishKey}).`);
        return;
      }

      if (!dish.isActive) {
        errors.push(`"${slotName}" usa o prato inativo "${dish.name}".`);
        return;
      }

      const supportsSize = dish.sizeIds.map(toKey).includes(slotSizeKey);
      if (!supportsSize) {
        errors.push(
          `"${slotName}" usa "${dish.name}", que nao suporta o tamanho do kit.`,
        );
        return;
      }

      validDishIds.push(dishKey);
    });

    if (options.isPackageActive && validDishIds.length === 0) {
      errors.push(`"${slotName}" ficou impossivel de montar.`);
    }

    const groups = Array.isArray(slot.groups) ? slot.groups : [];
    groups.forEach((slotGroup) => {
      const groupKey = toKey(slotGroup.id);
      const group = groupsById.get(groupKey);

      if (!group) {
        errors.push(`"${slotName}" referencia grupo inexistente (${groupKey}).`);
        return;
      }

      if (!group.isActive) {
        errors.push(`"${slotName}" usa o grupo inativo "${group.name}".`);
      }

      const min = Number(group.minSelections ?? 0);
      const max = Number(group.maxSelections ?? 1);
      if (min > max) {
        errors.push(
          `Grupo "${group.name}" tem minimo maior que maximo (${min} > ${max}).`,
        );
      }

      const configuredOptionIds = Array.isArray(slotGroup.optionIds)
        ? slotGroup.optionIds.map(toKey).filter(Boolean)
        : [];
      const allowedOptionIds =
        configuredOptionIds.length > 0
          ? configuredOptionIds
          : (group.optionIds || []).map(toKey).filter(Boolean);

      const validOptions = allowedOptionIds.filter((optionId) => {
        const option = optionsById.get(optionId);
        if (!option) {
          errors.push(
            `Grupo "${group.name}" referencia acompanhamento inexistente (${optionId}).`,
          );
          return false;
        }

        if (!option.isActive) {
          errors.push(
            `Grupo "${group.name}" usa acompanhamento inativo "${option.name}".`,
          );
          return false;
        }

        return true;
      });

      if (min > 0 && validOptions.length < min) {
        errors.push(
          `Grupo obrigatorio "${group.name}" nao tem opcoes validas suficientes.`,
        );
      }

      const hasPremium = validOptions.some((optionId) => {
        const price = Number(optionsById.get(optionId)?.priceModifier ?? 0);
        return Number.isFinite(price) && price > 0;
      });

      if (hasPremium) {
        warnings.push(
          `Grupo "${group.name}" possui acompanhamentos premium; confira se o preco extra esta claro para o cliente.`,
        );
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function findPackagesUsingDish<
  T extends { name: string; config?: PackageConfigInput | string | null },
>(packages: T[], dishId: string | number) {
  const targetKey = toKey(dishId);

  return packages.filter((pkg) => {
    const rawConfig = pkg.config;
    let config = rawConfig as PackageConfigInput | null | undefined;

    if (typeof rawConfig === "string") {
      try {
        config = JSON.parse(rawConfig || "{\"slots\":[]}") as PackageConfigInput;
      } catch {
        config = { slots: [] };
      }
    }

    return (config?.slots || []).some((slot) =>
      (slot.dishIds || []).map(toKey).includes(targetKey),
    );
  });
}
