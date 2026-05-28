import { OAuth2Client } from "google-auth-library";
import axios from "axios";

// Instancia o cliente Google OAuth usando variáveis de ambiente
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Realiza a troca do código temporário (authorization code) pelos tokens do Google.
 */
export async function exchangeCodeForTokens(args: { code: string; codeVerifier: string }) {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "";

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
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  
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
