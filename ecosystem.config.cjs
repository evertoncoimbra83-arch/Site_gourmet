// ecosystem.config.cjs
// Seguro: nenhuma credencial aqui. Tudo vem do arquivo .env.production.

require("dotenv").config({ path: "/root/.env.production" });

const sharedEnv = {
  // --- AMBIENTE ---
  NODE_ENV: "production",

  // --- BANCO DE DADOS ---
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,

  // --- BACKUP / LEGADO ---
  WC_DB_HOST: process.env.WC_DB_HOST,
  WC_DB_USER: process.env.WC_DB_USER,
  WC_DB_PASSWORD: process.env.WC_DB_PASSWORD,
  WC_DB_NAME: process.env.WC_DB_NAME,
  WC_DB_PORT: process.env.WC_DB_PORT,

  // --- SEGURANCA ---
  SESSION_SECRET: process.env.SESSION_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  DB_ENCRYPTION_KEY: process.env.DB_ENCRYPTION_KEY,
  PII_PEPPER: process.env.PII_PEPPER,

  // --- EMAIL ---
  RESEND_API_KEY: process.env.RESEND_API_KEY,

  // --- CLOUDINARY ---
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // --- REDIS ---
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_URL: process.env.REDIS_URL,

  // --- IA ---
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  // --- URLS DO SISTEMA ---
  VITE_APP_URL: process.env.VITE_APP_URL,
  VITE_API_URL: process.env.VITE_API_URL,
  APP_URL: process.env.APP_URL,
  CLIENT_URL: process.env.CLIENT_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN,

  // --- ENDPOINTS ADICIONAIS ---
  VITE_ANALYTICS_ENDPOINT: process.env.VITE_ANALYTICS_ENDPOINT,
  VITE_OAUTH_PORTAL_URL: process.env.VITE_OAUTH_PORTAL_URL,
};

module.exports = {
  apps: [
    {
      name: "gourmet-api",
      script: "dist/index.js",
      out_file: "/var/log/pm2/gourmet-api-out.log",
      error_file: "/var/log/pm2/gourmet-api-error.log",
      log_file: "/var/log/pm2/gourmet-api-combined.log",
      merge_logs: true,
      max_restarts: 10,
      restart_delay: 4000,
      env: {
        ...sharedEnv,
        PORT: process.env.PORT,
      },
    },
    {
      name: "gourmet-worker",
      script: "dist/workers/index.js",
      out_file: "/var/log/pm2/gourmet-worker-out.log",
      error_file: "/var/log/pm2/gourmet-worker-error.log",
      log_file: "/var/log/pm2/gourmet-worker-combined.log",
      merge_logs: true,
      max_restarts: 10,
      restart_delay: 4000,
      env: {
        ...sharedEnv,
        WORKER_PROCESS: "true",
      },
    },
  ],
};
