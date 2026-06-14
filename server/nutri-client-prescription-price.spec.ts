import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readSource(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Nutri Client Prescription Pricing & Discount Contract", () => {
  it("1. usePrescriptionLogic hook mapper preserves originalPrice and price details", () => {
    const source = readSource(
      "client/src/pages/nutriprescription/hooks/usePrescriptionLogic.ts",
    );

    // Assert that the mapper parses and defines originalPrice and priceAtCreation (both camelCase and snake_case)
    expect(source).toContain("originalPrice");
    expect(source).toContain("original_price");
    expect(source).toContain("priceAtCreation");
    expect(source).toContain("price_at_creation");
    expect(source).toContain("fixedPrice");
    expect(source).toContain("fixed_price");
    expect(source).toContain("basePrice");
    expect(source).toContain("base_price");
    expect(source).toContain("discountPercentage");
    expect(source).toContain("discount_percentage");
    expect(source).toContain("finalPrice");
    expect(source).toContain("final_price");
    expect(source).toContain("discountedPrice");
    expect(source).toContain("discounted_price");
    expect(source).toContain("hasNutriDiscount");
  });

  it("2. usePrescriptionLogic hook mapper applies correct discount percentage hierarchy", () => {
    const source = readSource(
      "client/src/pages/nutriprescription/hooks/usePrescriptionLogic.ts",
    );
    expect(source).toContain("discountPercentage = Number(");
    expect(source).toContain("p.discountPercentage ??");
    expect(source).toContain("p.discount_percentage ??");
    expect(source).toContain("raw.discountPercentage ??");
    expect(source).toContain("raw.discount_percentage ??");
  });

  it("3. usePrescriptionLogic hook mapper calculates finalPrice and hasNutriDiscount flag correctly", () => {
    const source = readSource(
      "client/src/pages/nutriprescription/hooks/usePrescriptionLogic.ts",
    );
    expect(source).toContain("finalPrice = Number(");
    expect(source).toContain("hasNutriDiscount = discountPercentage > 0 && finalPrice < originalPrice");
  });

  it("4. OptionCard component receives and handles pricing inputs cleanly", () => {
    const source = readSource(
      "client/src/pages/nutriprescription/components/OptionCard.tsx",
    );

    expect(source).toContain("hasDiscount =");
    expect(source).toContain("finalPriceVal =");
    expect(source).toContain("originalPriceVal =");
    expect(source).toContain("discountPct =");
    expect(source).toContain("hasPrice =");
  });

  it("5. OptionCard component formats currencies with pt-BR BRL helper", () => {
    const source = readSource(
      "client/src/pages/nutriprescription/components/OptionCard.tsx",
    );

    expect(source).toContain("Intl.NumberFormat(\"pt-BR\"");
    expect(source).toContain("currency: \"BRL\"");
  });

  it("6. OptionCard component displays discount details when there is a discount", () => {
    const source = readSource(
      "client/src/pages/nutriprescription/components/OptionCard.tsx",
    );

    expect(source).toContain("hasDiscount ?");
    expect(source).toContain("De");
    expect(source).toContain("Por");
    expect(source).toContain("OFF");
    expect(source).toContain("Desconto Nutri aplicado automaticamente");
  });

  it("7. OptionCard component displays normal prices and handles fallback when no price is available", () => {
    const source = readSource(
      "client/src/pages/nutriprescription/components/OptionCard.tsx",
    );

    expect(source).toContain("!hasPrice ?");
    expect(source).toContain("Preço será confirmado no carrinho");
    // Ensure we do not display "Valor da prescrição." together with the fallback
    expect(source).not.toContain('!hasPrice ? (\n                    <div className="flex flex-col text-left gap-0.5">\n                        <span className="text-[10px] font-bold text-slate-500 leading-tight">\n                            Preço será confirmado no carrinho\n                        </span>\n                        <span className="text-[8px] font-semibold text-slate-400">\n                            Valor da prescrição.\n                        </span>\n                    </div>');
  });
});
