// server/support/faq.ts
export type FaqTopic = {
  id: string;
  title: string;
  keywords: string[];
  answer: string;
  ctas?: Array<{ label: string; href: string }>;
};

export const SUPPORT_CONFIG = {
  supportHours: "08:00–14:00",
  deliverySla: "24 a 48 horas",
  // 👉 Troque pelo seu link wa.me
  whatsappUrl:
    "https://wa.me/551145265941?text=" +
    encodeURIComponent("Olá! Tenho uma dúvida e preciso de ajuda com meu pedido no site."),
};

export const FAQ_TOPICS: FaqTopic[] = [
  {
    id: "delivery_time",
    title: "Prazo de entrega",
    keywords: ["entrega", "prazo", "chega", "quanto tempo", "demora", "24", "48"],
    answer: `O prazo médio de entrega é ${SUPPORT_CONFIG.deliverySla}.`,
  },
  {
    id: "support_hours",
    title: "Horário de atendimento",
    keywords: ["atendimento", "horario", "horário", "suporte", "funciona", "abre"],
    answer: `Nosso suporte funciona das ${SUPPORT_CONFIG.supportHours}.`,
    ctas: [{ label: "Falar no WhatsApp", href: SUPPORT_CONFIG.whatsappUrl }],
  },
  {
    id: "payment_methods",
    title: "Formas de pagamento",
    keywords: ["pagamento", "pagar", "pix", "cartao", "cartão", "credito", "débito"],
    answer:
      "Aceitamos as formas de pagamento disponíveis no checkout. Se algo não aparecer para você, me diga qual forma deseja usar que eu te oriento.",
    ctas: [{ label: "Falar no WhatsApp", href: SUPPORT_CONFIG.whatsappUrl }],
  },
  {
    id: "delivery_area",
    title: "Área atendida",
    keywords: ["area", "área", "atende", "bairro", "cep", "campinas", "regiao", "região"],
    answer:
      "A área atendida é validada no checkout (com base no seu CEP). Se você me disser seu bairro/CEP, o suporte consegue confirmar rapidinho.",
    ctas: [{ label: "Confirmar no WhatsApp", href: SUPPORT_CONFIG.whatsappUrl }],
  },
  {
    id: "order_help",
    title: "Ajuda com pedido",
    keywords: ["pedido", "comprar", "finalizar", "checkout", "carrinho", "erro"],
    answer:
      "Se você teve algum problema ao finalizar o pedido, me diga em qual etapa travou (carrinho, endereço, pagamento) e qual mensagem apareceu.",
    ctas: [{ label: "Falar com suporte", href: SUPPORT_CONFIG.whatsappUrl }],
  },
];