import pino from "pino";

// Verifica se estamos em ambiente de produção
const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: isDev ? "debug" : "info",
  // Em dev, formata o texto bonitinho. Em produção, cospe JSON de alta performance.
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});