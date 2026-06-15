/**
 * server/finance/fiscalXml.ts
 *
 * Parser puro de XML fiscal (NF-e/NFC-e) usando expressões regulares.
 * Imune a ataques de XXE por não utilizar parser XML nativo com DTD ou entidades externas.
 */

export interface FiscalXmlParseResult {
  document: {
    type: "nfe" | "nfce" | "unknown";
    accessKey: string;
    number: string;
    series: string;
    issuedAt: Date | null;
    totalAmount: number;
  };
  supplier: {
    name: string;
    cnpj: string;
    stateRegistration?: string;
    city?: string;
    state?: string;
  };
  items: Array<{
    lineNumber: number;
    code: string;
    ean?: string;
    description: string;
    ncm?: string;
    cfop?: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totals: {
    productsTotal: number;
    invoiceTotal: number;
    discountTotal: number;
    freightTotal: number;
    otherTotal: number;
  };
}

/**
 * Extrai o conteúdo interno de uma tag específica de forma tolerante a namespaces.
 */
export function extractTagContent(xml: string, tagName: string): string {
  if (!xml) return "";
  const regex = new RegExp(`<([a-zA-Z0-9_-]+:)?${tagName}\\b[^>]*>([\\s\\S]*?)<\\/\\1?${tagName}>`, "i");
  const match = xml.match(regex);
  return match ? match[2].trim() : "";
}

/**
 * Extrai todas as ocorrências de blocos de uma determinada tag de forma tolerante a namespaces.
 */
export function extractAllTags(xml: string, tagName: string): string[] {
  if (!xml) return [];
  const regex = new RegExp(`<([a-zA-Z0-9_-]+:)?${tagName}\\b[^>]*>([\\s\\S]*?)<\\/\\1?${tagName}>`, "gi");
  const results: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[2].trim());
  }
  return results;
}

/**
 * Converte com segurança uma string numérica com ponto ou vírgula decimal para number.
 */
export function parseFiscalNumber(val: string): number {
  if (!val) return 0;
  const normalized = val.replace(",", ".").trim();
  const parsed = parseFloat(normalized);
  return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
}

/**
 * Converte a string de data do XML para Date ou null.
 * Suporta formatos YYYY-MM-DD e YYYY-MM-DDTHH:MM:SS-HH:MM (ISO 8601).
 */
export function parseFiscalDate(val: string): Date | null {
  if (!val) return null;
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Analisa e extrai informações estruturadas de uma string XML fiscal.
 */
export function parseFiscalXml(xmlContent: string): FiscalXmlParseResult {
  if (!xmlContent) {
    throw new Error("XML vazio.");
  }

  // Validação de tamanho máximo (2MB = 2.097.152 caracteres)
  if (xmlContent.length > 2097152) {
    throw new Error("O tamanho do XML excede o limite máximo permitido de 2MB.");
  }

  // Sanitização simples
  const xml = xmlContent.trim();

  // Verificar se parece XML
  if (!xml.startsWith("<") && !xml.includes("<")) {
    throw new Error("Conteúdo do arquivo não parece ser um XML válido.");
  }

  // Verificar se tem a tag principal da NFe
  if (!xml.includes("<infNFe") && !xml.includes("<NFe") && !xml.includes("infNFe")) {
    throw new Error("O arquivo XML fornecido não é um documento fiscal NF-e ou NFC-e válido.");
  }

  // 1. Extração da Chave de Acesso (Id de infNFe, ex: Id="NFe35221000123456789012550010000001231000000123")
  const infNFeMatch = xml.match(/<(?:[a-zA-Z0-9_-]+:)?infNFe\b[^>]*\bId=["'](?:NFe)?(\d{44})["']/i);
  const accessKey = infNFeMatch ? infNFeMatch[1] : "";
  if (!accessKey || accessKey.length !== 44) {
    throw new Error("Chave de acesso fiscal não encontrada ou malformada no XML.");
  }

  // 2. Extração dos dados do Bloco ide (Identificação)
  const ideBlock = extractTagContent(xml, "ide");
  const number = extractTagContent(ideBlock, "nNF");
  const series = extractTagContent(ideBlock, "serie");
  const model = extractTagContent(ideBlock, "mod");
  
  // Data de emissão (dhEmi em NFe v3.10+, dEmi em NFe antiga)
  let dateStr = extractTagContent(ideBlock, "dhEmi");
  if (!dateStr) {
    dateStr = extractTagContent(ideBlock, "dEmi");
  }
  const issuedAt = parseFiscalDate(dateStr);

  const docType = model === "55" ? "nfe" : model === "65" ? "nfce" : "unknown";

  // 3. Extração dos dados do Emitente (Fornecedor)
  const emitBlock = extractTagContent(xml, "emit");
  if (!emitBlock) {
    throw new Error("Bloco do emitente (emit) não encontrado no XML.");
  }
  const supplierName = extractTagContent(emitBlock, "xNome");
  const supplierCnpj = extractTagContent(emitBlock, "CNPJ");
  const supplierIe = extractTagContent(emitBlock, "IE");

  // Endereço do emitente para Cidade/Estado
  const enderEmitBlock = extractTagContent(emitBlock, "enderEmit");
  const supplierCity = extractTagContent(enderEmitBlock, "xMun");
  const supplierState = extractTagContent(enderEmitBlock, "UF");

  if (!supplierName) {
    throw new Error("Nome do fornecedor não encontrado no XML.");
  }
  if (!supplierCnpj) {
    throw new Error("CNPJ do fornecedor não encontrado no XML.");
  }

  // 4. Extração dos Totais
  const totalBlock = extractTagContent(xml, "total");
  const icmsTotBlock = extractTagContent(totalBlock, "ICMSTot");
  
  const productsTotal = parseFiscalNumber(extractTagContent(icmsTotBlock, "vProd"));
  const invoiceTotal = parseFiscalNumber(extractTagContent(icmsTotBlock, "vNF"));
  const discountTotal = parseFiscalNumber(extractTagContent(icmsTotBlock, "vDesc"));
  const freightTotal = parseFiscalNumber(extractTagContent(icmsTotBlock, "vFrete"));
  const otherTotal = parseFiscalNumber(extractTagContent(icmsTotBlock, "vOutro"));

  // 5. Extração dos Itens
  // Localiza blocos <det nItem="...">
  const detBlocks = extractAllTags(xml, "det");
  if (detBlocks.length === 0) {
    throw new Error("Nenhum item de produto (det) encontrado no XML.");
  }

  const items = detBlocks.map((detXml, index) => {
    const prodBlock = extractTagContent(detXml, "prod");
    if (!prodBlock) {
      throw new Error(`Dados do produto ausentes no item de índice ${index + 1}.`);
    }

    const code = extractTagContent(prodBlock, "cProd");
    const ean = extractTagContent(prodBlock, "cEAN");
    const description = extractTagContent(prodBlock, "xProd");
    const ncm = extractTagContent(prodBlock, "NCM");
    const cfop = extractTagContent(prodBlock, "CFOP");
    const unit = extractTagContent(prodBlock, "uCom");
    const quantity = parseFiscalNumber(extractTagContent(prodBlock, "qCom"));
    const unitPrice = parseFiscalNumber(extractTagContent(prodBlock, "vUnCom"));
    const totalPrice = parseFiscalNumber(extractTagContent(prodBlock, "vProd"));

    return {
      lineNumber: index + 1,
      code,
      ean: ean && ean !== "SEM GTIN" ? ean : undefined,
      description,
      ncm: ncm || undefined,
      cfop: cfop || undefined,
      unit,
      quantity,
      unitPrice,
      totalPrice,
    };
  });

  return {
    document: {
      type: docType,
      accessKey,
      number,
      series,
      issuedAt,
      totalAmount: invoiceTotal || productsTotal, // se totalInvoice for 0, fallback totalProdutos
    },
    supplier: {
      name: supplierName,
      cnpj: supplierCnpj,
      stateRegistration: supplierIe || undefined,
      city: supplierCity || undefined,
      state: supplierState || undefined,
    },
    items,
    totals: {
      productsTotal,
      invoiceTotal: invoiceTotal || productsTotal,
      discountTotal,
      freightTotal,
      otherTotal,
    },
  };
}
