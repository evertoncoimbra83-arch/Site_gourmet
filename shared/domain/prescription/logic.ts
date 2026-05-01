// shared/domain/prescription/logic.ts
import { DietSnapshot, PrescriptionMeal, PrescriptionMealItem } from "./types";

/**
 * 🥗 Calcula o preço final de um item da prescrição aplicando o desconto da dieta
 */
export function calculatePrescriptionItemPrice(
  originalPrice: number,
  discountPercentage: number
): number {
  const discount = originalPrice * (discountPercentage / 100);
  return Number((originalPrice - discount).toFixed(2));
}

/**
 * 🔄 "Hidrata" o snapshot da dieta com os dados mais recentes
 * Percorre cada refeição e aplica o desconto nos pratos individuais.
 */
export function hydratePrescription(snapshot: DietSnapshot): DietSnapshot {
  return {
    ...snapshot,
    meals: snapshot.meals.map((meal: PrescriptionMeal) => ({
      ...meal,
      // Se a refeição tiver uma lista direta de pratos (dishes), hidratamos cada um
      dishes: meal.dishes?.map((item: PrescriptionMealItem) => ({
        ...item,
        price: calculatePrescriptionItemPrice(item.price, snapshot.discountPercentage)
      }))
    }))
  };
}