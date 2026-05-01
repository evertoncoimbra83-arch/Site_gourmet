import React from "react"; // ✅ Adicionado React para escopo JSX
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save } from "lucide-react"; // ✅ Removido MapPin (não usado)

const addressSchema = z.object({
  label: z.string().min(1, "Dê um nome ao local (ex: Casa, Trabalho)"),
  zipCode: z.string().min(8, "CEP inválido"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().length(2, "UF deve ter 2 letras"),
  complement: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => Promise<void>;
  isLoading: boolean;
}

export function AddressForm({ onSubmit, isLoading }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const checkCEP = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setValue("street", data.logradouro, { shouldValidate: true });
        setValue("neighborhood", data.bairro, { shouldValidate: true });
        setValue("city", data.localidade, { shouldValidate: true });
        setValue("state", data.uf, { shouldValidate: true });
      }
    } catch {
      // ✅ Removido 'err' não utilizado
      console.error("Erro ao buscar CEP");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
      <div className="grid grid-cols-12 gap-x-3 gap-y-4 md:gap-x-4 md:gap-y-6">
        
        {/* Nome do Local */}
        <div className="col-span-12 space-y-1.5">
          <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            Identificação (ex: Casa, Trabalho)
          </label>
          <Input 
            {...register("label")} 
            placeholder="Ex: Minha Casa"
            className="rounded-xl md:rounded-2xl border-slate-100 bg-slate-50 h-11 md:h-12 focus:bg-white transition-all font-bold text-slate-700"
          />
          {errors.label && <p className="text-red-500 text-[9px] font-bold uppercase ml-1">{errors.label.message}</p>}
        </div>

        {/* CEP */}
        <div className="col-span-12 md:col-span-5 space-y-1.5">
          <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CEP</label>
          <Input 
            {...register("zipCode")} 
            onBlur={checkCEP}
            placeholder="00000-000"
            inputMode="numeric"
            className="rounded-xl md:rounded-2xl border-slate-100 bg-slate-50 h-11 md:h-12 focus:bg-white transition-all font-bold text-slate-700"
          />
          {errors.zipCode && <p className="text-red-500 text-[9px] font-bold uppercase ml-1">{errors.zipCode.message}</p>}
        </div>

        {/* Rua */}
        <div className="col-span-12 md:col-span-7 space-y-1.5">
          <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rua / Logradouro</label>
          <Input 
            {...register("street")} 
            placeholder="Nome da rua"
            className="rounded-xl md:rounded-2xl border-slate-100 bg-slate-50 h-11 md:h-12 focus:bg-white transition-all font-bold text-slate-700"
          />
          {errors.street && <p className="text-red-500 text-[9px] font-bold uppercase ml-1">{errors.street.message}</p>}
        </div>

        {/* Número */}
        <div className="col-span-5 md:col-span-4 space-y-1.5">
          <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Número</label>
          <Input 
            {...register("number")} 
            placeholder="123"
            className="rounded-xl md:rounded-2xl border-slate-100 bg-slate-50 h-11 md:h-12 focus:bg-white transition-all font-bold text-slate-700"
          />
          {errors.number && <p className="text-red-500 text-[9px] font-bold uppercase ml-1">{errors.number.message}</p>}
        </div>

        {/* Complemento */}
        <div className="col-span-7 md:col-span-8 space-y-1.5">
          <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Complemento</label>
          <Input 
            {...register("complement")} 
            placeholder="Apto, Bloco..."
            className="rounded-xl md:rounded-2xl border-slate-100 bg-slate-50 h-11 md:h-12 focus:bg-white transition-all font-bold text-slate-700"
          />
        </div>

        {/* Bairro */}
        <div className="col-span-12 md:col-span-6 space-y-1.5">
          <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bairro</label>
          <Input 
            {...register("neighborhood")} 
            className="rounded-xl md:rounded-2xl border-slate-100 bg-slate-50 h-11 md:h-12 focus:bg-white transition-all font-bold text-slate-700"
          />
          {errors.neighborhood && <p className="text-red-500 text-[9px] font-bold uppercase ml-1">{errors.neighborhood.message}</p>}
        </div>

        {/* Cidade e UF */}
        <div className="col-span-12 md:col-span-6 grid grid-cols-12 gap-2 md:gap-3">
          <div className="col-span-8 md:col-span-9 space-y-1.5">
            <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cidade</label>
            <Input 
              {...register("city")} 
              className="rounded-xl md:rounded-2xl border-slate-100 bg-slate-50 h-11 md:h-12 focus:bg-white transition-all font-bold text-slate-700"
            />
          </div>
          <div className="col-span-4 md:col-span-3 space-y-1.5">
            <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 text-center block">UF</label>
            <Input 
              {...register("state")} 
              placeholder="UF"
              maxLength={2}
              className="rounded-xl md:rounded-2xl border-slate-100 bg-slate-50 h-11 md:h-12 text-center uppercase focus:bg-white transition-all font-bold text-slate-700"
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full rounded-2xl md:rounded-[2rem] bg-slate-900 hover:bg-black text-white font-black uppercase text-[11px] md:text-[12px] tracking-[0.2em] h-12 md:h-14 shadow-lg active:scale-95 transition-all"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              <span>Salvar Endereço</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}