import React from "react"; // ✅ Adicionado React para corrigir escopo JSX
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  path?: string;
  noindex?: boolean;
  schemaMarkup?: Record<string, any>[] | Record<string, any>;
}

export function SEO({ title, description, image, path, noindex, schemaMarkup }: SEOProps) {
  const siteName = "Gourmet Saudável";
  const fullTitle = `${title} | ${siteName}`;
  const siteUrl = import.meta.env.VITE_SITE_URL || "https://gourmetsaudavel.com";
  const defaultDescription = "Marmitas saudáveis e congeladas com sabor de comida caseira.";
  const defaultImage = `${siteUrl}/og-image.jpg`;

  const absoluteImage = image
    ? (image.startsWith("http") ? image : `${siteUrl}${image.startsWith("/") ? "" : "/"}${image}`)
    : defaultImage;

  const absoluteUrl = `${siteUrl}${path || ""}`;

  return (
    <Helmet>
      {/* Padrão */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <link rel="canonical" href={absoluteUrl} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Facebook / WhatsApp (Open Graph) */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={absoluteImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={absoluteImage} />

      {/* JSON-LD Schema Markup */}
      {schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      )}
    </Helmet>
  );
}