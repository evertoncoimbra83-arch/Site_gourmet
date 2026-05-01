import { Resend } from 'resend';

// 1. Configuração da Instância
if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️ RESEND_API_KEY não configurada. E-mails não serão disparados.");
}

export const resend = new Resend(process.env.RESEND_API_KEY || 'fake_key');

// Configuração de Remetente Padrão
export const DEFAULT_FROM_EMAIL = "Gourmet Saudável <contato@gourmetsaudavel.com>";

// Interface para tipar os itens do pedido
interface OrderItem {
  name: string;
  details?: string;
}

/**
 * Interface de Serviço para centralizar todos os disparos SMTP
 */
export const mailer = {
  
  /**
   * ENVIO DE RECUPERAÇÃO DE SENHA
   */
  sendPasswordReset: async (to: string, resetLink: string) => {
    return resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject: "Redefinição de Senha - Gourmet Saudável",
      html: `
        <div style="font-family: sans-serif; color: #334155; max-width: 600px;">
          <h2 style="color: #0f172a;">Recuperação de Senha</h2>
          <p>Você solicitou a alteração de sua senha. Clique no botão abaixo para criar uma nova senha:</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background: #10b981; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Redefinir Senha</a>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">Se você não solicitou esta alteração, ignore este e-mail. O link expira em breve.</p>
        </div>
      `
    });
  },

  /**
   * ENVIO DE CONFIRMAÇÃO DE PEDIDO
   */
  sendOrderConfirmation: async (to: string, orderData: { id: string, customerName: string, items: OrderItem[], total: number }) => {
    return resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject: `Pedido Confirmado #${orderData.id}`,
      html: `
        <div style="font-family: sans-serif; color: #334155; max-width: 600px; border: 1px solid #f1f5f9; padding: 24px; border-radius: 16px;">
          <h1 style="color: #10b981; margin-bottom: 8px;">Pedido Recebido!</h1>
          <p>Olá <strong>${orderData.customerName}</strong>, seu pedido foi confirmado e já entrou na nossa fila de preparo.</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <h3 style="text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em; color: #94a3b8;">Resumo do Kit</h3>
          <ul style="list-style: none; padding: 0;">
            ${orderData.items.map(item => `
              <li style="padding: 12px 0; border-bottom: 1px solid #f8fafc;">
                <strong style="color: #0f172a;">${item.name}</strong><br/>
                <span style="font-size: 12px; color: #64748b;">${item.details || ''}</span>
              </li>
            `).join('')}
          </ul>
          <p style="font-size: 18px; font-weight: bold; margin-top: 24px;">Total: R$ ${orderData.total.toFixed(2)}</p>
        </div>
      `
    });
  },

  /**
   * ENVIO DE ALERTA DE PONTOS EXPIRANDO
   */
  sendPointsAlert: async (to: string, data: { name: string, points: number, days: number }) => {
    return resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject: "Seus pontos estão vencendo! ⏳",
      html: `
        <div style="font-family: sans-serif; text-align: center; max-width: 600px; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
          <h1 style="color: #0f172a; margin-bottom: 16px;">Não perca seus créditos, ${data.name}!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #475569;">
            Você tem <strong>${data.points} pontos</strong> de fidelidade que expiram em exatamente <strong>${data.days} dias</strong>.
            Use-os no seu próximo pedido para garantir seu desconto!
          </p>
          <div style="margin-top: 32px;">
            <a href="https://gourmetsaudavel.com/pacotes" style="background: #0f172a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Fazer Novo Pedido</a>
          </div>
        </div>
      `
    });
  }
};