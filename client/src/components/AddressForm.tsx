import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/_core/trpc";    
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { appToast } from "@/lib/app-toast";

// --- INTERFACES & SCHEMAS ---

const addressSchema = z.object({
  label: z.string().min(1, "Dê um nome para este endereço (ex: Casa, Trabalho)"),
  zipCode: z.string().min(8, "CEP inválido"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 letras"),
  phone: z.string().optional().nullable(),
  isDefault: z.boolean().default(false).optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressInitialData extends Partial<AddressFormData> {
  id?: number;
  address?: string;
}

interface AddressFormProps {
  onSuccess?: () => void;
  onCancel?: () => void; 
  initialData?: AddressInitialData; 
  userId?: number; 
}

interface ToastOptions {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

// Mock interface for the dynamic/missing TRPC router part
interface TrpcProcedure<Input, Output> {
  useMutation: (opts?: { 
    onSuccess?: (data: Output) => void; 
    onError?: (error: Error) => void;
  }) => { 
    mutate: (variables: Input) => void; 
    isPending: boolean; 
  };
}

interface AddressRouter {
  create: TrpcProcedure<unknown, unknown>;
  update: TrpcProcedure<unknown, unknown>;
  list: { invalidate: () => void };
}

interface AuthRouter {
  addresses?: AddressRouter;
}

export function AddressForm({ onSuccess, onCancel, initialData, userId }: AddressFormProps) {
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const utils = trpc.useUtils();

  const safeToast = (opts: ToastOptions) => {
    if (opts.variant === "destructive") {
      appToast.error(opts.title, { description: opts.description });
    } else {
      appToast.success(opts.title, { description: opts.description });
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      ...initialData,
      street: initialData?.street || initialData?.address || "", 
      complement: initialData?.complement || null,
      phone: initialData?.phone || null,
      isDefault: initialData?.isDefault || false,
    },
  });

  const zipCode = watch("zipCode");

  // Busca de CEP
  useEffect(() => {
    const cleanZip = zipCode?.replace(/\D/g, "");
    if (cleanZip && cleanZip.length === 8) {
      setIsFetchingCep(true);
      
      fetch(`https://viacep.com.br/ws/${cleanZip}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.erro) {
            if (!watch("street")) setValue("street", data.logradouro);
            if (!watch("neighborhood")) setValue("neighborhood", data.bairro);
            if (!watch("city")) setValue("city", data.localidade);
            if (!watch("state")) setValue("state", data.uf);
            safeToast({ title: "Sucesso", description: "CEP encontrado!" });
          } else {
            safeToast({ variant: "destructive", title: "Erro", description: "Endereço não encontrado." });
          }
        })
        .catch(() => safeToast({ variant: "destructive", title: "Erro", description: "Falha ao buscar CEP" }))
        .finally(() => setIsFetchingCep(false));
    }
  }, [zipCode, setValue, watch]);

  const authRouter = (trpc.auth as unknown) as AuthRouter;
  const authUtils = (utils.auth as unknown) as AuthRouter;

  const createMutation = authRouter.addresses?.create.useMutation({
    onSuccess: () => {
      safeToast({ title: "Sucesso", description: "Endereço salvo!" });
      authUtils.addresses?.list.invalidate(); 
      if (onSuccess) onSuccess();
      reset();
    },
    onError: (err: Error) => safeToast({ variant: "destructive", title: "Erro", description: err.message }),
  });

  const updateMutation = authRouter.addresses?.update.useMutation({
    onSuccess: () => {
      safeToast({ title: "Sucesso", description: "Endereço atualizado!" });
      authUtils.addresses?.list.invalidate();
      if (onSuccess) onSuccess();
    },
    onError: (err: Error) => safeToast({ variant: "destructive", title: "Erro", description: err.message }),
  });

  const onSubmit = (data: AddressFormData) => {
    const payload = {
        ...data,
        complement: data.complement || null,
        phone: data.phone || null,
        ...(userId && { userId: userId }),
    };

    if (initialData?.id) {
        updateMutation?.mutate({ id: initialData.id, ...payload });
    } else {
        createMutation?.mutate(payload);
    }
  };

  const isSubmitting = createMutation?.isPending || updateMutation?.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="label">Identificação (ex: Minha Casa)</Label>
          <Input id="label" {...register("label")} placeholder="Minha Casa" />
          {errors.label && <p className="text-xs text-red-500">{errors.label.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">CEP</Label>
          <div className="relative">
            <Input id="zipCode" {...register("zipCode")} placeholder="00000-000" maxLength={9} />
            {isFetchingCep && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          {errors.zipCode && <p className="text-xs text-red-500">{errors.zipCode.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone para Contato</Label>
          <Input id="phone" {...register("phone")} placeholder="(11) 99999-9999" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="street">Endereço</Label>
          <Input id="street" {...register("street")} placeholder="Rua, Avenida..." />
          {errors.street && <p className="text-xs text-red-500">{errors.street.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="number">Número</Label>
          <Input id="number" {...register("number")} placeholder="123" />
          {errors.number && <p className="text-xs text-red-500">{errors.number.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input id="complement" {...register("complement")} placeholder="Apto 101" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input id="neighborhood" {...register("neighborhood")} />
          {errors.neighborhood && <p className="text-xs text-red-500">{errors.neighborhood.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" {...register("city")} />
          {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">Estado (UF)</Label>
          <Input id="state" {...register("state")} maxLength={2} placeholder="SP" />
          {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-2 py-2">
        <Checkbox 
            id="isDefault" 
            checked={watch("isDefault") || false} 
            onCheckedChange={(checked) => setValue("isDefault", checked as boolean)} 
        />
        <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
          Definir como endereço padrão
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
            </Button>
        )}
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {initialData?.id ? "Atualizar Endereço" : "Cadastrar Endereço"}
        </Button>
      </div>
    </form>
  );
}