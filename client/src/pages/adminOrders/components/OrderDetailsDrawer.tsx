// e:/IA/projects/Site_React/client/src/pages/adminOrders/components/OrderDetailsDrawer.tsx

import React, { useRef, useState, useEffect, useMemo, ComponentProps } from "react";
import { useReactToPrint } from "react-to-print"; 
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Loader2, RotateCcw, Edit3, Printer, Tag, CreditCard, Link as LinkIcon, MessageCircle } from "lucide-react"; 
import { appToast as toast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";
import { statusLabels } from "../logic/useAdminOrders"; 

// Hooks e Componentes
import { useLabelLogic } from "./orderDrawer/print/logic/useLabelLogic";
import { LabelCanvas, LabelElement } from "./orderDrawer/print/design/LabelCanvas";
import { AdminOrderCustomer } from "./orderDrawer/AdminOrderCustomer";
import { AdminOrderItems } from "./orderDrawer/AdminOrderItems";
import { AdminOrderPayment } from "./orderDrawer/AdminOrderPayment";
import OrderPrintTemplate, { type OrderData as TemplateOrderData } from "./orderDrawer/print/OrderPrintTemplate"; 

// --- INTERFACES ---

interface Accompaniment {
  name: string;
  weight?: number | string;
  groupId?: number | string;
  id?: number | string;
}

interface Meal {
  slotName?: string;
  label?: string; 
  dishName?: string;
  selectedAccompaniments?: Accompaniment[];
  accompaniments?: Accompaniment[]; 
  energy_kcal?: number | string;
  energyKcal?: number | string;
}

interface OrderOptions {
  _type?: string;
  isPackage?: boolean;
  dishName?: string;
  packageName?: string;
  dishId?: string | number;
  selectedSizeName?: string;
  meals?: Meal[];
  selectedAccs?: Accompaniment[];
  selectedAccompaniments?: Accompaniment[];
}

interface OrderItem {
  id: string | number;
  name?: string;
  dishName?: string;
  dish_name?: string;
  quantity: number;
  options?: string | OrderOptions;
  parsedOptions?: OrderOptions; 
  applied_nutrition?: unknown; 
  packageItems?: Meal[]; 
  size_name?: string;
  package_id?: string | number;
}

export interface LocalOrderData {
  id: string;
  userId: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress?: string;
  shippingAddressNumber?: string;
  shippingAddressComplement?: string;
  shippingNeighborhood?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZipCode?: string;
  deliveryType?: 'pickup' | 'delivery';
  total: number;
  subtotal: number;
  shippingCost?: number;
  items: OrderItem[];
  createdAt?: string;
  discountsSnapshot?: string; 
  notes?: string;
  paymentMethodName?: string;
  paymentMethod?: string;
  payment_method?: string;
  paymentLink?: string; 
  [key: string]: unknown;
}

interface LabelTemplate {
  id: string;
  name: string;
  elements: LabelElement[];
  config: { width: number; height: number };
}

interface OrderDrawerProps {
  orderId: string | number | null;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: string) => void;
  onUpdateOrder?: (data: LocalOrderData) => Promise<void>;
  isUpdating?: boolean;
}

export default function OrderDetailsDrawer({ 
  orderId, 
  onClose, 
  onUpdateStatus = () => {}, 
  onUpdateOrder = async () => {}, 
  isUpdating = false 
}: OrderDrawerProps) {
  
  const utils = trpc.useUtils();
  
  // ✅ CORREÇÃO: Usando a rota "orders"
  const { data: orderRaw, isLoading, refetch } = trpc.admin.orders.getById.useQuery(
    { orderId: String(orderId) },
    { enabled: !!orderId }
  );

  // ✅ CORREÇÃO: Usando a rota "labels.getTemplates"
  const { data: libraryTemplatesRaw } = trpc.admin.labels.getTemplates.useQuery();

  // ✅ CORREÇÃO: Usando a rota "orders" e tipando o erro
  const generateLinkMutation = trpc.admin.orders.generatePaymentLink.useMutation({
    onSuccess: () => {
      toast.success("Link do PagSeguro gerado!");
      refetch(); 
    },
    onError: (err: { message: string }) => toast.error("Erro: " + err.message)
  });

  const order = useMemo(() => {
    if (!orderRaw) return null;
    const raw = orderRaw as Record<string, unknown>;
    
    let rawItems = (raw.items || raw.orderItems || raw.order_items || []) as unknown[];
    if (typeof rawItems === 'string') {
      try { rawItems = JSON.parse(rawItems); } catch { rawItems = []; }
    }

    const processedItems: OrderItem[] = (rawItems as Record<string, unknown>[]).map((item) => {
      let parsedOpts = item.options as OrderOptions | string;
      if (typeof parsedOpts === 'string') {
        try { parsedOpts = JSON.parse(parsedOpts) as OrderOptions; } catch { parsedOpts = {}; }
      }
      const optsObj = parsedOpts as OrderOptions;
      return {
        ...item,
        id: String(item.id || ''),
        quantity: Number(item.quantity || 1),
        parsedOptions: optsObj,
        packageItems: (item.packageItems || item.package_items || optsObj?.meals || []) as Meal[]
      } as OrderItem;
    });

    return {
      ...raw,
      id: String(raw.id || ''),
      paymentMethodName: (raw.paymentMethod || raw.payment_method || raw.paymentMethodName || "Não informado") as string,
      paymentLink: (raw.paymentLink || raw.payment_link || undefined) as string | undefined,
      subtotal: Number(raw.subtotal ?? (Number(raw.total || 0) - Number(raw.shippingCost || raw.shipping_cost || 0))),
      total: Number(raw.total || 0),
      items: processedItems,
    } as LocalOrderData;
  }, [orderRaw]);

  const ticketRef = useRef<HTMLDivElement>(null);
  const quickLabelRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<LocalOrderData | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedItemForLabel, setSelectedItemForLabel] = useState<OrderItem | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const parsedLibrary = useMemo((): LabelTemplate[] => {
    const raw = (libraryTemplatesRaw as Record<string, unknown>[]) || [];
    return raw.map((tmpl) => ({
      id: String(tmpl.id),
      name: String(tmpl.name),
      elements: typeof tmpl.elements === 'string' ? JSON.parse(tmpl.elements) : (tmpl.elements as LabelElement[]),
      config: { 
        width: Number(tmpl.width || 100), 
        height: Number(tmpl.height || 60) 
      }
    }));
  }, [libraryTemplatesRaw]);

  useEffect(() => {
    if (parsedLibrary.length > 0 && !selectedTemplateId) setSelectedTemplateId(parsedLibrary[0].id);
  }, [parsedLibrary, selectedTemplateId]);

  const activeTemplate = parsedLibrary.find((t) => t.id === selectedTemplateId);

  const { parseContent } = useLabelLogic(
    (selectedItemForLabel && order ? ({ ...order, items: [selectedItemForLabel] }) : null) as unknown as Record<string, unknown> | null, 
    0, 
    90 
  );

  const handlePrintTicket = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Pedido_${orderId}`
  });

  const handlePrintLabel = useReactToPrint({
    contentRef: quickLabelRef,
    documentTitle: `Etiqueta_${selectedItemForLabel?.dishName || 'Item'}`
  });

  useEffect(() => { if (order) setEditForm(order); }, [order]);

  const handleSaveEdit = async () => {
    if (!editForm) return;
    try {
      await onUpdateOrder(editForm);
      setIsEditing(false);
      refetch();
      // ✅ CORREÇÃO: Usando a rota "orders" no Invalidate
      utils.admin.orders.list.invalidate();
      toast.success("Pedido atualizado!");
    } catch { toast.error("Falha ao salvar"); }
  };

  if (!orderId) return null;

  if (isLoading || !editForm || !order) return (
    <div className="fixed inset-0 z-60 flex justify-end">
       <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white flex items-center justify-center border-l shadow-2xl">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-[#FBFBFC] h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-100 animate-in slide-in-from-right duration-300">
          
          <div style={{ position: "absolute", top: "-9999px", left: "-9999px", pointerEvents: "none" }}>
              <div ref={ticketRef}>
                <OrderPrintTemplate order={(order as unknown as TemplateOrderData)} />
              </div>
              <div ref={quickLabelRef}>
                {selectedItemForLabel && activeTemplate && (
                  <div style={{ width: `${activeTemplate.config.width}mm`, height: `${activeTemplate.config.height}mm`, backgroundColor: "white" }}>
                    <LabelCanvas 
                      elements={activeTemplate.elements} 
                      setElements={() => {}} 
                      isDesignMode={false} 
                      selectedId={null} 
                      setSelectedId={() => {}} 
                      parseContent={(c) => parseContent(c, 0)} 
                      zoom={1} 
                      isPrintMode={true}
                    />
                  </div>
                )}
              </div>
          </div>

          <div className="p-6 bg-white border-b border-slate-100 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black uppercase text-slate-900 italic tracking-tighter">
                Pedido <span className="text-emerald-600">#{String(orderId).slice(-6)}</span>
              </h2>
              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(!isEditing)} size="sm" variant={isEditing ? "destructive" : "outline"} className="h-9 rounded-xl font-black uppercase text-[10px]">
                  {isEditing ? <RotateCcw size={14} className="mr-1" /> : <Edit3 size={14} className="mr-1" />} 
                  {isEditing ? "Cancelar" : "Editar"}
                </Button>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}><X size={20} /></Button>
              </div>
            </div>
            {!isEditing && (
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black uppercase text-slate-400 ml-2">Status:</span>
                <select value={String(order.status)} onChange={(e) => onUpdateStatus(String(order.id), e.target.value)} className="flex-1 bg-transparent border-none text-xs font-black uppercase text-emerald-600 outline-none cursor-pointer">
                  {Object.entries(statusLabels).map(([val, label]) => ( <option key={val} value={val}>{label}</option> ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32 custom-scrollbar">
            {/* ✅ FIX: Tipagem segura usando ComponentProps para extrair as definições do componente filho */}
            <AdminOrderCustomer 
              order={(order as unknown as ComponentProps<typeof AdminOrderCustomer>["order"])} 
              isEditing={isEditing}
              editForm={(editForm as unknown as ComponentProps<typeof AdminOrderCustomer>["editForm"])}
              setEditForm={(val) => setEditForm(val as unknown as LocalOrderData)}
            />

            {(order.notes || isEditing) && (
              <div className={cn("p-4 rounded-2xl border", isEditing ? "bg-white border-slate-200 shadow-sm" : "bg-amber-50 border-amber-200")}>
                <span className={cn("text-[10px] font-black uppercase block mb-2 tracking-widest", isEditing ? "text-slate-500" : "text-amber-600")}>Notas Internas</span>
                {isEditing ? (
                  <textarea value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 resize-none" rows={3} />
                ) : (
                  <p className="text-sm font-bold text-amber-900 whitespace-pre-wrap">{order.notes}</p>
                )}
              </div>
            )}

            <AdminOrderItems 
              items={editForm.items}
              isEditing={isEditing}
              onPrintLabel={(item) => { setSelectedItemForLabel(item); setPrintModalOpen(true); }} 
            />

            <AdminOrderPayment order={order} isEditing={isEditing} isUpdating={isUpdating} onSave={handleSaveEdit} onPrint={handlePrintTicket} />

            {!isEditing && (
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"> <CreditCard size={14} className="text-indigo-500" /> Checkout Digital </h3>
                  {!order.paymentLink && (
                    <Button size="sm" onClick={() => generateLinkMutation.mutate({ orderId: String(order.id) })} disabled={generateLinkMutation.isPending} className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] uppercase rounded-xl">
                      {generateLinkMutation.isPending ? <Loader2 className="animate-spin mr-1" size={12}/> : <LinkIcon size={12} className="mr-1"/>} Gerar Link
                    </Button>
                  )}
                </div>
                {order.paymentLink && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 truncate mr-2 font-mono pl-2">{order.paymentLink}</span>
                      <Button variant="ghost" size="sm" className="h-7 px-3 text-[9px] uppercase font-black shrink-0 bg-slate-100 rounded-lg text-slate-600" onClick={() => { if (order.paymentLink) { navigator.clipboard.writeText(order.paymentLink); toast.success("Copiado!"); } }}> Copiar </Button>
                    </div>
                    <Button onClick={() => {
                        if (!order.paymentLink) return;
                        const msg = `Olá! Segue o link seguro para o pagamento do seu pedido na Gourmet Saudável: ${order.paymentLink}`;
                        const phone = String(order.customerPhone || "").replace(/\D/g, "");
                        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                      }} className="w-full h-11 bg-[#25D366] hover:bg-[#1DA851] text-white font-black uppercase text-[11px] rounded-xl flex items-center justify-center gap-2">
                      <MessageCircle size={16} /> Enviar WhatsApp
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-white z-100">
          <DialogHeader> <DialogTitle className="font-black uppercase italic text-lg flex items-center gap-2"> <Tag size={18} className="text-emerald-500"/> Etiqueta </DialogTitle> </DialogHeader>
          <div className="space-y-4 py-2 text-left">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Item</span>
              <p className="text-xs font-bold text-slate-800 line-clamp-2 uppercase">{selectedItemForLabel?.dishName || selectedItemForLabel?.name}</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Layout</label>
              {parsedLibrary.length > 0 && (
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 font-bold text-xs outline-none"> <SelectValue /> </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {parsedLibrary.map((tmpl) => ( <SelectItem key={tmpl.id} value={tmpl.id} className="font-bold text-xs uppercase">{tmpl.name}</SelectItem> ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button onClick={() => handlePrintLabel()} disabled={!selectedTemplateId} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[10px] shadow-lg transition-all"> <Printer size={16} className="mr-2"/> Imprimir </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}