import { describe, it, expect } from "vitest";
import { parseFiscalXml, parseFiscalNumber, parseFiscalDate } from "./fiscalXml";

describe("Sprint Financeira - Fase 2E - fiscalXml.ts (Parser XML Fiscal)", () => {
  describe("parseFiscalNumber", () => {
    it("deve converter string com ponto ou vírgula decimal", () => {
      expect(parseFiscalNumber("10.50")).toBe(10.5);
      expect(parseFiscalNumber("10,50")).toBe(10.5);
      expect(parseFiscalNumber("1000")).toBe(1000);
    });

    it("deve retornar 0 para valores inválidos", () => {
      expect(parseFiscalNumber("")).toBe(0);
      expect(parseFiscalNumber(null as any)).toBe(0);
      expect(parseFiscalNumber("abc")).toBe(0);
      expect(parseFiscalNumber("NaN")).toBe(0);
      expect(parseFiscalNumber("Infinity")).toBe(0);
    });
  });

  describe("parseFiscalDate", () => {
    it("deve converter string de data válida", () => {
      expect(parseFiscalDate("2026-06-15")?.toISOString().substring(0, 10)).toBe("2026-06-15");
      expect(parseFiscalDate("2026-06-15T14:30:00-03:00")?.getFullYear()).toBe(2026);
    });

    it("deve retornar null para datas inválidas", () => {
      expect(parseFiscalDate("")).toBeNull();
      expect(parseFiscalDate("data-invalida")).toBeNull();
    });
  });

  describe("parseFiscalXml", () => {
    it("deve lançar erro se o XML for vazio", () => {
      expect(() => parseFiscalXml("")).toThrow("XML vazio.");
    });

    it("deve lançar erro se o tamanho do XML for maior que 2MB", () => {
      const hugeXml = "<NFe>" + "A".repeat(2097152) + "</NFe>";
      expect(() => parseFiscalXml(hugeXml)).toThrow("O tamanho do XML excede o limite máximo permitido de 2MB.");
    });

    it("deve lançar erro se não parecer um XML", () => {
      expect(() => parseFiscalXml("isso nao eh xml")).toThrow("Conteúdo do arquivo não parece ser um XML válido.");
    });

    it("deve lançar erro se não possuir a tag infNFe ou NFe", () => {
      const badXml = "<root><tag>teste</tag></root>";
      expect(() => parseFiscalXml(badXml)).toThrow("O arquivo XML fornecido não é um documento fiscal NF-e ou NFC-e válido.");
    });

    it("deve lançar erro se a chave de acesso (infNFe Id) não tiver 44 dígitos", () => {
      const xmlWithoutId = `
        <NFe>
          <infNFe>
            <ide><nNF>123</nNF></ide>
          </infNFe>
        </NFe>
      `;
      expect(() => parseFiscalXml(xmlWithoutId)).toThrow("Chave de acesso fiscal não encontrada ou malformada no XML.");
    });

    it("deve parsear corretamente um XML de NF-e válido com item único", () => {
      const mockXml = `
        <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
          <NFe>
            <infNFe Id="NFe35260612345678000199550010000001231000000123">
              <ide>
                <mod>55</mod>
                <serie>1</serie>
                <nNF>12345</nNF>
                <dhEmi>2026-06-15T14:30:00-03:00</dhEmi>
              </ide>
              <emit>
                <CNPJ>12345678000199</CNPJ>
                <xNome>DISTRIBUIDORA DE ALIMENTOS LTDA</xNome>
                <IE>111222333444</IE>
                <enderEmit>
                  <xMun>SAO PAULO</xMun>
                  <UF>SP</UF>
                </enderEmit>
              </emit>
              <det nItem="1">
                <prod>
                  <cProd>ING-001</cProd>
                  <cEAN>7891234567890</cEAN>
                  <xProd>PEITO DE FRANGO CONGELADO SEARA</xProd>
                  <NCM>02071400</NCM>
                  <CFOP>5102</CFOP>
                  <uCom>KG</uCom>
                  <qCom>15.0000</qCom>
                  <vUnCom>18.9000</vUnCom>
                  <vProd>283.50</vProd>
                </prod>
              </det>
              <total>
                <ICMSTot>
                  <vProd>283.50</vProd>
                  <vNF>283.50</vNF>
                  <vDesc>0.00</vDesc>
                  <vFrete>15.00</vFrete>
                  <vOutro>2.50</vOutro>
                </ICMSTot>
              </total>
            </infNFe>
          </NFe>
        </nfeProc>
      `;

      const result = parseFiscalXml(mockXml);

      expect(result.document.type).toBe("nfe");
      expect(result.document.accessKey).toBe("35260612345678000199550010000001231000000123");
      expect(result.document.number).toBe("12345");
      expect(result.document.series).toBe("1");
      expect(result.document.issuedAt?.toISOString().substring(0, 10)).toBe("2026-06-15");
      expect(result.document.totalAmount).toBe(283.5);

      expect(result.supplier.name).toBe("DISTRIBUIDORA DE ALIMENTOS LTDA");
      expect(result.supplier.cnpj).toBe("12345678000199");
      expect(result.supplier.stateRegistration).toBe("111222333444");
      expect(result.supplier.city).toBe("SAO PAULO");
      expect(result.supplier.state).toBe("SP");

      expect(result.items.length).toBe(1);
      const item = result.items[0];
      expect(item.lineNumber).toBe(1);
      expect(item.code).toBe("ING-001");
      expect(item.ean).toBe("7891234567890");
      expect(item.description).toBe("PEITO DE FRANGO CONGELADO SEARA");
      expect(item.ncm).toBe("02071400");
      expect(item.cfop).toBe("5102");
      expect(item.unit).toBe("KG");
      expect(item.quantity).toBe(15);
      expect(item.unitPrice).toBe(18.9);
      expect(item.totalPrice).toBe(283.5);

      expect(result.totals.productsTotal).toBe(283.5);
      expect(result.totals.invoiceTotal).toBe(283.5);
      expect(result.totals.discountTotal).toBe(0);
      expect(result.totals.freightTotal).toBe(15);
      expect(result.totals.otherTotal).toBe(2.5);
    });

    it("deve parsear corretamente múltiplos itens e NFC-e", () => {
      const mockXml = `
        <NFe>
          <infNFe Id="35260612345678000199650010000001231000000123">
            <ide>
              <mod>65</mod>
              <serie>2</serie>
              <nNF>999</nNF>
              <dEmi>2026-06-14</dEmi>
            </ide>
            <emit>
              <CNPJ>98765432000100</CNPJ>
              <xNome>SUPERMERCADO LOCAL</xNome>
            </emit>
            <det nItem="1">
              <prod>
                <cProd>10</cProd>
                <cEAN>SEM GTIN</cEAN>
                <xProd>BATATA IN NATURA</xProd>
                <uCom>kg</uCom>
                <qCom>5</qCom>
                <vUnCom>4.50</vUnCom>
                <vProd>22.50</vProd>
              </prod>
            </det>
            <det nItem="2">
              <prod>
                <cProd>20</cProd>
                <xProd>CEBOLA NACIONAL</xProd>
                <uCom>un</uCom>
                <qCom>10</qCom>
                <vUnCom>1.20</vUnCom>
                <vProd>12.00</vProd>
              </prod>
            </det>
            <total>
              <ICMSTot>
                <vProd>34.50</vProd>
                <vNF>34.50</vNF>
              </ICMSTot>
            </total>
          </infNFe>
        </NFe>
      `;

      const result = parseFiscalXml(mockXml);

      expect(result.document.type).toBe("nfce");
      expect(result.document.accessKey).toBe("35260612345678000199650010000001231000000123");
      expect(result.document.number).toBe("999");
      expect(result.document.series).toBe("2");
      expect(result.document.issuedAt?.toISOString().substring(0, 10)).toBe("2026-06-14");

      expect(result.supplier.name).toBe("SUPERMERCADO LOCAL");
      expect(result.supplier.cnpj).toBe("98765432000100");

      expect(result.items.length).toBe(2);
      expect(result.items[0].description).toBe("BATATA IN NATURA");
      expect(result.items[0].ean).toBeUndefined(); // SEM GTIN deve ser ignorado
      expect(result.items[1].description).toBe("CEBOLA NACIONAL");
    });
  });
});
