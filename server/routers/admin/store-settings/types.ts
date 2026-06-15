import type { getDb } from "../../../db.js";

export type DbType = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export interface SettingsInput {
  success_order_message?: string | null;
  successOrderMessage?: string | null;
  partners_json?: string | null;
  partnersJson?: string | null;
  label_design_elements?: string | null;
  labelDesignElements?: string | null;
  logoUrl?: string;
  favicon?: string;
  emergencyMode?: boolean;
  generalMinOrderAmount?: string | number;
  minOrderMessage?: string;
  pickupEnabled?: boolean;
  pickupLabel?: string;
  pickupInstruction?: string;
  companyInfo?: Record<string, unknown>;
  vLibrasActive?: boolean | string | null;
  highContrastActive?: boolean | string | null;
  accessibility?: {
    vLibrasActive?: boolean | string | null;
    highContrastActive?: boolean | string | null;
  };
  geminiApiKey?: string;
  googleLoginConfig?: string;
  googleAnalyticsId?: string;
  gaServiceAccount?: string;
  ga4PropertyId?: string;
  gtmId?: string;
}

export interface AppConfigRow {
  configKey: string;
  configValue: string | null;
}
