import { Loader2, CreditCard, MapPin, CheckCircle2, Store, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCheckoutLogic } from "./../pages/checkout/logic/useCheckoutLogic"; // ✅ Importando o hook poderoso

export default function CheckoutPage() {
  // ✅ Usando toda a lógica centralizada que já revisamos
  const vm = useCheckoutLogic(); 

  if (vm.authLoading || !vm.cart.items.length) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans">
      <div className="container max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-black mb-8 text-slate-900">Finalizar Pedido</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA DA ESQUERDA (Endereço, Dados, Pagamento) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Identificação (Simplificado aqui, mas vm.state tem tudo) */}
            <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white border-b border-slate-100 pb-4">
                <CardTitle>Seus Dados</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid gap-4">
                <div>
                  <Label>Nome Completo</Label>
                  <Input 
                    value={vm.customerName} 
                    onChange={(e) => vm.setCustomerName(e.target.value)} 
                    placeholder="Seu nome"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CPF</Label>
                    <Input 
                      value={vm.customerCpf} 
                      onChange={(e) => vm.setCustomerCpf(e.target.value)} 
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input 
                      value={vm.shippingPhone} 
                      onChange={(e) => vm.setShippingPhone(e.target.value)} 
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Entrega */}
            <Card className="rounded-2xl border-none shadow-sm">
              <CardHeader><CardTitle>Entrega</CardTitle></CardHeader>
              <CardContent>
                <div className="flex bg-slate-100 p-1 rounded-lg mb-6 max-w-fit">
                  <Button 
                    variant={vm.selectedShippingType === 'delivery' ? 'secondary' : 'ghost'} 
                    onClick={() => vm.handleShippingTypeChange('delivery')}
                    className="rounded-md transition-all font-bold"
                  >
                    Entrega
                  </Button>
                  {vm.pickupEnabled && (
                    <Button 
                      variant={vm.selectedShippingType === 'pickup' ? 'secondary' : 'ghost'} 
                      onClick={() => vm.handleShippingTypeChange('pickup')}
                      className="rounded-md transition-all font-bold"
                    >
                      Retirada
                    </Button>
                  )}
                </div>

                {vm.selectedShippingType === 'delivery' ? (
                  <div className="space-y-3">
                    {vm.addressesList.map((addr: any) => (
                      <button 
                        key={addr.id} 
                        onClick={() => vm.handleAddressSelect(String(addr.id))} 
                        className={`w-full flex items-center gap-4 p-4 border rounded-xl transition-all text-left group ${
                          vm.selectedAddressId === String(addr.id) 
                            ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600' 
                            : 'border-slate-200 hover:border-emerald-200'
                        }`}
                      >
                        <div className={`p-2 rounded-full ${vm.selectedAddressId === String(addr.id) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                          <MapPin size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 text-sm">
                            {addr.street}, {addr.number}
                          </p>
                          <p className="text-xs text-slate-500">{addr.neighborhood} - {addr.city}</p>
                        </div>
                        {vm.selectedAddressId === String(addr.id) && <CheckCircle2 className="text-emerald-600" size={20} />}
                      </button>
                    ))}
                    {vm.addressesList.length === 0 && (
                      <p className="text-sm text-slate-400 italic py-2">Nenhum endereço cadastrado. Use o botão abaixo para adicionar.</p>
                    )}
                    {/* Botão de adicionar endereço poderia vir aqui */}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                    <Store className="text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold text-amber-800">{vm.pickupLabel}</p>
                      <p className="text-sm text-amber-700 mt-1">{vm.pickupInstruction}</p>
                      <p className="text-xs font-mono mt-2 text-amber-900/70">{vm.storeAddress}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Pagamento */}
            <Card className="rounded-2xl border-none shadow-sm">
              <CardHeader><CardTitle>Pagamento</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {vm.paymentMethods.map((m: any) => (
                    <button 
                      key={m.id} 
                      onClick={() => vm.setSelectedPaymentMethod(m.id)} 
                      className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-3 transition-all h-24 ${
                        vm.selectedPaymentMethod === m.id 
                          ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {m.brandLogoUrl ? (
                        <img src={m.brandLogoUrl} alt={m.name} className="h-6 object-contain" />
                      ) : (
                        <CreditCard size={24} className={vm.selectedPaymentMethod === m.id ? "text-emerald-600" : "text-slate-400"} />
                      )}
                      <span className="text-xs font-bold text-slate-700 text-center leading-tight">{m.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Campo de Observações */}
            <div className="pt-2">
              <Label className="mb-2 block">Observações do Pedido</Label>
              <Input 
                value={vm.notes} 
                onChange={(e) => vm.setNotes(e.target.value)} 
                placeholder="Ex: Tirar a cebola, caprichar no molho..." 
                className="bg-white"
              />
            </div>
          </div>

          {/* COLUNA DA DIREITA (Resumo) */}
          <aside className="lg:col-span-1">
            <Card className="bg-white shadow-xl shadow-slate-200/50 border-none rounded-[2rem] p-6 sticky top-6">
              <h2 className="text-xl font-black mb-6">Resumo</h2>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{vm.money(vm.subtotal)}</span>
                </div>
                
                {vm.shippingCost > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Entrega</span>
                    <span>{vm.money(vm.shippingCost)}</span>
                  </div>
                )}

                {/* ✅ Exibição correta da Fidelidade */}
                {vm.loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span className="flex items-center gap-1"><Sparkles size={14}/> Fidelidade</span>
                    <span>-{vm.money(vm.loyaltyDiscount)}</span>
                  </div>
                )}

                {/* Cupom e outros descontos */}
                {(vm.couponDiscount > 0 || vm.autoDiscount > 0) && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Descontos</span>
                    <span>-{vm.money(vm.couponDiscount + vm.autoDiscount)}</span>
                  </div>
                )}
                
                <div className="border-t border-dashed border-slate-200 my-4" />
                
                <div className="flex justify-between items-end">
                  <span className="font-bold text-lg text-slate-900">Total</span>
                  <div className="text-right">
                    <span className="block text-3xl font-black text-slate-900 leading-none">
                      {vm.money(vm.finalTotal)}
                    </span>
                    {vm.selectedPaymentMethod && (
                      <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                        pagamento via {vm.paymentMethods.find((p: any) => p.id === vm.selectedPaymentMethod)?.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                onClick={vm.handlePlaceOrder} 
                disabled={vm.isSubmitting || vm.isDeliveryBlocked} 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-14 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
              >
                {vm.isSubmitting ? <Loader2 className="animate-spin" /> : "FINALIZAR PEDIDO"}
              </Button>
              
              {/* Mensagens de erro de bloqueio */}
              {vm.isDeliveryBlocked && (
                <div className="mt-3 text-center">
                  {vm.isBelowMin && (
                    <p className="text-xs font-bold text-red-500">
                      {vm.minOrderMessage || `Mínimo: ${vm.money(vm.minOrderAmount)}`}
                    </p>
                  )}
                  {vm.isZipOutOfArea && (
                    <p className="text-xs font-bold text-red-500">CEP indisponível para entrega</p>
                  )}
                  {vm.selectedShippingType === 'delivery' && !vm.selectedAddressId && (
                    <p className="text-xs text-amber-600">Selecione um endereço</p>
                  )}
                </div>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}