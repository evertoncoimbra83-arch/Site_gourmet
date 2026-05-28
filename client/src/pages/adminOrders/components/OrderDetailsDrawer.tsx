import React, { ComponentProps, useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import {
  AlertCircle,
  Edit3,
  ExternalLink,
  Loader2,
  Plus,
  Printer,
  RotateCcw,
  Tag,
  X,
} from "lucide-react";

import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { appToast as toast } from "@/lib/app-toast";
import { getAdminMutationErrorMessage } from "@/lib/admin-mutation-error";
import { safeJsonParse, safeNumber } from "@/lib/safe-parse";
import { requestStrongConfirmation } from "@/lib/strong-confirmation";
import { buildFlatLabels } from "../../adminLabelEditor/print-engine/logic";

import { statusLabels } from "../logic/useAdminOrders";
import {
  FINALIZED_ORDER_MESSAGE,
  isFinalizedOrderStatus,
} from "../logic/orderStatusGuards";
import { AdminOrderCustomer } from "./orderDrawer/AdminOrderCustomer";
import { AdminOrderItems } from "./orderDrawer/AdminOrderItems";
import { AdminOrderPayment } from "./orderDrawer/AdminOrderPayment";
import { LabelCanvas, LabelElement } from "./orderDrawer/print/design/LabelCanvas";
import {
  useLabelLogic,
  type OrderData as LabelOrderData,
  type OrderItem as LabelOrderItem,
} from "./orderDrawer/print/logic/useLabelLogic";
import OrderPrintTemplate, {
  type OrderData as TemplateOrderData,
} from "./orderDrawer/print/OrderPrintTemplate";
import type { CustomerOrderData } from "./orderDrawer/AdminOrderCustomer";
import type { OrderItem as DrawerOrderItem } from "./orderDrawer/AdminOrderItems";

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
  deliveryType?: "pickup" | "delivery";
  total: number;
  subtotal: number;
  shippingCost?: number;
  discountAmount?: number;
  paymentMethodName?: string;
  paymentMethod?: string;
  payment_method?: string;
  items: Array<Record<string, unknown>>;
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
  onUpdateOrder?: () => Promise<void> | void;
  isUpdating?: boolean;
}

function toSafeMoney(value: unknown, fallback = 0): number {
  return safeNumber(value, fallback);
}

export default function OrderDetailsDrawer({
  orderId,
  onClose,
  onUpdateStatus = () => {},
  onUpdateOrder = () => {},
  isUpdating = false,
}: OrderDrawerProps) {
  const utils = trpc.useUtils();

  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemQty, setNewItemQty] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<LocalOrderData | null>(null);
  const [justification, setJustification] = useState("");
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedItemForLabel, setSelectedItemForLabel] = useState<Record<string, unknown> | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const ticketRef = useRef<HTMLDivElement>(null);
  const quickLabelRef = useRef<HTMLDivElement>(null);

  const { data: orderRaw, isLoading, refetch } = trpc.admin.ordersAdmin.getById.useQuery(
    { orderId: String(orderId) },
    { enabled: !!orderId },
  );
  const { data: libraryTemplatesRaw } = trpc.admin.labels.getTemplates.useQuery();
  const { data: paymentMethodsRaw = [] } = trpc.admin.paymentMethods.listAll.useQuery();

  const generateLinkMutation = trpc.admin.ordersAdmin.generatePaymentLink.useMutation({
    onSuccess: () => {
      toast.success("Link do PagSeguro gerado!");
      refetch();
    },
    onError: (err: { message: string }) => toast.error(`Erro: ${err.message}`),
  });

  const commitAdministrativeEditMutation =
    trpc.admin.ordersAdmin.commitAdministrativeEdit.useMutation({
      onSuccess: () => {
        toast.success("Alterações salvas e auditadas com sucesso!");
      setIsEditing(false);
      setJustification("");
      refetch();
      onUpdateOrder();
      utils.admin.ordersAdmin.list.invalidate();
      },
      onError: (err) => toast.error(getAdminMutationErrorMessage(err, "Erro ao salvar ajuste administrativo.")),
    });

  const order = useMemo(() => {
    if (!orderRaw) return null;
    const raw = orderRaw as Record<string, unknown>;
    const rawItems =
      typeof raw.items === "string"
        ? safeJsonParse<Record<string, unknown>[]>(raw.items, [])
        : Array.isArray(raw.items)
          ? (raw.items as Record<string, unknown>[])
          : Array.isArray(raw.orderItems)
            ? (raw.orderItems as Record<string, unknown>[])
            : [];

    return {
      ...raw,
      id: String(raw.id || ""),
      userId: String(raw.userId || ""),
      status: String(raw.status || ""),
      customerName: String(raw.customerName || raw.name || ""),
      customerPhone: String(raw.customerPhone || raw.phone || ""),
      customerEmail:
        typeof raw.customerEmail === "string" ? raw.customerEmail : undefined,
      paymentMethodName: String(raw.paymentMethod || raw.paymentMethodName || "Não informado"),
      paymentLink:
        typeof raw.paymentLink === "string" ? raw.paymentLink : undefined,
      subtotal: toSafeMoney(
        raw.subtotal,
        toSafeMoney(raw.total) - toSafeMoney(raw.shippingCost),
      ),
      shippingCost: toSafeMoney(raw.shippingCost),
      discountAmount: toSafeMoney(raw.discount || raw.discountAmount),
      total: toSafeMoney(raw.total),
      items: rawItems.map((item) => ({
        ...item,
        id: String(item.id || ""),
        quantity: toSafeMoney(item.quantity, 1),
        unitPrice: toSafeMoney(item.unitPrice),
        dishName: String(item.dishName || item.dish_name || item.name || "Prato"),
      })),
    } as LocalOrderData;
  }, [orderRaw]);

  const parsedLibrary = useMemo<LabelTemplate[]>(() => {
    const raw = (libraryTemplatesRaw as Record<string, unknown>[]) || [];
    return raw.map((template) => ({
      id: String(template.id || ""),
      name: String(template.name || "Layout"),
      elements:
        typeof template.elements === "string"
          ? safeJsonParse<LabelElement[]>(template.elements, [])
          : ((template.elements as LabelElement[]) || []),
      config: {
        width: toSafeMoney(template.width, 100),
        height: toSafeMoney(template.height, 60),
      },
    }));
  }, [libraryTemplatesRaw]);

  const paymentMethods = useMemo(
    () =>
      ((paymentMethodsRaw as Record<string, unknown>[]) || []).map((method) => ({
        id: String(method.id || ""),
        name: String(method.name || method.brandName || ""),
        brandName: typeof method.brandName === "string" ? method.brandName : null,
      })),
    [paymentMethodsRaw],
  );

  useEffect(() => {
    if (parsedLibrary.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(parsedLibrary[0].id);
    }
  }, [parsedLibrary, selectedTemplateId]);

  useEffect(() => {
    if (order) {
      setEditForm(safeJsonParse<LocalOrderData>(JSON.stringify(order), order));
    }
  }, [order]);

  const activeTemplate = parsedLibrary.find((template) => template.id === selectedTemplateId);
  const labelOrder = useMemo<LabelOrderData | null>(() => {
    if (!selectedItemForLabel || !order) return null;

    const labelItem: LabelOrderItem = {
      id: String(selectedItemForLabel.id || ""),
      quantity: toSafeMoney(selectedItemForLabel.quantity, 1),
      totalPrice: toSafeMoney(selectedItemForLabel.totalPrice),
      dishName: String(
        selectedItemForLabel.dishName ||
          selectedItemForLabel.dish_name ||
          selectedItemForLabel.name ||
          "Prato",
      ),
      name: String(selectedItemForLabel.name || selectedItemForLabel.dishName || "Prato"),
      size_name:
        typeof selectedItemForLabel.size_name === "string"
          ? selectedItemForLabel.size_name
          : undefined,
      options:
        typeof selectedItemForLabel.options === "string" ||
        typeof selectedItemForLabel.options === "object"
          ? (selectedItemForLabel.options as LabelOrderItem["options"])
          : undefined,
      parsedOptions:
        typeof selectedItemForLabel.parsedOptions === "string" ||
        typeof selectedItemForLabel.parsedOptions === "object"
          ? (selectedItemForLabel.parsedOptions as LabelOrderItem["parsedOptions"])
          : undefined,
      packageItems: Array.isArray(selectedItemForLabel.packageItems)
        ? (selectedItemForLabel.packageItems as LabelOrderItem["packageItems"])
        : undefined,
      applied_nutrition: selectedItemForLabel.applied_nutrition,
      appliedNutrition: selectedItemForLabel.appliedNutrition,
    };

    return {
      id: order.id,
      customerName: order.customerName,
      items: [labelItem],
    };
  }, [order, selectedItemForLabel]);
  const { parseContent } = useLabelLogic(labelOrder, 0, 90);

  const labelsCount = useMemo(() => {
    if (!order) return 0;
    try {
      const mapped = {
        id: order.id,
        customerName: order.customerName,
        items: (order.items || []).map((item: any) => ({
          ...item,
          quantity: item.quantity,
          options: item.options,
          parsedOptions: item.parsedOptions,
          packageItems: item.packageItems,
        })),
      };
      return buildFlatLabels(mapped).length;
    } catch (e) {
      console.error("Erro buildFlatLabels no drawer", e);
      return 0;
    }
  }, [order]);

  const handlePrintTicket = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Pedido_${orderId}`,
  });

  const handlePrintLabel = useReactToPrint({
    contentRef: quickLabelRef,
    documentTitle: `Etiqueta_${String(selectedItemForLabel?.dishName || "Item")}`,
  });

  const recalculateTotals = (updatedForm: LocalOrderData) => {
    const subtotal = updatedForm.items.reduce(
      (acc, item) =>
        acc +
        toSafeMoney(item.unitPrice) * toSafeMoney(item.quantity, 1),
      0,
    );
    const total =
      subtotal +
      toSafeMoney(updatedForm.shippingCost) -
      toSafeMoney(updatedForm.discountAmount);

    setEditForm({
      ...updatedForm,
      subtotal,
      total: Math.max(0, total),
    });
  };

  const handleUpdateItemQty = (index: number, qty: number) => {
    if (!editForm) return;
    const updatedItems = [...editForm.items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: Math.max(1, qty),
    };
    recalculateTotals({ ...editForm, items: updatedItems });
  };

  const handleRemoveItem = (index: number) => {
    if (!editForm) return;
    const updatedItems = editForm.items.filter((_, itemIndex) => itemIndex !== index);
    recalculateTotals({ ...editForm, items: updatedItems });
  };

  const handleAddItem = () => {
    if (!editForm || !newItemName.trim()) return;

    const newItem = {
      id: `new-${Date.now()}`,
      dishName: newItemName.trim(),
      name: newItemName.trim(),
      quantity: Math.max(1, newItemQty),
      unitPrice: newItemPrice,
    };

    recalculateTotals({ ...editForm, items: [...editForm.items, newItem] });
    setNewItemName("");
    setNewItemPrice(0);
    setNewItemQty(1);
  };

  const handleSaveEdit = () => {
    if (!editForm || !order) return;
    if (justification.trim().length < 5) {
      toast.error("Preencha uma justificativa com pelo menos 5 caracteres.");
      return;
    }

    const discountAmount = toSafeMoney(editForm.discountAmount);
    const shippingCost = toSafeMoney(editForm.shippingCost);
    const orderTotal = toSafeMoney(order.total);
    const needsConfirmation =
      (orderTotal > 0 && discountAmount / orderTotal > 0.3) ||
      shippingCost > 150;
    const confirmation = needsConfirmation
      ? requestStrongConfirmation("Ajuste financeiro administrativo de alto impacto.")
      : null;
    if (needsConfirmation && !confirmation) {
      return toast.warning("Confirmacao forte cancelada.");
    }

    commitAdministrativeEditMutation.mutate({
      orderId: order.id,
      justification: justification.trim(),
      discountAmount,
      shippingCost,
      ...confirmation,
      items: editForm.items.map((item) => ({
        dishName: String(item.dishName || item.name || "Prato"),
        quantity: toSafeMoney(item.quantity, 1),
        unitPrice: toSafeMoney(item.unitPrice),
      })),
    });
  };

  if (!orderId) return null;
  const isFinalized = order ? isFinalizedOrderStatus(order.status) : false;

  if (isLoading || !order || !editForm) {
    return (
      <div className="fixed inset-0 z-60 flex justify-end">
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative flex w-full max-w-md items-center justify-center border-l bg-white shadow-2xl">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end font-sans text-slate-900">
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden border-l border-slate-200 bg-[#FBFBFC] shadow-2xl">
          <div
            style={{
              position: "absolute",
              top: "-9999px",
              left: "-9999px",
              pointerEvents: "none",
            }}
          >
            <div ref={ticketRef}>
              <OrderPrintTemplate order={order as unknown as TemplateOrderData} />
            </div>
            <div ref={quickLabelRef}>
              {selectedItemForLabel && activeTemplate && (
                <div
                  style={{
                    width: `${activeTemplate.config.width}mm`,
                    height: `${activeTemplate.config.height}mm`,
                    backgroundColor: "white",
                  }}
                >
                  <LabelCanvas
                    elements={activeTemplate.elements}
                    setElements={() => {}}
                    isDesignMode={false}
                    selectedId={null}
                    setSelectedId={() => {}}
                    parseContent={(content) => parseContent(content, 0)}
                    zoom={1}
                    isPrintMode
                  />
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-b border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
                Pedido <span className="text-emerald-600">#{order.id.slice(-6)}</span>
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setIsEditing((prev) => !prev);
                    setJustification("");
                if (order) {
                  setEditForm(safeJsonParse<LocalOrderData>(JSON.stringify(order), order));
                }
                  }}
                  size="sm"
                  disabled={isFinalized}
                  title={isFinalized ? FINALIZED_ORDER_MESSAGE : "Editar"}
                  variant={isEditing ? "destructive" : "outline"}
                  className="h-9 rounded-xl border-slate-200 bg-white text-[10px] font-black uppercase text-slate-800 hover:bg-slate-50 disabled:opacity-40"
                >
                  {isEditing ? (
                    <RotateCcw size={14} className="mr-1 text-red-500" />
                  ) : (
                    <Edit3 size={14} className="mr-1 text-slate-600" />
                  )}
                  {isEditing ? "Cancelar" : "Editar"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-slate-500 hover:bg-slate-100"
                  onClick={onClose}
                >
                  <X size={20} />
                </Button>
              </div>
            </div>

            {!isEditing && (
              <div className="space-y-3">
                {isFinalized && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                      Pedido finalizado
                    </p>
                    <p className="mt-1 text-xs font-bold text-amber-900">
                      {FINALIZED_ORDER_MESSAGE}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <span className="ml-2 text-[10px] font-black uppercase text-slate-500">
                    Status:
                  </span>
                  <select
                    value={String(order.status)}
                    onChange={(event) => onUpdateStatus(String(order.id), event.target.value)}
                    disabled={isFinalized}
                    title={isFinalized ? FINALIZED_ORDER_MESSAGE : "Alterar status"}
                    className="flex-1 cursor-pointer border-none bg-transparent text-xs font-black uppercase text-slate-900 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value} className="text-slate-900">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6 pb-32">
            <AdminOrderCustomer
              order={order}
              isEditing={isEditing}
              editForm={editForm}
              setEditForm={(value: CustomerOrderData) =>
                setEditForm((prev) => (prev ? { ...prev, ...value } : prev))
              }
            />

            {isEditing && (
              <div className="animate-in fade-in rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-left shadow-sm duration-200">
                <div className="mb-2 flex items-center gap-2 text-amber-800">
                  <AlertCircle size={16} className="shrink-0 text-amber-600" />
                  <span className="block text-[10px] font-black uppercase tracking-widest">
                    Justificativa da edição (Obrigatório)
                  </span>
                </div>
                <textarea
                  value={justification}
                  onChange={(event) => setJustification(event.target.value)}
                  placeholder="Digite o motivo da alteração comercial ou de prato..."
                  className="w-full resize-none rounded-xl border border-amber-200 bg-white p-3 text-xs font-bold text-slate-800 shadow-inner outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                />
              </div>
            )}

            {typeof order.notes === "string" && order.notes.trim() && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Histórico de alterações
                </span>
                <div className="custom-scrollbar max-h-32 overflow-y-auto whitespace-pre-wrap text-xs font-bold leading-relaxed text-slate-700">
                  {String(order.notes || "")}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <AdminOrderItems
                items={editForm.items as unknown as DrawerOrderItem[]}
                isEditing={isEditing}
                onPrintLabel={(item) => {
                  setSelectedItemForLabel(item as unknown as Record<string, unknown>);
                  setPrintModalOpen(true);
                }}
                onUpdateQuantity={handleUpdateItemQty}
                onRemoveItem={handleRemoveItem}
              />

              {isEditing && (
                <div className="space-y-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-left">
                  <p className="text-[9px] font-black uppercase text-slate-500">
                    Inclusão manual expressa
                  </p>
                  <Input
                    placeholder="Nome da marmita/combo..."
                    value={newItemName}
                    onChange={(event) => setNewItemName(event.target.value)}
                    className="h-9 border-slate-200 bg-white text-xs font-bold text-slate-900"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Preço"
                      value={newItemPrice || ""}
                      onChange={(event) => setNewItemPrice(toSafeMoney(event.target.value))}
                      className="h-9 border-slate-200 bg-white text-xs font-bold text-slate-900"
                    />
                    <Input
                      type="number"
                      placeholder="Qtd"
                      value={newItemQty}
                      onChange={(event) => setNewItemQty(toSafeMoney(event.target.value, 1))}
                      className="h-9 border-slate-200 bg-white text-xs font-bold text-slate-900"
                    />
                    <Button
                      onClick={handleAddItem}
                      className="h-9 rounded-xl bg-slate-900 px-4 text-[10px] font-black uppercase text-white hover:bg-slate-800"
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* CENTRAL DE IMPRESSÃO */}
            {!isEditing && (
              <Accordion type="single" collapsible className="w-full mb-4">
                <AccordionItem value="print-center" className="border-none">
                  <AccordionTrigger className="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 shadow-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Printer size={14} className="text-emerald-500" />
                      <span>Impressões</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="mt-2 space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left">
                    {/* Bloco 1: Nota de Entrega */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Printer size={14} className="text-slate-500" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Nota de Entrega / Expedição
                        </h4>
                      </div>
                      <p className="text-[10px] font-bold leading-normal text-slate-500">
                        Impressão comercial para conferência, separação e entrega.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          onClick={handlePrintTicket}
                          className="h-9 rounded-xl bg-slate-900 px-4 text-[10px] font-black uppercase text-white hover:bg-slate-800"
                        >
                          <Printer size={12} className="mr-1.5" />
                          Imprimir Nota
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(`/admin/orders/${order.id}/print`, "_blank")}
                          className="h-9 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase text-slate-800 hover:bg-slate-50"
                        >
                          <ExternalLink size={12} className="mr-1.5" />
                          Abrir Central de Impressão
                        </Button>
                      </div>
                    </div>

                    <div className="border-t border-slate-200/60 my-2" />

                    {/* Bloco 2: Etiquetas Zebra */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-slate-500" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Etiquetas Zebra
                        </h4>
                      </div>
                      <p className="text-[10px] font-bold leading-normal text-slate-500">
                        Etiquetas térmicas individuais das marmitas e itens.
                      </p>
                      {order && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                          Este pedido gera {labelsCount} etiqueta{labelsCount > 1 || labelsCount === 0 ? "s" : ""}.
                        </p>
                      )}
                      <div className="pt-1">
                        <Button
                          onClick={() => window.open(`/admin/labels/editor/production/${order.id}`, "_blank")}
                          className="h-9 w-full rounded-xl bg-emerald-600 px-4 text-[10px] font-black uppercase text-white hover:bg-emerald-500"
                        >
                          <ExternalLink size={12} className="mr-1.5" />
                          Preparar e Imprimir Etiquetas Zebra
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            <AdminOrderPayment
              order={isEditing ? editForm : order}
              isEditing={isEditing}
              isUpdating={commitAdministrativeEditMutation.isPending || isUpdating}
              onSave={handleSaveEdit}
              onPrint={handlePrintTicket}
              paymentMethods={paymentMethods}
              onOrderChange={(patch) => {
                if (!editForm) return;
                recalculateTotals({
                  ...editForm,
                  ...patch,
                  subtotal: toSafeMoney(patch.subtotal, editForm.subtotal),
                  total: toSafeMoney(patch.total, editForm.total),
                  shippingCost: toSafeMoney(
                    patch.shippingCost,
                    editForm.shippingCost,
                  ),
                  discountAmount: toSafeMoney(
                    patch.discountAmount,
                    editForm.discountAmount,
                  ),
                });
              }}
            />
          </div>
        </div>
      </div>

      <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
        <DialogContent className="z-100 max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase italic text-slate-900">
              <Tag size={18} className="text-emerald-500" />
              Etiqueta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-left">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span className="mb-1 block text-[9px] font-black uppercase text-slate-500">
                Item
              </span>
              <p className="line-clamp-2 text-xs font-bold uppercase text-slate-900">
                {String(selectedItemForLabel?.dishName || selectedItemForLabel?.name || "")}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500">
                Layout
              </label>
              {parsedLibrary.length > 0 && (
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 hover:bg-slate-50">
                    <SelectValue className="text-slate-900" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
                    {parsedLibrary.map((template) => (
                      <SelectItem
                        key={template.id}
                        value={template.id}
                        className="cursor-pointer py-2.5 text-xs font-bold uppercase text-slate-900 focus:bg-slate-100 focus:text-slate-900"
                      >
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button
              onClick={() => handlePrintLabel()}
              disabled={!selectedTemplateId}
              className="h-12 w-full rounded-xl bg-slate-900 text-[10px] font-black uppercase text-white shadow-lg transition-all hover:bg-emerald-600"
            >
              <Printer size={16} className="mr-2" />
              Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
