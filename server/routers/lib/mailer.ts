import nodemailer from "nodemailer";
import { getDb } from "../../db.js";
import { appConfigs } from "../../../drizzle/schema/index.js";
import { decrypt } from "../../encryption.js";

// --- INTERFACES ---
interface OrderEmailData {
  id: string;
  customerName: string;
  items: Array<{ name: string; details: string }>;
  address?: string;
  financials?: {
    subtotal: string;
    shipping: string;
    discount: string;
    total: string;
  };
  total?: number | string; 
}

export const mailer = {
  /**
   * 📡 Substitui variáveis {{tag}} e injeta no Master Layout
   */
  parseTemplate(contentHtml: string, variables: Record<string, string>, masterLayout?: string) {
    let finalHtml = masterLayout && masterLayout.includes("{{content}}") 
      ? masterLayout.replace("{{content}}", contentHtml) 
      : contentHtml;

    Object.entries(variables).forEach(([key, value]) => {
      finalHtml = finalHtml.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return finalHtml;
  },

  /**
   * 📡 Configura o transporte dinamicamente via Banco de Dados
   */
  async getTransport() {
    const db = await getDb();
    const configs = await db.select().from(appConfigs);
    
    const getVal = (key: string) => configs.find(c => c.configKey === key)?.configValue;

    const host = getVal("smtp_host") || "127.0.0.1";
    const port = Number(getVal("smtp_port")) || 1025;
    const user = getVal("smtp_user") || "";
    const passRaw = getVal("smtp_pass") || "";

    let pass = "";
    if (passRaw && passRaw.includes(":")) {
      try { pass = decrypt(passRaw) || ""; } catch (e) { pass = passRaw; }
    } else { pass = passRaw; }

    const transportOptions: any = {
      host, 
      port, 
      secure: port === 465,
      auth: user ? { user: String(user), pass: String(pass) } : undefined,
      tls: { rejectUnauthorized: false },
    };

    return {
      transporter: nodemailer.createTransport(transportOptions),
      from: user || "sistema@gourmet.local",
      configs
    };
  },

  /**
   * 📧 E-MAIL DE BEM-VINDO (Novo método adicionado para corrigir erro no Auth)
   */
  async sendWelcomeEmail(to: string, name: string) {
    try {
      const { transporter, from, configs } = await this.getTransport();
      const getVal = (key: string) => configs.find(c => c.configKey === key)?.configValue;

      const masterLayout = getVal("email_master_layout");
      const subjectTemplate = getVal("email_welcome_subject") || "Bem-vindo à Gourmet Saudável, {{name}}!";
      
      const bodyTemplate = getVal("email_welcome_body") || `
        <div style="font-family: sans-serif; color: #334155;">
          <h2 style="color: #059669;">Seja muito bem-vindo(a), {{name}}!</h2>
          <p>Estamos muito felizes em ter você conosco. Sua conta foi criada com sucesso e você já pode realizar seus pedidos de marmitas saudáveis.</p>
          <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-left: 4px solid #059669; border-radius: 4px;">
             <strong>Dica:</strong> Explore nosso cardápio semanal para encontrar pratos frescos e balanceados!
          </div>
          <p style="margin-top: 30px;">Atenciosamente,<br>Equipe Gourmet Saudável</p>
        </div>
      `;

      const variables = { name };

      await transporter.sendMail({
        from: `"Gourmet Saudável" <${from}>`,
        to,
        subject: this.parseTemplate(subjectTemplate, variables),
        html: this.parseTemplate(bodyTemplate, variables, masterLayout),
      });

      return { success: true };
    } catch (err) {
      console.error("❌ Erro Mailer (Welcome):", err);
      throw err;
    }
  },

  /**
   * 📧 CONFIRMAÇÃO DE PEDIDO
   */
  async sendOrderConfirmation(to: string, order: OrderEmailData) {
    try {
      const { transporter, from, configs } = await this.getTransport();
      const getVal = (key: string) => configs.find(c => c.configKey === key)?.configValue;

      const masterLayout = getVal("email_master_layout");
      const subjectTemplate = getVal("email_order_subject") || "Pedido Confirmado! #{{orderId}}";
      
      const bodyTemplate = getVal("email_order_body") || `
        <div style="font-family: sans-serif; color: #334155;">
          <h2 style="color: #059669;">Olá {{customerName}}, recebemos seu pedido!</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="margin-top:0; font-size: 16px; color: #0f172a;">📦 Itens do Pedido #{{orderId}}</h3>
            {{itemsHtml}}
          </div>
          <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px; background: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #059669; font-size: 14px; text-transform: uppercase;">📍 Endereço de Entrega</h4>
              <p style="margin: 0; font-size: 13px; line-height: 1.5;">{{addressHtml}}</p>
            </div>
            <div style="flex: 1; min-width: 250px; background: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #059669; font-size: 14px; text-transform: uppercase;">💰 Resumo Financeiro</h4>
              <table style="width: 100%; font-size: 13px;">
                <tr><td>Subtotal:</td><td style="text-align: right;">{{subtotal}}</td></tr>
                <tr><td>Frete:</td><td style="text-align: right;">{{shipping}}</td></tr>
                <tr style="color: #ef4444;"><td>Descontos:</td><td style="text-align: right;">- {{discount}}</td></tr>
                <tr style="font-weight: bold; font-size: 15px; color: #0f172a;">
                  <td style="padding-top: 8px;">Total:</td>
                  <td style="padding-top: 8px; text-align: right;">{{total}}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      `;

      const itemsHtml = `
        <table style="width: 100%; border-collapse: collapse;">
          ${order.items.map(item => `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${item.name}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.4;">${item.details}</div>
              </td>
            </tr>
          `).join('')}
        </table>
      `;

      const variables = {
        customerName: order.customerName,
        orderId: order.id,
        itemsHtml: itemsHtml,
        addressHtml: order.address || "Retirada no Local",
        subtotal: order.financials?.subtotal || "R$ 0,00",
        shipping: order.financials?.shipping || "R$ 0,00",
        discount: order.financials?.discount || "R$ 0,00",
        total: order.financials?.total || "R$ 0,00"
      };

      await transporter.sendMail({
        from: `"Gourmet Saudável" <${from}>`,
        to,
        subject: this.parseTemplate(subjectTemplate, variables),
        html: this.parseTemplate(bodyTemplate, variables, masterLayout),
      });

      return { success: true };
    } catch (err) {
      console.error("❌ Erro Mailer (Pedido):", err);
      throw err;
    }
  },

  /**
   * 📧 RECUPERAÇÃO DE SENHA
   */
  async sendPasswordReset(to: string, name: string, resetLink: string) {
    try {
      const { transporter, from, configs } = await this.getTransport();
      const getVal = (key: string) => configs.find(c => c.configKey === key)?.configValue;

      const masterLayout = getVal("email_master_layout");
      const subjectTemplate = getVal("email_reset_subject") || "Recuperação de Senha - Gourmet Saudável";
      const bodyTemplate = getVal("email_reset_body") || `
        <div style="font-family: sans-serif;">
          <h2>Recuperar Senha</h2>
          <p>Olá {{name}}, recebemos uma solicitação para redefinir sua senha.</p>
          <p>Clique no botão abaixo para prosseguir:</p>
          <a href="{{resetLink}}" style="display: inline-block; padding: 12px 24px; background: #059669; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Alterar Minha Senha</a>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Se você não solicitou esta alteração, ignore este e-mail.</p>
        </div>
      `;

      const variables = { name, resetLink };
      const finalHtml = this.parseTemplate(bodyTemplate, variables, masterLayout);

      await transporter.sendMail({
        from: `"Segurança Gourmet" <${from}>`,
        to,
        subject: this.parseTemplate(subjectTemplate, variables),
        html: finalHtml,
      });

      return { success: true };
    } catch (err) {
      console.error("❌ Erro Mailer (Reset):", err);
      throw err;
    }
  }
};