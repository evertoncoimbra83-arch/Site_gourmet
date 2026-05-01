// shared/domain/checkout/customer.ts
import { validateCPF } from "@/lib/utils"; // Ou mova o validateCPF para o domínio também!

export interface RawCustomerData {
  id?: string | number;
  name?: string | null;
  email?: string | null;
  customerDocument?: string | null;
  cpf?: string | null;
  document?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  mobile?: string | null;
}

export function extractCustomerData(raw: RawCustomerData | null | undefined) {
  if (!raw) return null;

  const cpf = String(raw.customerDocument ?? raw.cpf ?? raw.document ?? "").trim();
  const phone = String(raw.phone ?? raw.whatsapp ?? raw.mobile ?? "").trim();

  return {
    name: raw.name ?? "",
    email: raw.email ?? "",
    cpf,
    phone,
    isCPFValid: validateCPF(cpf.replace(/\D/g, ""))
  };
}