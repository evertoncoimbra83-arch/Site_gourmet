import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// ✅ Adicione sua função de volta aqui embaixo
export function validateCPF(cpf: string) {
  const cleanCPF = cpf.replace(/[^\d]+/g, '');
  if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) return false;
  
  const cpfArray = cleanCPF.split('').map(el => +el);
  const rest = (count: number) => (
    cpfArray.slice(0, count - 12).reduce((soma, el, index) => (soma + el * (count - index)), 0) * 10
  ) % 11 % 10;
  
  return rest(10) === cpfArray[9] && rest(11) === cpfArray[10];
}