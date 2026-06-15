import { describe, it, expect } from "vitest";
import { sanitizeZplText, cleanText, escapeZplChars } from "./zplEscaping";
import { isLocalPrintTransportAllowed, validateZplPayload } from "./transportGuards";
import { mapToLabelDataContract, normalizeLabelData } from "./labelDataContract";
import { generateZPLForBatch } from "./generator";
import type { PrintLabelElement } from "./templates";

describe("Sprint Zebra - Fase 1 - Contratos, Escaping e Guards", () => {
  describe("ZPL Escaping & Sanitization (zplEscaping.ts)", () => {
    it("deve limpar acentuação corrompida comum (cleanText)", () => {
      expect(cleanText("Ã§")).toBe("ç");
      expect(cleanText("Ã£")).toBe("ã");
      expect(cleanText("Ã©")).toBe("é");
      expect(cleanText("Â")).toBe("");
      expect(cleanText("null")).toBe("");
      expect(cleanText("undefined")).toBe("");
      expect(cleanText(null)).toBe("");
    });

    it("deve escapar caracteres sintáticos e formatar quebras de linha (escapeZplChars)", () => {
      // caret -> _5E, tilde -> _7E, backslash -> _5C, newline -> \\&
      const rawText = "Linha1\nCaret^ Tilde~ Barra\\fim";
      const escaped = escapeZplChars(rawText);
      expect(escaped).toBe("Linha1\\&Caret_5E Tilde_7E Barra_5Cfim");
    });

    it("deve remover caracteres de controle invisíveis", () => {
      const controlText = "Texto\u0000com\u0007controles\u007F";
      const escaped = escapeZplChars(controlText);
      expect(escaped).toBe("Texto com controles ");
    });

    it("deve truncar strings longas de forma segura (sanitizeZplText)", () => {
      const longText = "a".repeat(1100);
      const sanitized = sanitizeZplText(longText, 50);
      expect(sanitized.length).toBe(53); // 50 caracteres + "..."
      expect(sanitized.endsWith("...")).toBe(true);
    });
  });

  describe("Contrato de Dados da Etiqueta (labelDataContract.ts)", () => {
    it("deve normalizar valores nulos ou ausentes para strings vazias e zeros", () => {
      const normalized = normalizeLabelData({
        dishName: undefined,
        customerName: undefined,
        nutrition: undefined,
      });

      expect(normalized.dishName).toBe("");
      expect(normalized.customerName).toBe("");
      expect(normalized.nutrition.kcal).toBe(0);
      expect(normalized.nutrition.carbs).toBe(0);
    });

    it("deve mapear corretamente dados planos e de pedidos para o contrato único", () => {
      const flatLabel = {
        mainDishName: "Frango com Batata Doce",
        accompaniments: ["Arroz Integral", "Legumes"],
        sizeName: "M",
        combinedIngredients: "Peito de frango, batata doce, sal.",
        nutrition: {
          energyKcal: 450,
          carbs: 45,
          proteins: 35,
          fatTotal: 10,
        },
      };

      const order = {
        id: "ord_123456",
        customerName: "Maria Souza",
      };

      const contract = mapToLabelDataContract(flatLabel, order, 90, 2, 5);

      expect(contract.dishName).toBe("Frango com Batata Doce");
      expect(contract.customerName).toBe("Maria Souza");
      expect(contract.sizeName).toBe("M");
      expect(contract.ingredients).toBe("Peito de frango, batata doce, sal.");
      expect(contract.accompaniments).toContain("Arroz Integral");
      expect(contract.accompaniments).toContain("Legumes");
      expect(contract.itemIndex).toBe(2);
      expect(contract.totalItems).toBe(5);
      expect(contract.orderId).toBe("ord_123456");
      expect(contract.barcodeValue).toBe("ord_123456");
      expect(contract.nutrition.kcal).toBe(450);
      expect(contract.nutrition.carbs).toBe(45);
      expect(contract.nutrition.proteins).toBe(35);
      expect(contract.nutrition.fats).toBe(10);
    });
  });

  describe("Transport Guards & Loopback (transportGuards.ts)", () => {
    it("deve permitir localhost loopback em desenvolvimento", () => {
      expect(isLocalPrintTransportAllowed({ hostname: "localhost", isDev: true })).toBe(true);
      expect(isLocalPrintTransportAllowed({ hostname: "127.0.0.1", isDev: true })).toBe(true);
      expect(isLocalPrintTransportAllowed({ hostname: "10.0.0.5", isDev: true })).toBe(true); // Dev permite qualquer
    });

    it("deve permitir estritamente localhost loopback em produção", () => {
      expect(isLocalPrintTransportAllowed({ hostname: "localhost", isDev: false })).toBe(true);
      expect(isLocalPrintTransportAllowed({ hostname: "127.0.0.1", isDev: false })).toBe(true);
      expect(isLocalPrintTransportAllowed({ hostname: "[::1]", isDev: false })).toBe(true);
      expect(isLocalPrintTransportAllowed({ hostname: "::1", isDev: false })).toBe(true);
    });

    it("deve bloquear hosts remotos em produção", () => {
      expect(isLocalPrintTransportAllowed({ hostname: "gourmet.example.com", isDev: false })).toBe(false);
      expect(isLocalPrintTransportAllowed({ hostname: "192.168.1.50", isDev: false })).toBe(false);
    });

    it("deve bloquear protocolos inseguros não-locais", () => {
      expect(
        isLocalPrintTransportAllowed({
          hostname: "gourmet.example.com",
          isDev: false,
          protocol: "http:",
        })
      ).toBe(false);
      expect(
        isLocalPrintTransportAllowed({
          hostname: "localhost",
          isDev: false,
          protocol: "http:",
        })
      ).toBe(true);
    });

    it("deve validar payloads ZPL vazios ou excedendo o limite de tamanho", () => {
      expect(validateZplPayload("").isValid).toBe(false);
      expect(validateZplPayload("   ").isValid).toBe(false);
      expect(validateZplPayload("a".repeat(500 * 1024 + 1)).isValid).toBe(false);
      expect(validateZplPayload("^XA^XZ").isValid).toBe(true);
    });
  });

  describe("ZPL Batch Generation Snapshots (generator.ts)", () => {
    const layoutElements: PrintLabelElement[] = [
      {
        id: "el_1",
        type: "text",
        content: "{{NOME_PRATO}}",
        x: 10,
        y: 10,
        width: 80,
        height: 10,
        fontSize: 12,
        fontWeight: "bold",
        zIndex: 1,
        textAlign: "center",
      },
      {
        id: "el_2",
        type: "text",
        content: "{{CLIENTE}}",
        x: 10,
        y: 25,
        width: 80,
        height: 10,
        fontSize: 10,
        fontWeight: "normal",
        zIndex: 1,
      },
      {
        id: "el_3",
        type: "text",
        content: "{{INGREDIENTES}}",
        x: 10,
        y: 40,
        width: 80,
        height: 20,
        fontSize: 8,
        fontWeight: "normal",
        zIndex: 1,
      },
    ];

    it("deve gerar ZPL correto para payload completo", () => {
      const contract = normalizeLabelData({
        dishName: "Lasanha de Berinjela",
        customerName: "João Da Silva",
        ingredients: "Berinjela, molho de tomate, queijo.",
      });

      const zpl = generateZPLForBatch(
        layoutElements,
        100,
        60,
        [contract],
        (content, idx, el) => {
          if (content === "{{NOME_PRATO}}") return contract.dishName;
          if (content === "{{CLIENTE}}") return contract.customerName;
          if (content === "{{INGREDIENTES}}") return contract.ingredients;
          return "";
        }
      );

      // Verificações estruturais
      expect(zpl.startsWith("^XA")).toBe(true);
      expect(zpl.endsWith("^XZ\n\n")).toBe(true);
      expect(zpl).toContain("Lasanha de Berinjela");
      expect(zpl).toContain("João Da Silva");
      expect(zpl).not.toContain("undefined");
      expect(zpl).not.toContain("null");
      expect(zpl).not.toContain("{{NOME_PRATO}}");

      // Snapshot estrutural
      expect(zpl).toMatchSnapshot();
    });

    it("deve escapar carets e tildes e injetar quebras de linha corretamente", () => {
      const contract = normalizeLabelData({
        dishName: "Frango ^Especial~",
        customerName: "Ana\\Maria",
        ingredients: "Linha 1\nLinha 2",
      });

      const zpl = generateZPLForBatch(
        layoutElements,
        100,
        60,
        [contract],
        (content, idx, el) => {
          if (content === "{{NOME_PRATO}}") return contract.dishName;
          if (content === "{{CLIENTE}}") return contract.customerName;
          if (content === "{{INGREDIENTES}}") return contract.ingredients;
          return "";
        }
      );

      expect(zpl).toContain("Frango _5EEspecial_7E");
      expect(zpl).toContain("Ana_5CMaria");
      expect(zpl).toContain("Linha 1\\&Linha 2");
      expect(zpl).toMatchSnapshot();
    });
  });
});
