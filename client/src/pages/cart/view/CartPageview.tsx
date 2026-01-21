import React, { useState, useMemo, useEffect } from "react";
import { useCartPageLogic } from "./../logic/useCartPageLogic";
import { ChevronLeft, ShoppingBag, Loader2 } from "lucide-react"; 
import { Link } from "wouter";
import { AnimatePresence } from "framer-motion"; 

import { CartItem } from "./../view/parts/CartItemRow"; 
import { CartSummary } from "./../view/parts/CartSummary"; 
import CartLoyalty from "./../view/parts/CartLoyalty"; 
import { DiscountRoadmap } from "./../view/parts/DiscountRoadmap"; 

export function CartPageView() {
  const [couponInput, setCouponInput] = useState("");
  const logic = useCartPageLogic();

  const {
    items = [], 
    totals, 
    handleApplyCoupon, 
    handleRemoveCoupon, 
    updateQuantity, 
    removeItem, 
    money, 
    isLoading, 
    isCartEmpty, 
    handleCheckout, 
    discountsInfo, 
    allTiers, 
    totalQuantity,
    cartId
  } = logic;

  // 🔄 PROCESSAMENTO DE ITENS (Sincronizado com o novo Schema)
  const processedItems = useMemo(() => {
    return items.map((item: any, index: number) => {
      // ✅ Prioridade absoluta para os dados do objeto 'options' (JSON do banco)
      // O CartContext já fez o JSON.parse, aqui apenas consumimos.
      const options = item.options || {};
      
      // Resolvemos o label de tamanho de forma unificada
      const sizeLabel = options.selectedSize?.name || item._sizeLabel || item.sizeName || null;
      
      // Verificamos se é pacote (Kit)
      const isPkg = item.itemType === 'package' || !!options.meals || (item.packageDetails?.length > 0);

      // Limpeza de imagem (Fallback para ícone se a URL for inválida ou genérica)
      let finalImage = item.image || item.imageUrl;
      if (!finalImage || String(finalImage).includes('undefined') || String(finalImage).includes('null')) {
        finalImage = null;
      }

      return { 
        ...item,
        image: finalImage,
        uniqueKey: item.id || `row-${index}-${item.dishId || item.packageId}`,
        isPackage: isPkg, 
        _sizeLabel: sizeLabel,
        
        // ✅ MAPIAMENTO CRUCIAL:
        // Pega do JSON options (onde salvamos no backend) ou usa o fallback antigo
        accompaniments: options.selectedAccompaniments || item.accompaniments || [],
        packageDetails: options.meals || item.packageDetails || [],
        
        // Garante que a nutrição chegue no componente para mostrar o ícone de chama 🔥
        appliedNutrition: options.appliedNutrition || item.appliedNutrition || null
      };
    });
  }, [items]);

  if (isLoading && items.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-emerald-600 h-10 w-10 opacity-40" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando sacola...</p>
        </div>
      </div>
    );
  }

  if (isCartEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center bg-[#FBFBFC] p-20">
        <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 mb-8">
          <ShoppingBag size={48} className="text-emerald-100" />
        </div>
        <h2 className="text-2xl font-black uppercase italic text-slate-900 tracking-tighter">Sua sacola está vazia</h2>
        <p className="text-slate-400 text-sm mt-2 font-medium">Seus pratos favoritos estão a um clique de distância.</p>
        <Link href="/produtos">
          <button className="mt-8 bg-slate-900 text-white font-black px-10 h-14 rounded-2xl uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-600 transition-all active:scale-95">
            Explorar Cardápio
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-10 pb-32">
      <div className="max-w-2xl mx-auto px-4 space-y-8">
        
        {/* Header com Navegação */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/produtos">
              <div className="h-10 w-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl cursor-pointer shadow-sm hover:bg-slate-50 transition-colors">
                <ChevronLeft size={20} strokeWidth={3} className="text-slate-900" />
              </div>
            </Link>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Minha Sacola</h1>
          </div>
          <div className="bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/10">
             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">{totalQuantity} unidades</span>
          </div>
        </div>

        {/* Roadmap de Desconto Progressivo */}
        <DiscountRoadmap tiers={allTiers} itemCount={totalQuantity} />

        {/* Lista de Itens do Carrinho */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {processedItems.map((group: any) => (
              <CartItem 
                key={group.uniqueKey} 
                group={group} 
                money={money} 
                updateQuantity={updateQuantity} 
                removeItem={removeItem} 
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Módulo de Pontos de Fidelidade */}
        <CartLoyalty />

        {/* Checkout & Resumo Financeiro */}
        <CartSummary 
          subtotal={totals.subtotal} 
          discount={totals.couponDiscount} 
          autoDiscount={totals.autoDiscount} 
          loyaltyDiscountValue={Number(totals.loyaltyDiscount) || 0} 
          shipping={totals.shipping}
          quantityRuleName={discountsInfo?.autoDiscountName} 
          couponCode={discountsInfo?.coupon?.code} 
          couponDescription={discountsInfo?.coupon?.description}
          removeCoupon={handleRemoveCoupon} 
          
          // Regra de acúmulo: 1 ponto a cada R$ 1,00 gasto (subtotal)
          earnedPoints={Math.floor(totals.subtotal)} 
          
          money={money} 
          goCheckout={handleCheckout} 
          isDeliveryAvailable={true} 
          couponInput={couponInput} 
          setCouponInput={setCouponInput} 
          
          // ✅ CORREÇÃO DE TIPO (Promise<void>): Aceita o código como argumento
          onApplyCoupon={async (codeStr) => {
             const codeToUse = codeStr || couponInput;
             if (codeToUse.trim()) {
               await handleApplyCoupon(codeToUse.trim());
               setCouponInput("");
             }
          }}
        />
      </div>
    </div>
  );
}