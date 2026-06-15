export function getCategoryColorClasses(
  colorName: string | null | undefined,
  catName: string
) {
  const normColor = (colorName || "").toLowerCase();
  const normName = catName.toLowerCase();

  if (
    normColor === "emerald" ||
    normColor === "green" ||
    normName.includes("fit") ||
    normName.includes("funcional")
  ) {
    return {
      bg: "bg-emerald-50/20",
      border:
        "border-emerald-100/50 hover:border-emerald-300/80 hover:shadow-emerald-50/50",
      topBar: "bg-emerald-600",
      countText: "group-hover:text-emerald-700",
    };
  }
  if (
    normColor === "orange" ||
    normColor === "amber" ||
    normName.includes("low") ||
    normName.includes("carb")
  ) {
    return {
      bg: "bg-amber-50/20",
      border:
        "border-amber-100/50 hover:border-amber-300/80 hover:shadow-amber-50/50",
      topBar: "bg-amber-600",
      countText: "group-hover:text-amber-700",
    };
  }
  if (
    normColor === "rose" ||
    normColor === "red" ||
    normName.includes("doce") ||
    normName.includes("sobre")
  ) {
    return {
      bg: "bg-rose-50/20",
      border:
        "border-rose-100/50 hover:border-rose-300/80 hover:shadow-rose-50/50",
      topBar: "bg-rose-600",
      countText: "group-hover:text-rose-700",
    };
  }
  if (
    normColor === "blue" ||
    normColor === "cyan" ||
    normName.includes("sopa") ||
    normName.includes("caldo")
  ) {
    return {
      bg: "bg-blue-50/20",
      border:
        "border-blue-100/50 hover:border-blue-300/80 hover:shadow-blue-50/50",
      topBar: "bg-blue-600",
      countText: "group-hover:text-blue-700",
    };
  }
  if (
    normColor === "violet" ||
    normColor === "purple" ||
    normName.includes("vegan") ||
    normName.includes("vegeta")
  ) {
    return {
      bg: "bg-violet-50/20",
      border:
        "border-violet-100/50 hover:border-violet-300/80 hover:shadow-violet-50/50",
      topBar: "bg-violet-600",
      countText: "group-hover:text-violet-700",
    };
  }

  return {
    bg: "bg-slate-50/40",
    border:
      "border-slate-100 hover:border-slate-300/80 hover:shadow-slate-50/50",
    topBar: "bg-slate-600",
    countText: "group-hover:text-slate-900",
  };
}

export function getCategoryFallbackDescription(name: string): string {
  const norm = name.toLowerCase();
  if (norm.includes("fit") || norm.includes("funcional"))
    return "Equilíbrio e sabor para o seu dia a dia ativo.";
  if (norm.includes("low")) return "Refeições com baixo teor de carboidratos.";
  if (norm.includes("vegan") || norm.includes("vegeta"))
    return "Pratos saborosos feitos 100% à base de plantas.";
  if (norm.includes("sopa") || norm.includes("caldo"))
    return "Opções leves, nutritivas e reconfortantes.";
  if (norm.includes("doce") || norm.includes("sobre"))
    return "Sobremesas saudáveis sem açúcar refinado.";
  if (norm.includes("bebida") || norm.includes("suco"))
    return "Bebidas naturais, funcionais e sem conservantes.";
  if (norm.includes("massa"))
    return "Massas artesanais com molhos funcionais ricos.";
  if (norm.includes("peixe") || norm.includes("fruto"))
    return "Peixes frescos e ricos em proteínas nobres.";
  if (norm.includes("carne") || norm.includes("bov"))
    return "Cortes magros selecionados com sabor marcante.";
  if (norm.includes("frango") || norm.includes("ave"))
    return "Aves selecionadas temperadas com ervas finas.";
  return "Comida saudável de verdade feita do seu jeito.";
}
