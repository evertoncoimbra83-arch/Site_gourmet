export interface SearchableProduct {
  name?: string | null;
  categoryName?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  ingredients?: string | null;
  keywords?: string | string[] | null;
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function buildProductSearchText(product: SearchableProduct) {
  const keywords = Array.isArray(product.keywords)
    ? product.keywords.join(" ")
    : product.keywords || "";

  return normalize(
    [
      product.name,
      product.categoryName,
      product.description,
      product.shortDescription,
      product.ingredients,
      keywords,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function matchesProductSearch(
  product: SearchableProduct,
  query?: string | null,
) {
  const normalizedQuery = normalize(query ?? "");
  if (!normalizedQuery) return true;
  return buildProductSearchText(product).includes(normalizedQuery);
}

export function filterProductsBySearch<T extends SearchableProduct>(
  products: T[],
  query?: string | null,
) {
  return products.filter((product) => matchesProductSearch(product, query));
}
