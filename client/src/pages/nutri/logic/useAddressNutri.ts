// e:/IA/projects/Site_React/client/src/pages/nutri/logic/useAddressNutri.ts

import { useState } from "react";
import { appToast as toast } from "@/lib/app-toast";

// ✅ Interface para os dados que a função de atualização espera receber
interface CepUpdateData {
  street: string;
  city: string;
  zipCode: string;
}

/**
 * ✅ Hook Revisado: Agora ele aceita uma função genérica de atualização
 * para funcionar tanto no cadastro quanto na edição de perfil.
 */
export function useAddressNutri() {
  const [isSearchingCep, setIsSearchingCep] = useState<number | null>(null);

  // ✅ FIX 11: Substituído 'any' pela interface CepUpdateData
  const searchCep = async (
    cep: string, 
    index: number, 
    updateFn: (index: number, data: CepUpdateData) => void
  ) => {
    const cleanCep = cep.replace(/\D/g, "");
    
    // Validação básica de tamanho
    if (cleanCep.length !== 8) return;

    setIsSearchingCep(index);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      
      if (!data.erro) {
        // ✅ Retornamos os dados formatados com tipos definidos
        updateFn(index, {
          street: data.logradouro,
          city: `${data.localidade} - ${data.uf}`,
          zipCode: cleanCep.replace(/(\d{5})(\d{3})/, "$1-$2") // Formata: 00000-000
        });
        
        toast.success("Endereço localizado!");
      } else {
        toast.error("CEP não encontrado.");
      }
    } catch (err) {
      console.error("Erro na busca de CEP:", err);
      toast.error("Erro ao procurar CEP. Verifique sua conexão.");
    } finally {
      setIsSearchingCep(null);
    }
  };

  return { isSearchingCep, searchCep };
}