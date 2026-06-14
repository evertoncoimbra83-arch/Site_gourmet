// shared/domain/checkout/customer.ts
import { isValidCpf, normalizeCpf } from "./cpf";

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

  const cpf = normalizeCpf(raw.customerDocument ?? raw.cpf ?? raw.document ?? "");
  const phone = String(raw.phone ?? raw.whatsapp ?? raw.mobile ?? "").trim();

  return {
    name: raw.name ?? "",
    email: raw.email ?? "",
    cpf,
    phone,
    isCPFValid: isValidCpf(cpf),
  };
}
