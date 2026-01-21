/**
 * Integração com API ViaCEP para consulta de endereços
 * Documentação: https://viacep.com.br/
 */

export interface ViaCEPAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

/**
 * Consulta CEP na API ViaCEP
 * @param cep - CEP no formato 00000-000 ou 00000000
 * @returns Dados do endereço ou null se não encontrado
 */
export async function consultarCEP(cep: string): Promise<ViaCEPAddress | null> {
  try {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, "");

    // Valida formato
    if (cepLimpo.length !== 8) {
      throw new Error("CEP inválido: deve conter 8 dígitos");
    }

    // Consulta API
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

    if (!response.ok) {
      throw new Error(`Erro na API ViaCEP: ${response.status}`);
    }

    const data: ViaCEPAddress = await response.json();

    // Verifica se CEP foi encontrado
    if (data.erro) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("[ViaCEP] Erro ao consultar CEP:", error);
    throw error;
  }
}

/**
 * Formata CEP no padrão 00000-000
 */
export function formatarCEP(cep: string): string {
  const cepLimpo = cep.replace(/\D/g, "");
  return cepLimpo.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

/**
 * Valida formato de CEP
 */
export function validarCEP(cep: string): boolean {
  const cepLimpo = cep.replace(/\D/g, "");
  return cepLimpo.length === 8;
}
