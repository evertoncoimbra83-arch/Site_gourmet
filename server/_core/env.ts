// env.ts
export type EnvConfig = {
  appId: string;
  cookieSecret: string;
  databaseUrl: string;
  oAuthServerUrl: string;
  ownerOpenId: string;
  isProduction: boolean;
  forgeApiUrl: string;
  forgeApiKey: string;
  woocommerceUrl: string;
  woocommerceConsumerKey: string;
  woocommerceConsumerSecret: string;
  dbEncryptionKey: string; // 👈
};

export const ENV: EnvConfig = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  woocommerceUrl: process.env.WOOCOMMERCE_URL ?? "",
  woocommerceConsumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY ?? "",
  woocommerceConsumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET ?? "",
  dbEncryptionKey:
    process.env.DB_ENCRYPTION_KEY ??
    "NjQVtjD/c8lan0GQBsZNo868grK4ysaX+iD9YgqCcZY=", // default
};
