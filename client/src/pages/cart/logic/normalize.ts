export const normalizePackageOptions = (opts: any): any[] => {
  if (!opts) return [];
  
  // 1. Se já for um array, retorna direto (legado)
  if (Array.isArray(opts)) return opts;

  let data = opts;

  // 2. Se for string (JSON do banco), faz o parse
  if (typeof opts === "string") {
    try {
      data = JSON.parse(opts);
    } catch {
      return [];
    }
  }

  // 3. LÓGICA DE EXTRAÇÃO:
  // Se for o objeto do seu pacote, retorna apenas o array de marmitas ('meals')
  if (data && typeof data === "object") {
    if (Array.isArray(data.meals)) {
      return data.meals; // ✅ Retorna as marmitas do seu JSON
    }
    if (Array.isArray(data)) {
      return data;
    }
  }

  return [];
};