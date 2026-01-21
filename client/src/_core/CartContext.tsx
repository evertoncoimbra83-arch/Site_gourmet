import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { trpc } from "@/_core/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useProgressiveDiscount } from "@/_core/hooks/useProgressiveDiscount"; 
import { toast } from "@/components/ui/use-toast";

// --- INTERFACES ---
export interface LocalCartItem {
  id: string;
  itemType: "dish" | "package";
  dishId?: number;
  packageId?: number | string;
  sizeId?: number;
  quantity: number;
  addedAt: number;
  price?: number;
  name?: string;
  image?: string;
  notes?: string; 
  options?: any; // Os acompanhamentos agora vivem exclusivamente aqui
  appliedNutrition?: any;
  packageDetails?: any[]; 
  _sizeLabel?: string; 
}

interface CartTotals {
  subtotal: number;
  loyaltyDiscount: number;
  couponDiscount: number;
  autoDiscount: number;
  total: number;
  shipping: number;
  couponCode?: string;
}

export interface CartContextType {
  items: LocalCartItem[];
  addItem: (item: Omit<LocalCartItem, "id" | "addedAt">) => Promise<string>;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  isAdding: boolean;
  totals: CartTotals;
  isLoading: boolean;
  cartId: string | null;
  usesLoyalty: boolean;
  toggleLoyalty: (enabled: boolean) => void;
  loyaltyPoints: number;
  money: (v: number) => string;
  currentTier: any;
  nextTier: any;
  progress: number;
  autoDiscountName: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [usesLoyalty, setUsesLoyalty] = useState(false);
  const [autoDiscountName, setAutoDiscountName] = useState<string | null>(null);

  const { data: serverCart, isLoading: isCartLoading } = (trpc as any).cart.getSummary.useQuery(undefined, { 
    refetchOnWindowFocus: true,
    staleTime: 3000,
  });

  const { data: loyaltyBalanceData } = trpc.loyalty.getUserBalance.useQuery(undefined, { 
    enabled: !!user 
  });

  const addItemMutation = (trpc as any).cartItems.addItem.useMutation();
  const updateQuantityMutation = (trpc as any).cartItems.updateQuantity.useMutation();
  const removeItemMutation = (trpc as any).cartItems.removeItem.useMutation();
  const toggleLoyaltyMutation = (trpc as any).cart.toggleLoyalty.useMutation();

  const totalQuantity = useMemo(() => items.reduce((acc, item) => acc + item.quantity, 0), [items]);
  const { currentTier, tiers } = useProgressiveDiscount({ itemCount: totalQuantity });

  const { nextTier, progress } = useMemo(() => {
    const next = tiers?.find(t => t.minQuantity > totalQuantity);
    let prog = 0;
    if (next) {
      const currentMin = currentTier?.minQuantity || 0;
      prog = Math.min(100, ((totalQuantity - currentMin) / (next.minQuantity - currentMin)) * 100);
    } else if (tiers?.length > 0) {
      prog = 100;
    }
    return { nextTier: next || null, progress: prog };
  }, [totalQuantity, currentTier, tiers]);

  // 🔄 SINCRONIZAÇÃO SERVIDOR -> LOCAL
  useEffect(() => {
    if (serverCart && serverCart.items) {
      const mappedItems: LocalCartItem[] = serverCart.items.map((item: any) => {
        let config: any = {};
        try {
          config = typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || {});
        } catch (e) { config = {}; }

        let nutrition: any = {};
        try {
          nutrition = typeof item.appliedNutrition === 'string' ? JSON.parse(item.appliedNutrition) : (item.appliedNutrition || {});
        } catch (e) { nutrition = {}; }

        let rawImage = item.imageUrl || item.dish?.image || item.package?.image || "";
        let finalImage = rawImage.startsWith("http") ? rawImage : `${API_BASE_URL}/uploads/${rawImage.replace(/^\/+/, '')}`;

        return {
          id: item.id.toString(),
          itemType: config._type === "multi" ? "package" : "dish",
          dishId: item.dishId ? Number(item.dishId) : undefined,
          packageId: item.packageId ? String(item.packageId) : undefined,
          quantity: Number(item.quantity || 1),
          price: Number(item.unitPrice || 0),
          name: item.name || config.dishName || config.packageName || "Item",
          image: finalImage,
          options: config,
          appliedNutrition: nutrition,
          // ✅ Os acompanhamentos agora são acessados via config.selectedAccompaniments onde necessário
          packageDetails: config.meals || [],
          _sizeLabel: config.selectedSize?.name || "",
          addedAt: new Date(item.createdAt || Date.now()).getTime(),
        };
      });

      setItems(mappedItems);
      setUsesLoyalty(!!serverCart.usesLoyalty);
      setAutoDiscountName((serverCart as any).autoDiscountName || null);
    } else if (!isCartLoading && !serverCart) {
      setItems([]);
    }
  }, [serverCart, isCartLoading]);

  const money = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  const totals = useMemo(() => {
    const s = serverCart?.totals || {};
    const subtotalLocal = items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
    return {
      subtotal: Number(s.subtotal || subtotalLocal),
      shipping: Number(s.shipping || 0),
      loyaltyDiscount: typeof s.loyaltyDiscount === 'number' ? s.loyaltyDiscount : 0,
      couponDiscount: Number(s.couponDiscount || 0),
      autoDiscount: Number(s.autoDiscount || 0),
      total: Number(s.total || s.final || 0),
      couponCode: s.couponCode || ""
    };
  }, [serverCart, items]);

  return (
    <CartContext.Provider 
      value={{ 
        items, 
        addItem: async (item) => {
          // ✅ Unificamos tudo em optionsPayload, eliminando a dependência do campo separado
          const optionsForDb = { ...(item.options || {}) };
          
          // Limpeza de segurança
          if (optionsForDb.appliedNutrition) delete optionsForDb.appliedNutrition;

          const payload = {
            dishId: item.dishId,
            packageId: item.packageId,
            quantity: item.quantity,
            totalUnitPrice: item.price,
            optionsPayload: optionsForDb,
            nutritionPayload: item.appliedNutrition
          };

          const res = await addItemMutation.mutateAsync(payload);
          utils.cart.getSummary.invalidate();
          return res.cartItemId;
        },
        removeItem: async (itemId) => {
          try {
            await removeItemMutation.mutateAsync({ cartItemId: itemId });
            utils.cart.getSummary.invalidate();
          } catch (err) { toast.error("Erro ao remover item"); }
        }, 
        updateQuantity: async (itemId, quantity) => {
          if (quantity < 1) {
             try {
               await removeItemMutation.mutateAsync({ cartItemId: itemId });
               utils.cart.getSummary.invalidate();
             } catch (err) { toast.error("Erro ao remover item"); }
             return;
          }
          try {
            await updateQuantityMutation.mutateAsync({ cartItemId: itemId, quantity });
            utils.cart.getSummary.invalidate();
          } catch (err) { toast.error("Erro ao atualizar quantidade"); }
        }, 
        clearCart: () => {
          setItems([]);
          utils.cart.getSummary.invalidate();
        }, 
        getTotalItems: () => totalQuantity, 
        isAdding: addItemMutation.isPending, 
        isLoading: isCartLoading, 
        totals, 
        cartId: serverCart?.cartId || null, 
        usesLoyalty, 
        toggleLoyalty: async (active: boolean) => {
          if (!user) {
            toast.error("Faça login para usar seus pontos de fidelidade");
            return;
          }
          setUsesLoyalty(active);
          try {
            await toggleLoyaltyMutation.mutateAsync({ cartId: serverCart?.cartId, active });
            utils.cart.getSummary.invalidate();
          } catch (err) {
            toast.error("Erro ao alterar fidelidade");
            setUsesLoyalty(!active);
          }
        }, 
        loyaltyPoints: Number(loyaltyBalanceData?.balance || 0), 
        money,
        currentTier,
        nextTier,
        progress,
        autoDiscountName
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de um CartProvider");
  return context;
};