import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { userAddresses } from "drizzle/schema/index.js"; 

// Alias constante para manter o código limpo e evitar conflitos de nomes
const addresses = userAddresses;

interface AddressOptions {
  shippingType: "delivery" | "pickup";
  addressId: string | null; 
}

/**
 * 📍 Carrega e formata o endereço para o "Snapshot" do pedido.
 * tx: Instância de transação do Drizzle
 */
export async function loadAddressSnapshot(tx: any, opts: AddressOptions, userId: string | null) {
  // 1. Caso: Retirada no Local
  if (opts.shippingType === "pickup") {
    return {
      type: "pickup",
      text: "Retirada no Local / Balcão",
      zipCode: null
    };
  }

  // 2. Validação: Entrega exige um ID de endereço
  if (!opts.addressId) {
    throw new TRPCError({ 
      code: "BAD_REQUEST", 
      message: "Endereço de entrega não selecionado." 
    });
  }

  // 3. Busca no banco de dados
  // Criamos os filtros dinamicamente para evitar passar 'undefined' para o Drizzle
  const filters = [eq(addresses.id, opts.addressId)];
  if (userId) {
    filters.push(eq(addresses.userId, userId));
  }

  const [addr] = await tx
    .select()
    .from(addresses)
    .where(and(...filters))
    .limit(1);

  if (!addr) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Endereço não encontrado ou acesso negado.",
    });
  }

  /**
   * ✅ Retorno do Snapshot Imutável
   * Isso será salvo como JSON na tabela de pedidos (orders).
   */
  return {
    type: "delivery",
    id: addr.id,
    // Texto formatado para exibição rápida em relatórios e notas fiscais
    text: `${addr.street}, ${addr.number}${addr.complement ? ` (${addr.complement})` : ""} - ${addr.neighborhood}, ${addr.city}/${addr.state}`,
    zipCode: addr.zipCode,
    city: addr.city,
    state: addr.state,
    number: addr.number,
    neighborhood: addr.neighborhood,
    street: addr.street,
    complement: addr.complement
  };
}