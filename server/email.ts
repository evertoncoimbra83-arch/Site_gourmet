// server/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderEmailData {
  customerName: string;
  orderId: string | number;
  total: string | number;
  pointsEarned: number;
}

export async function sendOrderEmail(to: string, data: OrderEmailData) {
  try {
    await resend.emails.send({
      from: 'Gourmet Saudável <pedidos@gourmetsaudavel.com.br>',
      to: [to],
      subject: `Pedido #${data.orderId} Confirmado! 🥗`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;">
          <h1 style="color: #059669; text-align: center;">Pedido Recebido!</h1>
          <p style="font-size: 16px;">Olá, <strong>${data.customerName}</strong>! 👋</p>
          <p style="font-size: 16px;">Já recebemos o seu pedido <strong>#${data.orderId}</strong> e a nossa equipe já está a preparar tudo com ingredientes frescos.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Resumo Financeiro</p>
            <p style="margin: 10px 0 0 0; font-size: 20px;">Total: <strong>R$ ${data.total}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 16px; color: #059669;">Recompensa: <strong>+${data.pointsEarned} pontos de fidelidade</strong></p>
          </div>
          <p style="font-size: 14px; color: #64748b;">Pode acompanhar o status do seu pedido diretamente no seu painel de cliente.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">Gourmet Saudável - Comida de verdade para o seu dia a dia.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Falha ao enviar e-mail de confirmação:", error);
  }
}

// ✅ NOVO: Notifica paciente quando nutricionista cria ou atualiza prescrição
interface PrescriptionEmailData {
  planName: string;
  isNew: boolean;
}

export async function sendPrescriptionEmail(to: string, data: PrescriptionEmailData) {
  try {
    const subject = data.isNew
      ? `Seu plano alimentar está pronto! 🥗`
      : `Seu plano alimentar foi atualizado 🥗`;

    const headline = data.isNew
      ? 'Seu plano alimentar chegou!'
      : 'Seu plano alimentar foi atualizado!';

    const body = data.isNew
      ? `Seu nutricionista acabou de criar o plano <strong>${data.planName}</strong> para você.`
      : `Seu nutricionista atualizou o plano <strong>${data.planName}</strong>.`;

    await resend.emails.send({
      from: 'Gourmet Saudável <nutri@gourmetsaudavel.com.br>',
      to: [to],
      subject,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;">
          <h1 style="color: #059669; text-align: center;">${headline}</h1>
          <p style="font-size: 16px;">${body}</p>
          <p style="font-size: 16px;">Acesse <strong>Meu Plano</strong> no site para ver as refeições prescritas e adicionar ao carrinho com desconto exclusivo.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://gourmetsaudavel.com/meu-plano"
               style="background: #059669; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
              Ver meu plano
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">Gourmet Saudável - Comida de verdade para o seu dia a dia.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Falha ao enviar e-mail de prescrição:", error);
  }
}