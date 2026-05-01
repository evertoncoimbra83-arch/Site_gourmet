export async function sendAdminNotification(orderId: string, total: number) {
  const appId = "SEU_APP_ID";
  const apiKey = "SUA_REST_API_KEY_SECRETA"; // Encontre em Settings > Keys & IDs

  const response = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": `Basic ${apiKey}`
    },
    body: JSON.stringify({
      app_id: appId,
      included_segments: ["All"], // Ou crie um segmento só para Admins no painel
      headings: { en: "💰 Nova Venda!" },
      contents: { en: `Pedido #${orderId} no valor de R$ ${total.toFixed(2)}` },
      url: "https://seu-site.com.br/admin/orders" // Abre direto nos pedidos
    })
  });

  return response.json();
}