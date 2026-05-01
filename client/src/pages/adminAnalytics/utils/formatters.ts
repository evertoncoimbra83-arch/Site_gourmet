export const formatCurrency = (n: number) => 
  `R$ ${Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)}`;

export const formatNumber = (n: number) => 
  Intl.NumberFormat("pt-BR").format(n || 0);