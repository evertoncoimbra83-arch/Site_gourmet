export interface OAuthCallbackResult {
  provider: "google";
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  name?: string | null;
  picture?: string | null;
}
