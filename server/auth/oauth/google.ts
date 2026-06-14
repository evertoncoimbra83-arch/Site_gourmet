import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import { getDb } from "../../db.js";
import { appConfigs } from "../../../drizzle/schema/index.js";
import { eq } from "drizzle-orm";
import { decrypt } from "../../encryption.js";

/**
 * Carrega a configuração do banco de dados de forma dinâmica,
 * caindo de volta para variáveis de ambiente caso esteja desativado ou vazio.
 */
export async function getGoogleOAuthClient() {
  const db = await getDb();
  let clientId = process.env.GOOGLE_CLIENT_ID || "";
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  let redirectUri = process.env.GOOGLE_REDIRECT_URI || "";

  if (db) {
    const [config] = await db
      .select()
      .from(appConfigs)
      .where(eq(appConfigs.configKey, "google_login_config"))
      .limit(1);

    if (config?.configValue) {
      let val = config.configValue;
      if (val.split(":").length === 3) {
        val = decrypt(val) || val;
      }
      try {
        const parsed = JSON.parse(val);
        if (parsed.enabled) {
          clientId = parsed.clientId || clientId;
          clientSecret = parsed.clientSecret || clientSecret;
          redirectUri = parsed.redirectUri || redirectUri;
        }
      } catch (err) {
        console.error("Erro ao parsear google_login_config no banco:", err);
      }
    }
  }

  const client = new OAuth2Client(clientId, clientSecret, redirectUri);
  return { client, clientId, clientSecret, redirectUri };
}

/**
 * Constrói a URL de redirecionamento para o fluxo do Google OAuth 2.0 com PKCE.
 */
export async function generateGoogleAuthUrl(args: { state: string; nonce: string; codeChallenge: string }) {
  const { client } = await getGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    state: args.state,
    code_challenge: args.codeChallenge,
    code_challenge_method: "S256",
    nonce: args.nonce,
  } as any);
}

/**
 * Realiza a troca do código temporário (authorization code) pelos tokens do Google.
 */
export async function exchangeCodeForTokens(args: { code: string; codeVerifier: string }) {
  const { clientId, clientSecret, redirectUri } = await getGoogleOAuthClient();

  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      code: args.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: args.codeVerifier,
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return {
    accessToken: response.data.access_token as string,
    idToken: response.data.id_token as string,
    expiresIn: response.data.expires_in as number,
  };
}

/**
 * Valida de forma criptográfica o ID Token (JWT) retornado pelo Google.
 * Garante verificação de issuer, audience, expiração e correspondência do nonce.
 */
export async function verifyGoogleIdToken(args: { idToken: string; expectedNonce: string }) {
  const { client, clientId } = await getGoogleOAuthClient();

  const ticket = await client.verifyIdToken({
    idToken: args.idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error("Payload do ID Token está vazio.");
  }

  // Validação explícita do Nonce contra replay attacks
  if (payload.nonce !== args.expectedNonce) {
    throw new Error("Divergência de nonce (Nonce mismatch). Possível ataque de repetição.");
  }

  return payload;
}
