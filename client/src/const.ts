// =============================
// CONSTANTES DA APLICAÇÃO
// =============================

export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = "Please login (10001)";
export const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// =============================
// LOGIN URL CORRETO
// =============================

// ❌ Antes:  /api/dev-oauth/login
// ✔️ Agora:  /login

export const getLoginUrl = () => "/login";

// =============================
// IDENTIDADE DO APP
// =============================

export const APP_TITLE = "Gourmet Saudável";

// ✅ CORREÇÃO DEFINITIVA: Apontando para o arquivo que realmente existe
export const APP_LOGO = "https://gourmetsaudavel.com/uploads/img-1770683807666-887369643.webp";