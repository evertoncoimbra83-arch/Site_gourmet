export const getItemCalculatedPrice = (item: any) => {
  // 1. Se for um Pacote, o preço unitário já vem gravado no item ou no snapshot
  if (item.packageId) {
    return Number(item.unitPrice || item.unit_price || item.price || 0);
  }

  // 2. Extração segura das opções (JSON Parse)
  let options = item.options;
  if (typeof options === 'string') {
    try {
      options = JSON.parse(options);
    } catch (e) {
      options = {};
    }
  }

  // 3. Preço Base e Modificador de Tamanho
  // Tenta buscar o preço de diversas fontes para evitar NaN
  const basePrice = Number(item.dish?.base_price || item.unitPrice || item.unit_price || item.price || 0);
  const sizeModifier = Number(options?.size?.price_modifier || item.sizeModifier || 0);

  const priceAfterSize = basePrice * (1 + sizeModifier / 100);

  // 4. Cálculo de Acompanhamentos (Standalone ou Snapshot)
  // Agora acessamos a chave correta 'accompaniments' dentro de options
  const accompaniments = options?.accompaniments || [];
  
  const accsTotal = accompaniments.reduce((sum: number, acc: any) => {
    const val = Number(acc.priceModifier || acc.price_modifier || 0);
    const type = String(acc.priceModifierType || acc.type || "").toLowerCase();

    if (type === "percentage") {
      return sum + (priceAfterSize * (val / 100));
    }
    return sum + val;
  }, 0);

  return priceAfterSize + accsTotal;
};