// client/src/pages/products/logic/validation.ts

/**
 * Verifica se um tamanho possui algum acompanhamento real cadastrado e disponível.
 * Retorna falso se:
 * - Não tem grupos vinculados
 * - Tem grupos, mas todos os grupos estão vazios
 * - Todos os grupos cadastrados possuem apenas opções marcadas como isNoAccompaniment/is_no_accompaniment.
 */
export function hasAccompaniments(size: any): boolean {
  if (!size) return false;
  const rawGroups = size.accompanimentGroups || size.groups || [];
  if (rawGroups.length === 0) return false;

  return rawGroups.some((group: any) => {
    const options = group.options || group.accompanimentOptions || [];
    if (options.length === 0) return false;
    // Pelo menos uma opção não pode ser "isNoAccompaniment"
    return options.some((opt: any) => !opt.isNoAccompaniment && !opt.is_no_accompaniment);
  });
}

/**
 * Valida se as seleções para um grupo de acompanhamento específico foram preenchidas corretamente.
 * Um grupo é considerado preenchido se:
 * - Não há acompanhamentos reais disponíveis (apenas opções isNoAccompaniment ou nenhuma opção); ou
 * - Existe uma opção isNoAccompaniment selecionada; ou
 * - As regras de minSelections/maxSelections para opções reais foram atendidas.
 */
export function validateGroupSelections(
  selectedAccs: any[],
  group: any
): { ok: boolean; message?: string } {
  const options = group.options || group.accompanimentOptions || [];
  const min = Number(group.minSelections || 0);
  const max = Math.max(1, Number(group.maxSelections || 1));
  const groupId = String(group.groupId ?? group.id);

  // Filtrar seleções pertencentes a este grupo
  const selections = selectedAccs.filter(
    (acc: any) => String(acc.groupId) === groupId
  );

  // 1. Se não há acompanhamentos reais disponíveis neste grupo
  const hasRealOptions = options.some((opt: any) => !opt.isNoAccompaniment && !opt.is_no_accompaniment);
  if (!hasRealOptions) {
    return { ok: true };
  }

  // 2. Se existe alguma opção isNoAccompaniment selecionada
  const hasNoAccompanimentSelected = selections.some(
    (acc: any) => acc.isNoAccompaniment || acc.is_no_accompaniment
  );
  if (hasNoAccompanimentSelected) {
    return { ok: true };
  }

  // 3. Caso contrário, valida as regras mínimas/máximas
  const count = selections.length;
  if (count < min) {
    return {
      ok: false,
      message: `Escolha pelo menos ${min} item(ns) em ${group.name}.`,
    };
  }

  if (count > max) {
    return {
      ok: false,
      message: `Limite de ${max} item(ns) excedido em ${group.name}.`,
    };
  }

  return { ok: true };
}

/**
 * Valida todas as seleções de acompanhamento para o tamanho selecionado.
 */
export function validateAccSelections(
  accs: any[],
  currentSize: any
): { ok: boolean; message?: string } {
  if (!currentSize) {
    return { ok: false, message: "Escolha um tamanho antes de adicionar." };
  }

  // Se o tamanho não possui nenhum acompanhamento real cadastrado e disponível
  if (!hasAccompaniments(currentSize)) {
    return accs.length === 0
      ? { ok: true }
      : { ok: false, message: "Este tamanho não aceita acompanhamentos." };
  }

  const groups = currentSize.accompanimentGroups || currentSize.groups || [];

  const groupsById = new Map<string, any>();
  for (const group of groups) {
    const gId = String(group.groupId ?? group.id);
    groupsById.set(gId, group);
  }

  const seen = new Set<string>();
  for (const acc of accs) {
    const groupId = String(acc.groupId);
    const group = groupsById.get(groupId);

    if (!group) {
      return {
        ok: false,
        message: `${acc.name} não pertence ao tamanho selecionado.`,
      };
    }

    const groupOptions = group.options || group.accompanimentOptions || [];
    const belongsToGroup = groupOptions.some(
      (option: any) => String(option.id) === String(acc.id)
    );

    if (!belongsToGroup) {
      return {
        ok: false,
        message: `${acc.name} não pertence ao grupo ${group.name}.`,
      };
    }

    const selectionKey = `${groupId}:${String(acc.id)}`;
    if (seen.has(selectionKey)) {
      return {
        ok: false,
        message: `${acc.name} foi selecionado mais de uma vez.`,
      };
    }
    seen.add(selectionKey);
  }

  for (const group of groups) {
    const res = validateGroupSelections(accs, group);
    if (!res.ok) {
      return res;
    }
  }

  return { ok: true };
}
