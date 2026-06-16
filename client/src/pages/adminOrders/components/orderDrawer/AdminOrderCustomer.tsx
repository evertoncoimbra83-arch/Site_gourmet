import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  User,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { appToast as toast } from "@/lib/app-toast";

export interface CustomerOrderData {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingAddressNumber?: string;
  shippingAddressComplement?: string;
  shippingNeighborhood?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZipCode?: string;
  deliveryType?: "pickup" | "delivery";
  notes?: string;
  [key: string]: unknown;
}

interface AdminOrderCustomerProps {
  order: CustomerOrderData;
  isEditing: boolean;
  editForm: CustomerOrderData;
  setEditForm: (val: CustomerOrderData) => void;
}

function updateField(
  editForm: CustomerOrderData,
  setEditForm: (val: CustomerOrderData) => void,
  key: keyof CustomerOrderData,
  value: string,
) {
  setEditForm({ ...editForm, [key]: value });
}

function maskCep(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{5})(\d)/, "$1-$2")
    .slice(0, 9);
}

export function AdminOrderCustomer({
  order,
  isEditing,
  editForm,
  setEditForm,
}: AdminOrderCustomerProps) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const lastFetchedCepRef = useRef("");
  const displayData = isEditing ? editForm : order;

  useEffect(() => {
    if (!isEditing) return;
    const cleanZip = String(editForm.shippingZipCode || "").replace(/\D/g, "");
    if (cleanZip.length !== 8 || cleanZip === lastFetchedCepRef.current) return;

    const controller = new AbortController();
    lastFetchedCepRef.current = cleanZip;

    const fetchAddress = async () => {
      setIsFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (data?.erro) {
          toast.error("CEP nao encontrado. Preencha o endereco manualmente.");
          return;
        }

        setEditForm({
          ...editForm,
          shippingAddress: data.logradouro || editForm.shippingAddress || "",
          shippingNeighborhood: data.bairro || editForm.shippingNeighborhood || "",
          shippingCity: data.localidade || editForm.shippingCity || "",
          shippingState: data.uf || editForm.shippingState || "",
          shippingZipCode: maskCep(cleanZip),
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          toast.error("Erro ao buscar CEP. Preencha o endereco manualmente.");
        }
      } finally {
        setIsFetchingCep(false);
      }
    };

    fetchAddress();
    return () => controller.abort();
  }, [editForm, isEditing, setEditForm]);

  const fullAddress = useMemo(() => {
    return [
      displayData.shippingAddress,
      displayData.shippingAddressNumber,
      displayData.shippingNeighborhood,
      displayData.shippingCity,
      displayData.shippingState,
      displayData.shippingZipCode,
    ]
      .filter(Boolean)
      .join(", ");
  }, [
    displayData.shippingAddress,
    displayData.shippingAddressNumber,
    displayData.shippingNeighborhood,
    displayData.shippingCity,
    displayData.shippingState,
    displayData.shippingZipCode,
  ]);

  const googleMapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null;

  const cleanPhone = displayData.customerPhone?.replace(/\D/g, "") || "";
  const whatsappUrl = cleanPhone ? `https://wa.me/55${cleanPhone}` : null;

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 text-left shadow-sm">
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <User size={14} className="text-slate-700" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Cliente
            </h3>
          </div>

          {isEditing ? (
            <div className="grid gap-3">
              <Input
                value={editForm.customerName || ""}
                onChange={(event) =>
                  updateField(editForm, setEditForm, "customerName", event.target.value)
                }
                placeholder="Nome do cliente"
                className="h-10 rounded-xl border-slate-200 bg-white text-xs font-bold uppercase text-slate-900 placeholder:text-slate-400"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={editForm.customerEmail || ""}
                  onChange={(event) =>
                    updateField(editForm, setEditForm, "customerEmail", event.target.value)
                  }
                  placeholder="E-mail"
                  className="h-10 rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-900 placeholder:text-slate-400"
                />
                <Input
                  value={editForm.customerPhone || ""}
                  onChange={(event) =>
                    updateField(editForm, setEditForm, "customerPhone", event.target.value)
                  }
                  placeholder="Telefone"
                  className="h-10 rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-black uppercase italic leading-none text-slate-900">
                {displayData.customerName || "Cliente não identificado"}
              </p>

              {displayData.customerEmail && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail size={12} className="text-slate-500" />
                  <span className="text-[11px] font-bold text-slate-800">
                    {displayData.customerEmail}
                  </span>
                </div>
              )}

              {displayData.customerPhone && (
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="flex items-center gap-2 text-slate-800 transition-colors hover:text-emerald-700"
                    title="Ligar para o cliente"
                  >
                    <Phone size={12} className="text-slate-500" />
                    <span className="text-[11px] font-black">{displayData.customerPhone}</span>
                  </a>

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      WhatsApp
                      <ExternalLink size={8} />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <MapPin size={14} className="text-slate-700" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {displayData.deliveryType === "pickup" ? "Retirada" : "Endereço de entrega"}
            </h3>
          </div>

          {isEditing ? (
            <div className="grid gap-3">
              <div className="relative">
                <Input
                  value={editForm.shippingZipCode || ""}
                  onChange={(event) =>
                    updateField(
                      editForm,
                      setEditForm,
                      "shippingZipCode",
                      maskCep(event.target.value),
                    )
                  }
                  placeholder="CEP"
                  maxLength={9}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50 pr-9 text-xs font-bold text-slate-900 placeholder:text-slate-400"
                />
                {isFetchingCep && (
                  <Loader2
                    size={14}
                    className="absolute right-3 top-3 animate-spin text-emerald-500"
                  />
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                <Input
                  value={editForm.shippingAddress || ""}
                  onChange={(event) =>
                    updateField(editForm, setEditForm, "shippingAddress", event.target.value)
                  }
                  placeholder="Rua / Avenida"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 placeholder:text-slate-400"
                />
                <Input
                  value={editForm.shippingAddressNumber || ""}
                  onChange={(event) =>
                    updateField(
                      editForm,
                      setEditForm,
                      "shippingAddressNumber",
                      event.target.value,
                    )
                  }
                  placeholder="Número"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <Input
                value={editForm.shippingAddressComplement || ""}
                onChange={(event) =>
                  updateField(
                    editForm,
                    setEditForm,
                    "shippingAddressComplement",
                    event.target.value,
                  )
                }
                placeholder="Complemento"
                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 placeholder:text-slate-400"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={editForm.shippingNeighborhood || ""}
                  onChange={(event) =>
                    updateField(
                      editForm,
                      setEditForm,
                      "shippingNeighborhood",
                      event.target.value,
                    )
                  }
                  placeholder="Bairro"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_90px]">
                <Input
                  value={editForm.shippingCity || ""}
                  onChange={(event) =>
                    updateField(editForm, setEditForm, "shippingCity", event.target.value)
                  }
                  placeholder="Cidade"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 placeholder:text-slate-400"
                />
                <Input
                  value={editForm.shippingState || ""}
                  onChange={(event) =>
                    updateField(editForm, setEditForm, "shippingState", event.target.value)
                  }
                  placeholder="UF"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {googleMapsUrl ? (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group block rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
                  title="Abrir no Google Maps"
                >
                  <div className="flex items-start gap-2">
                    <p className="text-[11px] font-bold uppercase leading-tight text-slate-900 group-hover:text-blue-700">
                      {displayData.shippingAddress || "Endereço não informado"}
                      {displayData.shippingAddressNumber
                        ? `, ${displayData.shippingAddressNumber}`
                        : ""}
                      {displayData.shippingAddressComplement
                        ? ` - ${displayData.shippingAddressComplement}`
                        : ""}
                    </p>
                    <ExternalLink
                      size={10}
                      className="mt-0.5 shrink-0 text-slate-500 group-hover:text-blue-600"
                    />
                  </div>

                  <p className="mt-1 text-[10px] font-bold uppercase text-slate-600">
                    {displayData.shippingNeighborhood || "Bairro não informado"}
                    {displayData.shippingCity ? `, ${displayData.shippingCity}` : ""}
                    {displayData.shippingState ? `/${displayData.shippingState}` : ""}
                  </p>

                  {displayData.shippingZipCode && (
                    <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-slate-500">
                      CEP {displayData.shippingZipCode}
                    </p>
                  )}
                </a>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[10px] font-bold uppercase text-slate-500">
                  Endereço não informado.
                </div>
              )}

              {displayData.deliveryType === "pickup" && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-black uppercase text-amber-800">
                    Cliente retira no balcão
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {displayData.notes && String(displayData.notes).trim() !== "" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={() => setIsNotesOpen((prev) => !prev)}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-slate-700" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Observações do cliente
                </h3>
              </div>
              {isNotesOpen ? (
                <ChevronUp size={14} className="text-slate-500" />
              ) : (
                <ChevronDown size={14} className="text-slate-500" />
              )}
            </button>

            {isNotesOpen && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-medium leading-relaxed italic text-slate-800">
                  &quot;{String(displayData.notes)}&quot;
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
