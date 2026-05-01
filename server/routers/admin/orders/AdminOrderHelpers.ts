import { decrypt, encrypt } from "../../../encryption.js";
import crypto from "crypto";
import { safeJsonParse } from "../../../lib/safe-parse.js";

/**
 * Descriptografa valores vindos do banco de dados.
 * Se o valor for nulo ou a descriptografia falhar, retorna uma string segura.
 */
export const unseal = (val: unknown): string => {
  if (!val) return "";
  const str = String(val).trim();
  try {
    // Verifica se a string tem os 3 componentes da nossa criptografia (iv:authTag:content)
    if (str.split(':').length === 3) {
      const decrypted = decrypt(str);
      // ✅ CORREÇÃO: Garante que se o decrypt retornar null, entregamos uma string
      return decrypted ?? str; 
    }
    return str;
  } catch {
    return str;
  }
};

/**
 * Gera um ID de pedido amigável no formato GS-YYMM-XXX
 */
export function generateFriendlyOrderId(): string {
  const date = new Date();
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = crypto.randomBytes(2).toString('hex').slice(0, 3).toUpperCase();
  return `GS-${year}${month}-${random}`;
}

/**
 * Limpa o JSON de metadados do rascunho para salvar no banco.
 */
export const processDraftMetadata = (metadataJson: string): string => {
  try {
    const data = safeJsonParse<Record<string, unknown>>(metadataJson, {});

    const fieldsToRemove = [
      'paymentMethod', 'notes', 'deliveryMode', 'couponCode', 
      'couponValue', 'loyaltyPointsUsed', 'loyaltyValue', 
      'discountSource', 'currentStep', 'discountValue', 'shippingValue',
      'paymentDiscountValue'
    ];
    fieldsToRemove.forEach(field => delete data[field]);

    // ✅ Tipagem robusta para a função interna de criptografia
    const encryptFields = (obj: Record<string, unknown> | undefined, fields: string[]) => {
      if (!obj) return;
      fields.forEach(f => { 
        if (obj[f]) obj[f] = encrypt(String(obj[f])); 
      });
    };

    if (data.customer) encryptFields(data.customer as Record<string, unknown>, ['name', 'phone']);
    if (data.address) {
      encryptFields(data.address as Record<string, unknown>, [
        'shipping_address', 'shipping_address_number', 'shipping_neighborhood', 
        'shipping_address_complement', 'zipCode', 'shipping_city', 'shipping_state'
      ]); // ✅ FIX: Padronizado para zipCode para casar com o restante do fluxo
    }

    return JSON.stringify(data);
  } catch (error) {
    console.error("Erro ao processar metadata do rascunho:", error);
    return metadataJson;
  }
};
