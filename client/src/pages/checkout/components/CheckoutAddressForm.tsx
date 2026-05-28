// client/src/pages/checkout/components/CheckoutAddressForm.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, X, Navigation, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appToast as toast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";

import { trpc } from "@/_core/trpc";
import { useCheckout } from "../context/CheckoutContext";
import { useGeolocationZip } from "@/_core/hooks/useGeolocationZip";

const maskCep = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{5})(\d)/, "$1-$2")
    .slice(0, 9);
};

interface AddressFormData {
  label: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CheckoutAddressFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CheckoutAddressForm({
  onSuccess,
  onCancel,
}: CheckoutAddressFormProps) {
  const { actions, machineState } = useCheckout();
  const utils = trpc.useUtils();

  const {
    cep: geoCep,
    loading: geoLoading,
    getZipFromCoords,
  } = useGeolocationZip();

  const [form, setForm] = useState<AddressFormData>({
    label: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isValidatingLogistics, setIsValidatingLogistics] = useState(false);
  const toastDispatched = useRef(false);

  useEffect(() => {
    if (!toastDispatched.current) {
      toastDispatched.current = true;
      const timer = setTimeout(() => {
        toast("Consulta automática de CEP?", {
          description: "Podemos usar sua localização para preencher os dados?",
          action: {
            label: "Sim, buscar",
            onClick: () => getZipFromCoords(),
          },
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [getZipFromCoords]);

  useEffect(() => {
    if (geoCep) {
      setForm((prev) => ({ ...prev, zipCode: maskCep(geoCep) }));
    }
  }, [geoCep]);

  const createAddressMutation = trpc.store.addresses.create.useMutation({
    onSuccess: (res) => {
      toast.success("Endereço salvo com sucesso!");
      actions.setAddress(String(res.id));
      utils.store.addresses.list.invalidate();
      onSuccess();
    },
    onError: (err) => {
      toast.error("Erro ao salvar endereço", { description: err.message });
    },
  });

  useEffect(() => {
    const cleanZip = form.zipCode.replace(/\D/g, "");
    if (cleanZip.length === 8) {
      const controller = new AbortController();
      const fetchAddress = async () => {
        setIsLoadingCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`, {
            signal: controller.signal,
          });
          const data = await response.json();
          if (!data.erro) {
            setForm((prev) => ({
              ...prev,
              street: data.logradouro || prev.street,
              neighborhood: data.bairro || prev.neighborhood,
              city: data.localidade || prev.city,
              state: data.uf || prev.state,
            }));
            setTimeout(() => document.getElementById("address-number")?.focus(), 200);
          } else {
            toast.error("CEP não localizado.");
          }
        } catch (e) {
          if (!(e instanceof DOMException && e.name === "AbortError")) {
            toast.error("Erro ao buscar CEP.");
          }
        } finally {
          setIsLoadingCep(false);
        }
      };
      fetchAddress();
      return () => controller.abort();
    }
  }, [form.zipCode]);

  const handleSave = useCallback(async () => {
    const cleanZipCode = form.zipCode.replace(/\D/g, "");
    const trimmedStreet = form.street.trim();
    const trimmedNumber = form.number.trim();
    const trimmedCity = form.city.trim();
    const trimmedState = form.state.trim().toUpperCase();

    if (cleanZipCode.length !== 8) return toast.warning("CEP incompleto.");
    if (!trimmedStreet || !trimmedNumber || !trimmedCity || !trimmedState) {
      return toast.error("Preencha os campos obrigatórios.");
    }
    if (trimmedState.length !== 2) {
      return toast.error("Estado deve ter 2 letras.");
    }

    setIsValidatingLogistics(true);

    try {
      const validation = await utils.store.addresses.validateZipZone.fetch({
        zipCode: cleanZipCode,
        storeSlug: "jundiai",
      });

      if (!validation.isValid) {
        toast.warning("Entrega indisponível para este CEP", {
          description:
            "O endereço será salvo, mas pedidos para este CEP devem usar retirada ou outro endereço.",
          icon: <AlertCircle className="text-rose-500" />,
          duration: 6000,
        });
      }

      createAddressMutation.mutate({
        ...form,
        street: trimmedStreet,
        number: trimmedNumber,
        city: trimmedCity,
        state: trimmedState,
        label: form.label.trim() || "Entrega",
        zipCode: cleanZipCode,
      });
    } catch {
      toast.error("Erro ao validar logística", {
        description: "Não conseguimos verificar a cobertura agora.",
      });
    } finally {
      setIsValidatingLogistics(false);
    }
  }, [form, createAddressMutation, utils, actions]);

  const isBusy =
    createAddressMutation.isPending ||
    isLoadingCep ||
    geoLoading ||
    isValidatingLogistics ||
    machineState === "submitting";

  return (
    <div className="p-6 border-2 border-emerald-100 rounded-4xl bg-white shadow-2xl space-y-6 text-left relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl text-white">
            <Navigation size={18} className={cn(isBusy && "animate-pulse")} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-600 block leading-none mb-1">
              Novo Endereço
            </span>
            <h3 className="text-slate-900 font-bold text-lg leading-none">
              Onde você está?
            </h3>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-300 hover:text-red-500 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-4 md:col-span-1 space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-slate-400">
            CEP
          </Label>
          <div className="relative">
            <Input
              value={form.zipCode}
              onChange={(e) =>
                setForm({ ...form, zipCode: maskCep(e.target.value) })
              }
              className="h-12 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 font-bold"
              placeholder="00000-000"
              maxLength={9}
            />
            {isBusy && (
              <Loader2
                size={16}
                className="absolute right-3 top-3.5 animate-spin text-emerald-500"
              />
            )}
          </div>
        </div>

        <div className="col-span-4 md:col-span-3 space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-slate-400">
            Nome (Ex: Casa, Trabalho)
          </Label>
          <Input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="h-12 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 font-bold"
          />
        </div>

        <div className="col-span-4 md:col-span-3 space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-slate-400">
            Rua / Avenida
          </Label>
          <Input
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            className="h-12 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 font-bold"
          />
        </div>

        <div className="col-span-4 md:col-span-1 space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-slate-400">
            Nº
          </Label>
          <Input
            id="address-number"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            className="h-12 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 font-bold"
          />
        </div>

        <div className="col-span-4 md:col-span-2 space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-slate-400">
            Bairro
          </Label>
          <Input
            value={form.neighborhood}
            onChange={(e) =>
              setForm({ ...form, neighborhood: e.target.value })
            }
            className="h-12 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 font-bold"
          />
        </div>

        <div className="col-span-4 md:col-span-2 space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-slate-400">
            Complemento
          </Label>
          <Input
            value={form.complement}
            onChange={(e) => setForm({ ...form, complement: e.target.value })}
            className="h-12 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 font-bold"
          />
        </div>

        <div className="col-span-4 md:col-span-2 space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-slate-400">
            Cidade
          </Label>
          <Input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="h-12 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 font-bold"
            placeholder="Jundiaí"
          />
        </div>

        <div className="col-span-4 md:col-span-2 space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-slate-400">
            Estado (UF)
          </Label>
          <Input
            value={form.state}
            onChange={(e) =>
              setForm({
                ...form,
                state: e.target.value
                  .replace(/[^a-zA-Z]/g, "")
                  .toUpperCase()
                  .slice(0, 2),
              })
            }
            className="h-12 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 font-bold uppercase"
            placeholder="SP"
            maxLength={2}
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t border-slate-100">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isBusy}
          className="flex-1 h-14 rounded-2xl text-slate-400 font-bold uppercase text-[10px] tracking-widest"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isBusy}
          className="flex-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl h-14 font-black uppercase text-[10px] shadow-xl transition-all active:scale-95"
        >
          {createAddressMutation.isPending || isValidatingLogistics ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            "Confirmar Endereço"
          )}
        </Button>
      </div>
    </div>
  );
}
