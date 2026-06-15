import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { isValidCpf } from "@shared/domain/checkout/cpf";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validateCPF(cpf: string) {
  return isValidCpf(cpf);
}
