import { useMemo } from "react";
import type { StoreSettingsLike } from "../types";
import { resolveImageUrl } from "@shared/utils/image-url";

export function useHomeSeoSchemas(
  storeSettings: StoreSettingsLike | undefined
) {
  const company = storeSettings?.company_social_info || {};
  const phone = company.phone || "(11) 4526-5941";
  const addressText = company.address || "";
  const isAddressComplete = !!(
    addressText &&
    addressText.length > 20 &&
    /\d+/.test(addressText)
  );

  return useMemo(() => {
    const siteUrl =
      import.meta.env.VITE_SITE_URL || "https://gourmetsaudavel.com";
    const logoUrl = resolveImageUrl(
      storeSettings?.logoUrl || storeSettings?.favicon,
      "logo",
      { legacyBaseUrl: siteUrl },
    );
    const imageUrl = `${siteUrl}/og-image.jpg`;

    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Gourmet Saudável",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
      telephone: phone,
      sameAs: company.instagram
        ? [`https://instagram.com/${company.instagram.replace("@", "")}`]
        : [],
    };

    const businessSchema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "FoodEstablishment",
      "@id": `${siteUrl}/#localbusiness`,
      name: "Gourmet Saudável",
      telephone: phone,
      url: siteUrl,
      logo: logoUrl,
      image: imageUrl,
    };

    if (isAddressComplete) {
      businessSchema.address = {
        "@type": "PostalAddress",
        streetAddress: addressText,
        addressLocality: "Jundiaí",
        addressRegion: "SP",
        addressCountry: "BR",
      };
    }

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Como os pratos são conservados?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Nossos pratos são preparados com ingredientes 100% frescos e congelados através de um processo de ultracongelamento rápido. Isso impede a formação de cristais de gelo, conservando a textura, os nutrientes e o sabor original por até 90 dias no freezer.",
          },
        },
        {
          "@type": "Question",
          name: "Como aquecer as refeições?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Basta retirar o selo plástico protetor e levar a marmita diretamente ao micro-ondas por 5 a 7 minutos (o tempo varia de acordo com a potência do aparelho). Também é possível aquecer em forno convencional pré-aquecido por cerca de 25 minutos.",
          },
        },
        {
          "@type": "Question",
          name: "Aceitam Vale-Refeição e Vale-Alimentação?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Aceitamos Pix, cartões e principais vales-refeição/benefício. As opções exibidas no checkout seguem a configuração ativa da loja.",
          },
        },
        {
          "@type": "Question",
          name: "Como funciona o acúmulo de pontos de fidelidade?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A cada pedido feito no site, 10% do valor total pago é convertido em pontos de fidelidade na sua conta. Cada 100 pontos equivalem a R$ 1.00 de desconto, que pode ser ativado a qualquer momento no carrinho de compras.",
          },
        },
      ],
    };

    return [orgSchema, businessSchema, faqSchema];
  }, [
    company.instagram,
    phone,
    addressText,
    isAddressComplete,
    storeSettings?.logoUrl,
    storeSettings?.favicon,
  ]);
}
