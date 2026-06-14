export interface ShowcaseProduct {
  id: string | number;
  name: string;
  price?: string | number | null;
  salePrice?: string | number | null;
  imageUrl?: string | null;
  image?: string | null;
  kcal?: number | string | null;
  nutritional_info?: {
    kcal?: number | string | null;
  } | null;
  description?: string | null;
  sizes?: { id: string | number; name: string }[];
}

export interface HomeCategory {
  id: string | number;
  name: string;
  color?: string | null;
  description?: string | null;
  dishCount?: number;
}

export interface ShowcaseData {
  id: string | number;
  title: string;
  items: ShowcaseProduct[];
}

export interface PackageItem {
  id: string | number;
  name: string;
  description?: string | null;
  price?: string | number | null;
  salePrice?: string | number | null;
  imageUrl?: string | null;
  isPopular?: boolean;
  highlights?: string | string[] | null;
}

export interface FeaturedAnnouncement {
  iconEmoji?: string | null;
  type?: string | null;
  title: string;
  content: string;
}

export interface StoreSettingsLike {
  emergencyMode?: boolean | null;
  logoUrl?: string | null;
  favicon?: string | null;
  accessibility?: {
    highContrast?: boolean | null;
    dyslexicFont?: boolean | null;
  } | null;
  company_social_info?: {
    phone?: string | null;
    address?: string | null;
    instagram?: string | null;
  } | null;
}

export interface CepStatus {
  success: boolean;
  message: string;
}
