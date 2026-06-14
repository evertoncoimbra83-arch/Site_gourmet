import { describe, expect, it } from "vitest";
import {
  findPackagesUsingDish,
  validatePackageConfig,
  type PackageConfigCatalog,
} from "../shared/domain/packages/config-validator.js";
import { formatPackageOptionPriceLabel } from "../shared/domain/packages/price-label.js";

const catalog: PackageConfigCatalog = {
  dishes: [
    { id: 1, name: "Frango", isActive: true, sizeIds: [10] },
    { id: 2, name: "Lasanha", isActive: false, sizeIds: [10] },
    { id: 3, name: "Peixe", isActive: true, sizeIds: [20] },
  ],
  groups: [
    {
      id: 100,
      name: "Carboidrato",
      isActive: true,
      minSelections: 1,
      maxSelections: 1,
      optionIds: [1000, 1001],
    },
    {
      id: 101,
      name: "Proteina extra",
      isActive: false,
      minSelections: 0,
      maxSelections: 1,
      optionIds: [1000],
    },
    {
      id: 102,
      name: "Grupo quebrado",
      isActive: true,
      minSelections: 2,
      maxSelections: 1,
      optionIds: [1000],
    },
  ],
  options: [
    { id: 1000, name: "Arroz integral", isActive: true, priceModifier: 0 },
    { id: 1001, name: "Pure", isActive: true, priceModifier: 4.9 },
    { id: 1002, name: "Inativo", isActive: false, priceModifier: 0 },
  ],
};

describe("validatePackageConfig", () => {
  it("accepts a valid package", () => {
    const result = validatePackageConfig(
      {
        slots: [
          {
            name: "Marmita 1",
            sizeId: 10,
            dishIds: [1],
            groups: [{ id: 100, optionIds: [1000] }],
          },
        ],
      },
      10,
      catalog,
      { isPackageActive: true },
    );

    expect(result.isValid).toBe(true);
  });

  it("rejects missing dish references", () => {
    const result = validatePackageConfig(
      { slots: [{ name: "Marmita", dishIds: [999], groups: [] }] },
      10,
      catalog,
      { isPackageActive: true },
    );

    expect(result.errors.join(" ")).toContain("prato inexistente");
  });

  it("rejects inactive dish references", () => {
    const result = validatePackageConfig(
      { slots: [{ name: "Marmita", dishIds: [2], groups: [] }] },
      10,
      catalog,
      { isPackageActive: true },
    );

    expect(result.errors.join(" ")).toContain("prato inativo");
  });

  it("rejects dishes that do not support the package size", () => {
    const result = validatePackageConfig(
      { slots: [{ name: "Marmita", dishIds: [3], groups: [] }] },
      10,
      catalog,
      { isPackageActive: true },
    );

    expect(result.errors.join(" ")).toContain("nao suporta");
  });

  it("rejects missing groups", () => {
    const result = validatePackageConfig(
      {
        slots: [{ name: "Marmita", dishIds: [1], groups: [{ id: 999 }] }],
      },
      10,
      catalog,
    );

    expect(result.errors.join(" ")).toContain("grupo inexistente");
  });

  it("rejects inactive groups", () => {
    const result = validatePackageConfig(
      {
        slots: [{ name: "Marmita", dishIds: [1], groups: [{ id: 101 }] }],
      },
      10,
      catalog,
    );

    expect(result.errors.join(" ")).toContain("grupo inativo");
  });

  it("rejects minSelections greater than maxSelections", () => {
    const result = validatePackageConfig(
      {
        slots: [{ name: "Marmita", dishIds: [1], groups: [{ id: 102 }] }],
      },
      10,
      catalog,
    );

    expect(result.errors.join(" ")).toContain("minimo maior que maximo");
  });

  it("rejects an active package that cannot be assembled", () => {
    const result = validatePackageConfig(
      { slots: [{ name: "Marmita", dishIds: [], groups: [] }] },
      10,
      catalog,
      { isPackageActive: true },
    );

    expect(result.errors.join(" ")).toContain("impossivel de montar");
  });

  it("finds active packages using a dish before inactivation", () => {
    const usingDish = findPackagesUsingDish(
      [
        {
          name: "Kit Fitness",
          config: { slots: [{ dishIds: [1], groups: [] }] },
        },
        {
          name: "Kit Vegano",
          config: { slots: [{ dishIds: [3], groups: [] }] },
        },
      ],
      1,
    );

    expect(usingDish.map((pkg) => pkg.name)).toEqual(["Kit Fitness"]);
  });

  it("formats extra price and included option labels clearly", () => {
    expect(formatPackageOptionPriceLabel(0)).toBe("incluso");
    expect(formatPackageOptionPriceLabel(4.9)).toBe("+R$ 4,90");
  });
});
