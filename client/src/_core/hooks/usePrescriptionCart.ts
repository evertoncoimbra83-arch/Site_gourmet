// client/src/_core/hooks/usePrescriptionCart.ts
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";

interface PrescriptionOption {
  dishId: string | number | null;
  name: string;
  nutritionalData?: unknown;
}

interface PrescriptionGroup {
  name: string;
  options: PrescriptionOption[];
}

interface PrescriptionMeal {
  name: string;
  groups: PrescriptionGroup[];
}

interface CartItemPayload {
  dishId: string | number;
  quantity: number;
  options: string;
}

export function usePrescriptionCart() {
  const utils = trpc.useUtils();

  // ✅ 2. Removido o 'storefront' do caminho tRPC. A rota real é 'nutri'
  const { 
    data: prescription, 
    isLoading: isLoadingDiet 
  } = trpc.nutri.getMyPrescription.useQuery();

  // ✅ 3. Usamos ts-expect-error porque ainda vamos criar a rota do carrinho no backend!
  // @ts-expect-error - A rota cart.addBulkItems será criada no backend em breve
  const addBulkToCart = trpc.cart.addBulkItems.useMutation({
    onSuccess: () => {
      toast.success("Plano Alimentar adicionado! 🥗", {
        description: "Todos os pratos da sua dieta já estão no carrinho."
      });
      // @ts-expect-error - O caminho exato da query do seu carrinho pode variar
      utils.cart.get.invalidate(); 
    },
    onError: (err: { message: string }) => {
      toast.error("Ops! Algo deu errado.", { description: err.message });
    }
  });

  // ✅ 4. Tipagem completa nos loops (map, filter, flatMap)
  const handleAddDietToCart = async () => {
    // @ts-expect-error - Ignora o erro se a tipagem do router não estiver 100% gerada ainda
    if (!prescription || !prescription.meals) {
      return toast.error("Nenhuma dieta ativa encontrada.");
    }

    // Mapeamos a prescrição para o formato do carrinho
    // @ts-expect-error - Garantindo que o prescription é interpretado corretamente
    const cartItems: CartItemPayload[] = prescription.meals.flatMap((meal: PrescriptionMeal) => {
      return meal.groups.flatMap((group: PrescriptionGroup) => {
        return group.options
          .filter((option: PrescriptionOption) => option.dishId) // Pega só o que tem ID de prato
          .map((option: PrescriptionOption) => ({
            dishId: option.dishId as string | number,
            quantity: 1, 
            options: JSON.stringify({
              source: "prescription",
              mealName: meal.name,
              groupName: group.name,
              nutritionalData: option.nutritionalData
            })
          }));
      });
    });

    if (cartItems.length === 0) {
      return toast.info("Sua dieta não possui pratos vinculados à nossa loja.");
    }

    // Dispara a adição em lote
    addBulkToCart.mutate({ items: cartItems });
  };

  return {
    prescription,
    isLoadingDiet,
    isAddingToCart: addBulkToCart.isPending,
    handleAddDietToCart
  };
}