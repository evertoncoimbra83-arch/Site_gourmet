import { describe, it, expect } from "vitest";
import {
  extractNfceAccessKey,
  validateNfceAccessKey,
  maskNfceAccessKey,
  detectNfceStateFromUrl,
} from "./nfceQr.js";

// -------------------------------------------------------------------
// Chaves reais de teste (geradas com DV válido via Módulo 11)
// -------------------------------------------------------------------
// Chave válida construída manualmente:
//   UF=35 AAMM=2606 CNPJ=12345678000195 mod=65 serie=001 num=000000001 tpEmis=1 cNF=00000001
//   Base 43 dígitos: 3526061234567800019565001000000001100000001
//   DV calculado via Mod11 = 3
const VALID_KEY =
  "35260612345678000195650010000000011000000013";

describe("extractNfceAccessKey", () => {
  it("extrai chave pura de 44 dígitos", () => {
    expect(extractNfceAccessKey(VALID_KEY)).toBe(VALID_KEY);
  });

  it("extrai chave com espaços em volta", () => {
    expect(extractNfceAccessKey(`  ${VALID_KEY}  `)).toBe(VALID_KEY);
  });

  it("extrai de URL com parâmetro chNFe (padrão SP)", () => {
    const url = `https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica?chNFe=${VALID_KEY}&nVersao=100`;
    expect(extractNfceAccessKey(url)).toBe(VALID_KEY);
  });

  it("extrai de URL com parâmetro chNFe case-insensitive", () => {
    const url = `https://nfce.fazenda.rj.gov.br/?CHNFE=${VALID_KEY}&foo=bar`;
    expect(extractNfceAccessKey(url)).toBe(VALID_KEY);
  });

  it("extrai de URL com parâmetro p (padrão RS/PR)", () => {
    const url = `https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx?p=${VALID_KEY}|2|1|1|abcdef`;
    expect(extractNfceAccessKey(url)).toBe(VALID_KEY);
  });

  it("extrai chave embutida em texto longo por fallback", () => {
    const text = `A nota fiscal com chave ${VALID_KEY} foi emitida em 15/06/2026.`;
    expect(extractNfceAccessKey(text)).toBe(VALID_KEY);
  });

  it("retorna vazio para entrada vazia", () => {
    expect(extractNfceAccessKey("")).toBe("");
    expect(extractNfceAccessKey("   ")).toBe("");
  });

  it("retorna vazio para texto sem 44 dígitos", () => {
    expect(extractNfceAccessKey("1234567890")).toBe("");
    expect(extractNfceAccessKey("https://google.com")).toBe("");
  });

  it("retorna vazio para 44 caracteres alfanuméricos", () => {
    expect(
      extractNfceAccessKey("ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789012345678"),
    ).toBe("");
  });
});

describe("validateNfceAccessKey", () => {
  it("valida chave de 44 dígitos com DV correto", () => {
    expect(validateNfceAccessKey(VALID_KEY)).toBe(true);
  });

  it("rejeita chave com DV incorreto (último dígito alterado)", () => {
    const lastDigit = parseInt(VALID_KEY[43], 10);
    const wrongDigit = (lastDigit + 1) % 10;
    const badKey = VALID_KEY.substring(0, 43) + wrongDigit.toString();
    expect(validateNfceAccessKey(badKey)).toBe(false);
  });

  it("rejeita string com menos de 44 dígitos", () => {
    expect(validateNfceAccessKey("123456789012345678901234567890123456789012")).toBe(false);
  });

  it("rejeita string com mais de 44 dígitos", () => {
    expect(validateNfceAccessKey(VALID_KEY + "9")).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(validateNfceAccessKey("")).toBe(false);
  });

  it("rejeita string com caracteres alfabéticos de 44 chars", () => {
    expect(
      validateNfceAccessKey("ABCDEFGHIJKLMNOPQRSTUVWXYZ12345678901234567A"),
    ).toBe(false);
  });

  it("não gera NaN ou Infinity", () => {
    const result = validateNfceAccessKey("00000000000000000000000000000000000000000000");
    expect(typeof result).toBe("boolean");
    // Todos zeros: soma = 0, resto = 0, DV = 0, ultimo dígito = 0 → true
    expect(result).toBe(true);
  });
});

describe("maskNfceAccessKey", () => {
  it("mascara chave válida no formato esperado", () => {
    const masked = maskNfceAccessKey(VALID_KEY);
    // Deve conter as partes e '...'
    expect(masked).toContain("...");
    // Formato: "XXXX XXXX ... XXXX XXXX"
    const parts = masked.split(" ... ");
    expect(parts).toHaveLength(2);
    // Primeiro bloco = 2 grupos de 4
    expect(parts[0].split(" ").length).toBe(2);
    // Último bloco = 2 grupos de 4
    expect(parts[1].split(" ").length).toBe(2);
  });

  it("retorna a string intacta se não tiver 44 chars", () => {
    expect(maskNfceAccessKey("1234")).toBe("1234");
    expect(maskNfceAccessKey("")).toBe("");
  });
});

describe("detectNfceStateFromUrl", () => {
  it("detecta SP de URL da SEFAZ-SP", () => {
    expect(
      detectNfceStateFromUrl("https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica"),
    ).toBe("SP");
  });

  it("detecta RS de URL da SEFAZ-RS", () => {
    expect(
      detectNfceStateFromUrl("https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx"),
    ).toBe("RS");
  });

  it("detecta RJ de URL da SEFAZ-RJ", () => {
    expect(
      detectNfceStateFromUrl("https://nfce.fazenda.rj.gov.br/consulta"),
    ).toBe("RJ");
  });

  it("detecta PR de URL da SEFAZ-PR", () => {
    expect(
      detectNfceStateFromUrl("https://www.fazenda.pr.gov.br/nfce"),
    ).toBe("PR");
  });

  it("retorna 'Desconhecido' para URL sem domínio .gov.br de UF", () => {
    expect(detectNfceStateFromUrl("https://google.com")).toBe("Desconhecido");
    expect(detectNfceStateFromUrl("")).toBe("Desconhecido");
  });
});
