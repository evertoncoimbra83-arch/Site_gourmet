import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitário para mesclar classes do Tailwind CSS com condicionais (Shadcn UI padrão)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validação de algoritmo de CPF
 * ✅ Exportada para ser usada no Checkout e em outros componentes
 */
export const validateCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/\D/g, ""); // Remove pontos e traços

  // Verifica se tem 11 dígitos ou se todos os dígitos são iguais (ex: 111.111.111-11)
  if (cleanCPF.length !== 11 || /^(\d)\1+$/.test(cleanCPF)) return false;

  let sum = 0;
  let rest;

  // Validação do primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleanCPF.substring(9, 10))) return false;

  sum = 0;
  // Validação do segundo dígito verificador
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
};

/**
 * Utilitário para formatar CPF enquanto o usuário digita (000.000.000-00)
 */
export const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

/**
 * ✅ NOVO: Utilitário para formatar Telefone (Máscara Dinâmica)
 * Aceita (00) 0000-0000 (fixo) ou (00) 00000-0000 (celular)
 */
export const formatPhone = (value: string) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  
  if (digits.length <= 10) {
    // Formato Fixo: (11) 4444-4444
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  }
  
  // Formato Celular: (11) 99999-9999
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};