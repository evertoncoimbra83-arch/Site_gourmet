// server/email.ts
import { Resend } from 'resend';

// O Resend lerá automaticamente a chave do teu .env
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderEmail(to: string, data: any) {
  try {
    await resend.emails.send({
      from: 'Gourmet Saudável <pedidos@seudominio.com.br>', // Quando tiveres domínio próprio, alteras aqui
      to: [to],
      subject: `Pedido #${data.orderId} Confirmado! 🥗`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;">
          <h1 style="color: #059669; text-align: center;">Pedido Recebido!</h1>
          <p style="font-size: 16px;">Olá! Já recebemos o teu pedido <strong>#${data.orderId}</strong> e a nossa equipa já está a preparar tudo com ingredientes frescos.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Resumo Financeiro</p>
            <p style="margin: 10px 0 0 0; font-size: 20px;">Total: <strong>R$ ${data.total}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 16px; color: #059669;">Recompensa: <strong>+${data.pointsEarned} pontos de fidelidade</strong></p>
          </div>

          <p style="font-size: 14px; color: #64748b;">Podes acompanhar o status do teu pedido diretamente no teu painel de cliente.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">Gourmet Saudável - Comida de verdade para o teu dia a dia.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    // Não bloqueamos o processo do pedido se o e-mail falhar
  }
}