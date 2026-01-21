import rateLimit from 'express-rate-limit';

// 1. Limite Global: Protege o servidor como um todo
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  max: 200, // Limite de 200 requisições por IP
  standardHeaders: true, // Retorna info de limite nos headers (RateLimit-Limit)
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Muitas requisições. Acalme o apetite e tente novamente em 15 minutos."
  }
});

// 2. Limite de Autenticação: Muito rígido (Login, Cadastro, Reset de Senha)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Apenas 10 tentativas. Errou 10 vezes? Bloqueado por 15 min.
  message: {
    status: 429,
    message: "Muitas tentativas de login. Por segurança, tente novamente mais tarde."
  }
});

// 3. Limite de Checkout: Evita spam de pedidos ou testes de cartões
export const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Apenas 5 tentativas de finalizar pedido por hora por IP
  message: {
    status: 429,
    message: "Limite de pedidos atingido. Se houver um problema, contacte o suporte."
  }
});