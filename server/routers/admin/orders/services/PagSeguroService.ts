// server/routers/admin/orders/services/PagSeguroService.ts

import axios from 'axios';
import { safeNumber } from "../../../../lib/safe-parse.js";

const PAGSEGURO_TOKEN = process.env.PAGSEGURO_TOKEN;
const API_URL = 'https://api.pagseguro.com/checkouts'; // Sandbox ou Produção

// ✅ Interface para os dados do pedido esperados pelo serviço
export interface PagSeguroOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  total: number | string;
}

// ✅ Interface para a estrutura de links retornada pelo PagSeguro
interface PagSeguroLink {
  rel: string;
  href: string;
}

export const PagSeguroService = {
  async createPaymentLink(order: PagSeguroOrder) {
    const payload = {
      reference_id: order.id,
      customer: {
        name: order.customerName, // Lembre-se de descriptografar antes de enviar
        phone: { number: order.customerPhone.replace(/\D/g, "") }
      },
      items: [
        {
          reference_id: "PEDIDO_" + order.id,
          name: "Pedido Gourmet Saudável",
          quantity: 1,
          unit_amount: Math.round(safeNumber(order.total) * 100) // PagSeguro usa centavos (inteiro)
        }
      ],
      payment_methods: [
        { type: "CREDIT_CARD" },
        { type: "PIX" },
        { type: "BOLETO" }
      ],
      redirect_url: "https://gourmetsaudavel.com/meus-pedidos",
    };

    const response = await axios.post(API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${PAGSEGURO_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // ✅ Uso da interface PagSeguroLink no lugar de 'any'
    return response.data.links.find((l: PagSeguroLink) => l.rel === 'PAY')?.href;
  }
};
