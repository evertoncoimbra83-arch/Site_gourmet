import type { Request } from "express";
import rateLimit from "express-rate-limit";

function getClientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.socket?.remoteAddress || "";

  if (rawIp.startsWith("::ffff:")) {
    return rawIp.replace("::ffff:", "");
  }

  return rawIp;
}

function isLocalRequest(req: Request) {
  const clientIp = getClientIp(req);
  return (
    clientIp === "127.0.0.1" ||
    clientIp === "::1" ||
    clientIp === "localhost" ||
    clientIp === ""
  );
}

const skipLocalhost = (req: Request) => isLocalRequest(req);

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2_000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocalhost,
  message: {
    status: 429,
    message:
      "Muitas requisicoes. Acalme o apetite e tente novamente em 15 minutos.",
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  skip: skipLocalhost,
  message: {
    status: 429,
    message:
      "Muitas tentativas de login. Por seguranca, tente novamente mais tarde.",
  },
});

export const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  skip: skipLocalhost,
  message: {
    status: 429,
    message:
      "Limite de pedidos atingido. Se houver um problema, contacte o suporte.",
  },
});
