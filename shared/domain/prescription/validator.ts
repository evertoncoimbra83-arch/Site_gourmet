// shared/domain/prescription/validator.ts
import { DietSnapshot, PrescriptionValidation } from "./types";
import { CartItem } from "../cart/types";

export function validateDietAdherence(
  cartItems: CartItem[],
  activePrescription: DietSnapshot
): PrescriptionValidation {
  const now = new Date();
  const expirationDate = new Date(activePrescription.expiresAt);
  const isExpired = now > expirationDate;

  if (isExpired) {
    return {
      isValid: false,
      isExpired: true,
      violations: [],
      message: "A sua prescrição expirou. É necessária uma nova avaliação."
    };
  }

  // Exemplo de regra: O carrinho não pode ter mais calorias que a dieta permite (se houver esse dado)
  // Ou validar se itens fora da lista da dieta foram adicionados
  const allowedIds = new Set(activePrescription.meals.map(m => String(m.id)));
  const outsiders = cartItems.filter(item => !allowedIds.has(String(item.id)));

  const hasViolations = outsiders.length > 0;

  return {
    isValid: !hasViolations,
    isExpired: false,
    violations: outsiders.map(i => i.name),
    message: hasViolations 
      ? `Atenção: Os itens [${outsiders.map(i => i.name).join(", ")}] não fazem parte da sua dieta.`
      : "Pedido em total conformidade com a sua dieta! 🎯"
  };
}