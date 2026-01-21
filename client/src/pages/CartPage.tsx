import { useLocation } from "wouter";
import { useCartPageLogic } from "./cart/logic/useCartPageLogic";
import { CartPageView } from "./cart/view/CartPageview";
import { SEO } from "@/components/SEO";

export default function CartPage() {
  const [, setLocation] = useLocation();
  const logic = useCartPageLogic();

  return (
    <CartPageView
      {...logic}
      goProducts={() => setLocation("/products")}
      goCheckout={() => setLocation("/checkout")}
    />
  );
}
