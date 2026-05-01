import React from "react"; // ✅ Adicionado React para corrigir escopo JSX
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  path?: string;
}

export function SEO({ title, description, image, path }: SEOProps) {
  const siteName = "Gourmet Saudável";
  const fullTitle = `${title} | ${siteName}`;
  const siteUrl = "https://seusite.com.br"; // Mude para seu domínio real
  const defaultDescription = "Marmitas saudáveis e congeladas com sabor de comida caseira.";
  const defaultImage = `${siteUrl}/og-image.jpg`; // Uma imagem bonita do seu logo ou pratos

  return (
    <Helmet>
      {/* Padrão */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <link rel="canonical" href={`${siteUrl}${path || ""}`} />

      {/* Facebook / WhatsApp (Open Graph) */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${siteUrl}${path || ""}`} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={image || defaultImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image || defaultImage} />
    </Helmet>
  );
}