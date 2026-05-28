// client/src/pages/auth/logic/auth.logic.ts

/**
 * 📝 CAMPOS OBRIGATÓRIOS (CHECKLIST):
 * - NAME: Nome completo (mínimo 2 letras)
 * - CPF: 11 dígitos numéricos (Validação matemática obrigatória)
 * - PASSWORD: Minimo 8 caracteres
 * - PHONE: WhatsApp formatado apenas com números
 */

interface TRPCErrorShape {
  message?: string;
  data?: {
    zodError?: {
      fieldErrors: Record<string, string[]>;
    };
    httpStatus?: number;
    code?: string;
  };
}

/**
 * Limpa e extrai a mensagem de erro do tRPC/Zod/Backend
 */
export const getCleanErrorMessage = (error: unknown): string => {
  try {
    if (typeof error === "string") return error;

    const err = error as TRPCErrorShape;

    // 1. Erros de validação do Zod (Campos mal preenchidos)
    if (err.data?.zodError?.fieldErrors) {
      const fieldErrors = err.data.zodError.fieldErrors;
      const firstField = Object.keys(fieldErrors)[0];
      
      // ✅ FIX: Usando a lógica de nome de campo diretamente no retorno para evitar erro de 'unused-vars'
      const label = firstField === "identifier" ? "E-mail ou CPF" : 
                    firstField === "password" ? "Senha" : 
                    firstField === "cpf" ? "CPF" : "Campo";

      return `${label}: ${fieldErrors[firstField][0]}`;
    }
    
    const msg = err.message || "";
    const lowerMsg = msg.toLowerCase();

    // 2. Parser para JSON bruto (erros stringificados)
    if (msg.includes("[") && msg.includes("{")) {
      try {
        const start = msg.indexOf("[");
        const end = msg.lastIndexOf("]") + 1;
        const jsonPart = msg.substring(start, end);
        const parsed = JSON.parse(jsonPart);
        return Array.isArray(parsed) ? parsed[0]?.message : parsed.message || msg;
      } catch {
        // Fallback
      }
    }
    
    // 3. Traduções amigáveis (Regras de Negócio Gourmet Saudável)
    if (lowerMsg.includes("email") && lowerMsg.includes("uso")) return "Este e-mail já está em nossa horta. 🍏";
    
    if (lowerMsg.includes("cpf") || lowerMsg.includes("document_index") || lowerMsg.includes("documentindex")) {
      return "Este CPF já possui uma conta ativa conosco. 🥗";
    }
    
    if (lowerMsg.includes("telefone") || lowerMsg.includes("phoneindex")) return "Este WhatsApp já está vinculado a outra conta. 📱";

    if (lowerMsg.includes("créditos") || lowerMsg.includes("limite mensal")) {
      return "Seu limite mensal de IA foi atingido. Ele renova no dia 1º! ⏳";
    }
    
    if (
      err.data?.httpStatus === 401 || 
      err.data?.code === "UNAUTHORIZED" ||
      lowerMsg.includes("unauthorized") || 
      lowerMsg.includes("conferem")
    ) {
      return "Dados não conferem. Verifique seu e-mail e senha. 🍎";
    }

    if (lowerMsg.includes("forbidden")) return "Você não tem permissão para realizar esta ação. 🚫";

    return msg || "Ocorreu um erro inesperado.";
  } catch {
    return (error as Error)?.message || "Ocorreu um erro inesperado.";
  }
};

/**
 * Validação Matemática de CPF (Módulo 11)
 */
export const validateCPF = (cpf: string): boolean => {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11 || !!clean.match(/(\d)\1{10}/)) return false;
  
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(clean.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(clean.substring(10, 11));
};

/**
 * Máscaras de Interface Progressivas
 */
export const masks = {
  cpf: (v: string) => {
    return v
      .replace(/\D/g, "") 
      .replace(/(\d{3})(\d)/, "$1.$2") 
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .substring(0, 14);
  },
  phone: (v: string) => {
    const r = v.replace(/\D/g, "");
    if (r.length > 10) {
      return r.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3").substring(0, 15);
    } else if (r.length > 5) {
      return r.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3").substring(0, 14);
    } else if (r.length > 2) {
      return r.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    }
    return r.replace(/^(\d*)/, "$1");
  },
};

export const checkDocumentUI = (cpf: string): string | null => {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length === 0) return null;
  if (clean.length < 11) return "O CPF deve ter 11 dígitos.";
  if (!validateCPF(clean)) return "Este não parece um CPF válido. 🧐";
  return null;
};
